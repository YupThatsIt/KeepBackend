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
        const { user, pwd } = req.body;
        if (!user || !pwd) return res.status(400).send("Username/email and password are required!"); // send error back as json
        
        let foundUser;
        if (validateEmail(user)) foundUser = await User.findOne({"email": user});
        else foundUser = await User.findOne({"username": user}); 
        if (!foundUser) return res.sendStatus(401); // unauthorized, no user found
        
        const match = await bcrypt.compare(pwd, foundUser.password);
        if (match) {
            // create JWTs
            const accessToken = generateAccessToken(foundUser._id);
            const refreshToken = generateRefreshToken(foundUser._id);
            foundUser.refreshToken = refreshToken;
            await foundUser.save(); // save the refresh token in the user database. DON'T FORGET .save()

            console.log(`User ${foundUser.username} logged in`);
            res.cookie("jwt", refreshToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // in millisecond
            });
            res.json({ accessToken }); // send the tokens to client
        }
        else {
            res.sendStatus(401);
        }
    } 
    catch(err){
        res.status(500).send("Error at login endpoint : " + err); // Internal server error, might need to specify path if things getting bigger and bigger
    }
};

const logout = async (req, res) =>{
    // On client, please delete the accessToken too
    try {
        // in case that there is no refresh token in the cookie
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204);
        const refreshToken = cookies.jwt;

        // in case that the user is no longer in the system
        const foundUser = await User.findOne({"refreshToken": refreshToken});
        if (!foundUser){
            res.clearCookie("jwt", { httpOnly: true});
            return res.sendStatus(204);
        }

        foundUser.refreshToken = "";
        await foundUser.save();
        res.clearCookie("jwt", { httpOnly: true}); // add secure: true to make it https
        res.sendStatus(204);
    }
    catch(err){
        res.status(500).send("Error at logout endpoint : " + err);
    }
};

const handleRefreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); // no content
        const refreshToken = cookies.jwt; // receive the refresh token from cookie
        
        const foundUser = await User.findOne({"refreshToken": refreshToken});
        if (!foundUser) return res.sendStatus(403); // 403 forbidden

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || JSON.stringify(foundUser._id) !== JSON.stringify(decoded.userID)) return res.sendStatus(403);
                const accessToken = generateAccessToken(foundUser._id);
                res.json({ accessToken })
            }
        );
    }
    catch(err){
        res.status(500).send("Error at handle refresh token endpoint : " + err);
    }
};

module.exports = { login, logout,handleRefreshToken };