const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");

const mongoose = require("mongoose");

// check if the password is valid - just compare
const checkPassword = async (req, res) => {
    try {
        const pwd = req.body.pwd;
        if (!pwd) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: pwd are needed"
        });

        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({ "_id": userID });
        if (!foundUser) return res.status(403).json({
            "status": "error",
            "message": "Cannot find the user in database"
        });

        const match = await bcrypt.compare(pwd, foundUser.password);
        if (match) res.status(200).json({
            "status": "success",
            "message": "Password is correct"
        });
        else res.status(403).json({
            "status": "error",
            "message": "Password is incorrect"
        });
    }
    catch(err){
        console.error("Unexpected error at validate user's password endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at validate user's password endpoint"
        });
    }
}


const updatePassword = async (req, res) => {
    try {
        const newPwd = req.body.pwd;
        if (!newPwd) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: pwd are needed"
        });

        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        
        const salt = await bcrypt.genSalt(10);
        const hashPwd = await bcrypt.hash(newPwd, salt);
        await User.findOneAndUpdate({ "_id": userID }, {
            "password": hashPwd
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated Password : ", docs);
            }
            catch(err) {
                console.log(err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update the the password"
                });
            }
        });

        res.status(200).json({
            "status": "success",
            "message": "Password updated"
        });
    }
    catch(err){
        console.error("Unexpected error at update user's password endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at update user's password endpoint"
        });
    }
}

module.exports = { checkPassword, updatePassword };