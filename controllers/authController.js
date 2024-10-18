const { User } = require("../models/userModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { validateEmail } = require("../utils/stringValidation")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// login will send access token as json and refresh token as cookie
const login = async (req, res) => {
    try {
        // get JSON body
        const {
            user,
            pwd 
        } = req.body;

        // Check input's completeness
        if (!user ||
            !pwd
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: user and pwd are needed"
        });
        
        // Check if user is in the database
        const identifierType = (validateEmail(user)) ? "email": "username";
        const foundUser = await User.findOne({[identifierType]: user}); 
        if (!foundUser) return res.status(401).json({
            "status": "error",
            "message": "User is not in the system"
        });
        
        // Check if pwd match the user's password
        const match = await bcrypt.compare(pwd, foundUser.password);
        if (match) {
            const accessToken = generateAccessToken(foundUser._id);
            const refreshToken = generateRefreshToken(foundUser._id);

            // Update refresh token
            foundUser.refreshToken = refreshToken;
            await foundUser.save();

            res.cookie("jwt", refreshToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // in millisecond
            });
            res.status(200).json({ 
                "status": "success",
                "message": `User ${foundUser.username} logged in`,
                "access token": accessToken
            });
        }
        else {
            res.status(401).json({
                "status": "error",
                "message": "Password is incorrect"
            });
        }
    } 
    catch(err){
        console.error("Unexpected error at login endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at login endpoint"
        });
    }
};


const logout = async (req, res) =>{
    try {
        // in case that there is no refresh token in the cookie
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.status(204).json({
            "status": "success",
            "message": "No jwt header in cookie"
        });
        
        // in case that the user is no longer in the system
        const refreshToken = cookies.jwt;
        const foundUser = await User.findOne({"refreshToken": refreshToken});
        if (!foundUser){
            res.clearCookie("jwt", { httpOnly: true});
            return res.status(204).json({
                "status": "success",
                "message": "User is deleted"
            });
        }

        foundUser.refreshToken = "";
        await foundUser.save();
        res.clearCookie("jwt", { httpOnly: true}); // add secure: true to make it https
        res.sendStatus(204).json({
            "status": "success",
            "message": `User ${foundUser.username} logged out`
        });
    }
    catch(err){
        console.error("Unexpected error at logout endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at logout endpoint"
        });
    }
};


const handleRefreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.status(401).json({
            "status": "error",
            "message": "Unauthorized"
        });
        const refreshToken = cookies.jwt;
        
        const foundUser = await User.findOne({"refreshToken": refreshToken});
        if (!foundUser) return res.status(401).json({
            "status": "error",
            "message": "Unauthorized"
        });

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || JSON.stringify(foundUser._id) !== JSON.stringify(decoded.userID)) return res.json({
                    "status": "error",
                    "message": "Unauthorized"
                });
                const accessToken = generateAccessToken(foundUser._id);
                res.json({
                    "status": "success",
                    "message": "Access token refreshed",
                    "access token": accessToken
                });
            }
        );
    }
    catch(err){
        console.error("Unexpected error at access token refreshment endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at access token refreshment endpoint"
        });
    }
};

module.exports = { login, logout, handleRefreshToken };