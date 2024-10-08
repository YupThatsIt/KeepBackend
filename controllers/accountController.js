// logics about accounts
// NOTED : Username validation is not yet implement (to check if username has special characters which will make it vulnerable to injection or other attack)
const { User, Account } = require("../models/userModel");
const { validateEmail, validateName, validatePhone }= require("../utils/stringValidation");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

/*

NOTE! There are still multiple duplicated code snippets inside this module. Need refactoring.

*/


// registration will only make a new user documentation with unique username
// assuming password checking and forbidden username (in case of injection) were done in the front end already
// not done yet. Might have to rewrite to have more logic like account creation
const registerUser = async (req, res) => {
    try {
        const { user, email, pwd } = req.body;
        if (!user || !email || !pwd) return res.status(400).send("Email, username and password are required");
        if (!validateEmail(email)) return res.status(400).send("Email format is incorrect"); // check if email is in the correct format
        const foundUser = await User.findOne({ $or: [ {"username": user}, {"email": email}]}).exec(); // findout if the user is already in the system
        if (foundUser) return res.send("User is already in the system");
        
        const salt = await bcrypt.genSalt(10);
        const hashPwd = await bcrypt.hash(pwd, salt); // hash/encrypt password for security reason
        const newUser = new User({
            "email": email,
            "username": user,
            "password": hashPwd,
            "refreshtoken": ""
        });
        if (!newUser) return res.status(500);
        await newUser.save(); // save new user to the database
        res.status(200).send("Registration completed!");
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at register user endpoint");
    }
};


// Create account -> this will store all the trivial information for that user
// and maybe the business role too
const createAccount = async (req, res) => {
    try {
        // Check if account for this user was created already
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundAccount = await Account.findOne({ "userID": userID }).exec();
        if (foundAccount) return res.send("Account for this user is already created");

        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName || !phone) return res.status(400).send("Incomplete input");
        // Data validation : Can remove later if frontend already checked these
        if (!validateName(firstName)) return res.status(400).send("First name contains number/s or illegal character/s");
        if (!validateName(lastName)) return res.status(400).send("Last name contains number/s or illegal character/s");
        if (!validatePhone(phone)) return res.status(400).send("Phone contains alphabet/s or illegal character/s");
        const formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        const formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        const newAccount = new Account({
            "firstName": formattedFirstName,
            "lastName": formattedLastName,
            "phone": phone,
            "activeRoles": [],
            "userID": userID
        });
        if (!newAccount) return res.status(500);
        await newAccount.save(); // save new user to the database
        res.status(200).send("Account created!");
    }
    catch(err){
        console.log(err);
        res.status(500).send("Error at create account endpoint");
    }
};


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

module.exports = { registerUser, createAccount, updateAccount, deleteAccount, viewAccount };