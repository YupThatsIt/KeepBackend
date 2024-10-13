// logics about accounts
// NOTED : Username validation is not yet implement (to check if username has special characters which will make it vulnerable to injection or other attack)
const { User, Account } = require("../models/userModel");
const { Business } = require("../models/businessModel");
const { validateEmail, validateName, validateNameEN, validatePhone }= require("../utils/stringValidation");
const { BusinessRole } = require("../enum");

const mongoose = require("mongoose");

// View account -> this will get everything
const viewUser = async(req, res) => {
    try {
        // get the user's information with
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({ "_id": userID});
        if (!foundUser) return res.status(403).send("No user is found");

        const foundAccount = await Account.findOne({ "userID": userID});
        if (!foundAccount) return res.status(403).send("No account is found");

        const returnData = {
            "username": foundUser.username,
            "email": foundUser.email,
            "title": foundAccount.title,
            "firstName": foundAccount.firstName,
            "lastName": foundAccount.lastName,
            "address": foundAccount.address,
            "phone": foundAccount.phone,
            "imgUrl": foundAccount.imgUrl 
        };

        res.json(returnData);
    }
    catch(err){
        res.status(500).send("Error at view user endpoint : " + err);
    }
};


// Update account -> this will update whatever the client wanted to
const updateUser = async (req, res) => {
    try {
        // see if the input data is correct
        const { user, email, title, firstName, lastName, address, phone, imgData} = req.body;
        let imgUrl;
        
        if (!user || !email || !firstName || !lastName || !address || !phone) return res.status(400).send("Input is incompleted");
        if (isNaN(title)) return res.status(400).send("Invalid title: must be enum of 0-3");

        // change if imgData is anything other than a simple string
        if (!imgData) imgUrl = "-";
        else imgUrl = imgData;
        
        // data validation
        if (!validateEmail(email)) return res.status(400).send("Invalid email");
        if (!validateName(firstName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validateName(lastName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");
        
        // capitalize english names
        let formattedFirstName;
        let formattedLastName; 
        if (validateNameEN(firstName)) formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        else formattedFirstName = firstName;
        if (validateNameEN(lastName)) formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        else formattedLastName = lastName;
        
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        
        // find other user and account to check if the input information is good to go or not
        const otherUser = await User.findOne({ $and: [{ $or: [{"email": email}, {"username": user}]}, {"_id": { $ne: userID }}]});
        if (otherUser) return res.sendStatus(403);
        
        const otherAccount = await Account.findOne({ $and: [{"phone": phone}, {"userID": { $ne: userID }}]});
        if (otherAccount) return res.sendStatus(403);
        
        // Note that foundUser will contain old information if not use option { new: true }
        let updateErr = false;
        await User.findOneAndUpdate({ "_id": userID}, {
            "username": user,
            "email": email
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                updateErr = true;
                return;
            }
        });
        if (updateErr) return res.status(500).send("User cannot be updated");

        await Account.findOneAndUpdate({ "userID": userID}, {
            "title": title,
            "firstName": formattedFirstName,
            "lastName": formattedLastName,
            "address": address,
            "phone": phone,
            "imgUrl": imgUrl 
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated Account : ", docs);
            }
            catch(err) {
                updateErr = true;
                return;
            }
        });
        if (updateErr) return res.status(500).send("Account cannot be updated");


        res.status(200).send("User updated");
    }
    catch(err){
        res.status(500).send("Error at update user endpoint : " + err);
    }
};


// Delete account -> this will wipe out both account and user and logout for you too.
const deleteUser = async (req, res) => {
    try {
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({ "_id": userID });
        if (!foundUser) return res.status(403).send("No user is found");

        const foundAccount = await Account.findOne({ "userID": userID});
        if (!foundAccount) return res.status(403).send("No account is found");

        // unfortunately, we need to check for admin first before proceeding or else
        // we might delete data before knowing that the user is in fact is an admin
        // const isAdmin = foundUser.businessRoles.find((business) => {
        //     business.role === BusinessRole.BUSINESS_ADMIN;
        // });

        let isAdmin = false;
        foundUser.businessRoles.forEach((business) => {
            if (business.role === BusinessRole.BUSINESS_ADMIN) isAdmin = true;
        });
        if (isAdmin) return res.status(403).send("You are an admin of a business, please delete the business first before continue");

        for (const business of foundUser.businessRoles) {
            let role;
            if (business.role === BusinessRole.ACCOUNTANT) role = "accountants";
            else role = "viewers";

            await Business.updateOne({ "_id": business.businessID }, {
                $pull: { 
                    [role]: { "id": userID }
                }
            });
        }

        await User.deleteOne({"_id": userID});
        await Account.deleteOne({"userID": userID});

        res.status(200).send("User deleted");
    }
    catch(err){
        res.status(500).send("Error at delete user endpoint : " + err);
    }
};

module.exports = { updateUser, deleteUser, viewUser };