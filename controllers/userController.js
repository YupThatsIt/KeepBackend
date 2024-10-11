// logics about accounts
// NOTED : Username validation is not yet implement (to check if username has special characters which will make it vulnerable to injection or other attack)
const { User, Account } = require("../models/userModel");
const { validateEmail, validateName, validatePhone }= require("../utils/stringValidation");

const mongoose = require("mongoose");

// View account -> this will get everything
const viewAccount = async (req, res) => {
    try {
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundAccount = await Account.findOne({ "userID": userID});
        if (!foundAccount) return res.status(403).send("No account found");
        const returnData = {
            "firstName": foundAccount.firstName,
            "lastName": foundAccount.lastName,
            "phone": foundAccount.phone
        }
        res.send(returnData);
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at view user endpoint");
    }
};


// Update account -> this will update whatever the client wanted to
const updateAccount = async (req, res) => {
    try {
        // for now it will update only these
        // All is required
        const { firstName, lastName, phone } = req.body;
        // Data validation : Can remove later if frontend already checked these
        if (!validateName(firstName)) return res.status(400).send("First name contains number/s or illegal character/s");
        if (!validateName(lastName)) return res.status(400).send("Last name contains number/s or illegal character/s");
        if (!validatePhone(phone)) return res.status(400).send("Phone contains alphabet/s or illegal character/s");
        const formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        const formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundAccount = await Account.findOneAndUpdate({ "userID": userID}, {
            "firstName": formattedFirstName,
            "lastName": formattedLastName,
            "phone": phone
        }, { new: true }).exec();

        // duplicated code, the same thing in viewAccount
        const returnData = {
            "firstName": foundAccount.firstName,
            "lastName": foundAccount.lastName,
            "phone": foundAccount.phone
        }
        res.status(200).send(returnData);
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at update user endpoint");
    }
};


// Delete account -> this will wipe out both account and user and logout for you too.
const deleteAccount = async (req, res) => {
    try {
        // const id = req.params.id;
        // const foundUser = await User.findOneAndDelete({"_id": `${id}`});
        // console.log(foundUser);
        res.send("Delete account endpoint is still in progress");
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at delete user endpoint");
    }
};

module.exports = { updateAccount, deleteAccount, viewAccount };