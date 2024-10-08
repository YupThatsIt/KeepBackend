const { User } = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const handleRefreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); // no content
        const refreshToken = cookies.jwt; // receive the refresh token from cookie
        
        const foundUser = await User.findOne({"refreshtoken": refreshToken}).exec();
        if (!foundUser) return res.sendStatus(403); // 403 forbidden

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || JSON.stringify(foundUser._id) !== JSON.stringify(decoded.userID)) return res.sendStatus(403);
                const accessToken = jwt.sign(
                    { "userID": foundUser._id },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '30m' } 
                );
                res.json({ accessToken })
            }
        );
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at handle refresh token endpoint");
    }
};

module.exports = { handleRefreshToken };