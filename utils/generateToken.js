const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateAccessToken = (id) => {
    return jwt.sign(
        { "userID": id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30m' }
    );
}

const generateRefreshToken = (id) => {
    return jwt.sign(
        { "userID": id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );
}


module.exports = { generateAccessToken, generateRefreshToken };