const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateEmail } = require("../utils/stringValidation")
require("dotenv").config();

// login will send access token as json and refresh token as cookie
const login = async (req, res) => {
    try {
        // get JSON body
        const { user, pwd } = req.body;
        if (!user || !pwd) return res.status(400).json({ "message": "Username/email and password are required!"}); // send error back as json
        
        let foundUser;
        if (validateEmail(user)) foundUser = await User.findOne({"email": user}).exec(); // check if the username is in 
        else foundUser = await User.findOne({"username": user}).exec(); // 
        if (!foundUser) return res.sendStatus(401); // unauthorized
        
        const match = await bcrypt.compare(pwd, foundUser.password);
        if (match) {
            // create JWTs
            const accessToken = jwt.sign(
                { "userID": foundUser._id },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '30m' }
            );
            const refreshToken = jwt.sign(
                { "userID": foundUser._id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            foundUser.refreshtoken = refreshToken;
            await foundUser.save(); // save the refresh token in the user database. DON'T FORGET .save()

            console.log(`User ${foundUser.username} logged in`);
            res.cookie("jwt", refreshToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            res.json({ accessToken }); // send the tokens to client
        }
        else {
            res.sendStatus(401);
        }
    } 
    catch(err){
        console.log(err);
        res.status(500).send("Error at login endpoint"); // Internal server error, might need to specify path if things getting bigger and bigger
    }
};

const logout = async (req, res) =>{
    // On client, please delete the accessToken too
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); // no content
        const refreshToken = cookies.jwt;

        const foundUser = await User.findOne({"refreshtoken": refreshToken}).exec(); // 
        if (!foundUser){
            res.clearCookie("jwt", { httpOnly: true});
            return res.sendStatus(204);
        }

        foundUser.refreshtoken = "";
        await foundUser.save();
        res.clearCookie("jwt", { httpOnly: true}); // add secure: true to make it https
        res.sendStatus(204);
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at logout endpoint");
    }
};

module.exports = { login, logout };