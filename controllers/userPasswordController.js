const { User } = require("../models/userModel");

const validatePassword = async (req, res) => {
    try {
        
        res.status(200).send("");
    }
    catch(err){
        res.status(500).send("Error at delete user endpoint" + err);
    }
}

const updatePassword = async (req, res) => {
    try {
        
        res.status(200).send("");
    }
    catch(err){
        res.status(500).send("Error at delete user endpoint" + err);
    }
}

module.exports = { validatePassword, updatePassword };