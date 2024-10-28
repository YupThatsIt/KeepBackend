// logics about accounts
// NOTED : Username validation is not yet implement (to check if username has special characters which will make it vulnerable to injection or other attack)
const { User, Account } = require("../models/userModel");
const { Business } = require("../models/businessModel");
const { validateEmail, validateName, validateNameEN, validatePhone }= require("../utils/stringValidation");
const { BusinessRole } = require("../enum");

const mongoose = require("mongoose");

// View account -> this will fetch important user's information to client
const viewUser = async(req, res) => {
    try {
        // Convert user ID in form of hex string into an ObjectID 12 bits
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        
        const foundUser = await User.findOne({ "_id": userID});
        if (!foundUser) return res.status(404).json({
            "status": "error",
            "message": "The user is not found"
        });

        const foundAccount = await Account.findOne({ "userID": userID});
        if (!foundAccount) return res.status(403).json({
            "status": "error",
            "message": "The account is not found"
        });

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

        res.status(200).json({
            "status": "success",
            "message": "Return user's information successfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at view user endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at view user endpoint"
        });
    }
};


// It's a complete update; meaning set all the properties in the document anew.
const updateUser = async (req, res) => {
    try {
        // see if the input data is correct
        const { 
            user,
            email,
            title,
            firstName,
            lastName,
            address,
            phone,
            imgData
        } = req.body;
        
        if (
            !user ||
            !email ||
            !firstName ||
            !lastName ||
            !address ||
            !phone
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: user, email, firstName, lastName, address and phone are needed"
        });
        if (Object.values(NameTitle).indexOf(title) === -1) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum NameTitle"
        });
        
        // Change if imgData is anything other than a simple string
        const imgUrl = (imgData) ? imgData : "-";
        
        // Data validation
        if (!validateEmail(email)) return res.status(400).json({
            "status": "error",
            "message": "Incorrect format: email's format is wrong"
        });
        if (!validateName(firstName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validateName(lastName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid lastname: must contain only TH or EN alphabet"
        });
        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be a number with length of 10"
        });
        
        
        // Capitalize english names
        const formattedFirstName = (validateNameEN(firstName)) ? firstName[0].toUpperCase() + firstName.slice(1).toLowerCase() : firstName;
        const formattedLastName = (validateNameEN(lastName)) ? lastName[0].toUpperCase() + lastName.slice(1).toLowerCase() : lastName;
        
        // find other user and account to check if the input information is good to go or not
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);

        // Check to see if the user exist or not
        const otherUser = await User.findOne({ $and: [{ $or: [{"email": email}, {"username": user}]}, {"_id": { $ne: userID }}]});
        if (otherUser) return res.status(403).json({
            "status": "error",
            "message": "Email or username is taken. It must be unique"
        });
        
        // Check to see if the account exist or not 
        const otherAccount = await Account.findOne({ $and: [{"phone": phone}, {"userID": { $ne: userID }}]});
        if (otherAccount) return res.status(403).json({
            "status": "error",
            "message": "Phone number is taken. It must be unique"
        });
        
        // add upsert if problems are happening
        // Note that foundUser will contain old information if not use option { new: true }
        await User.findOneAndUpdate({ "_id": userID}, {
            "username": user,
            "email": email
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                console.log(err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update the user"
                });
            }
        });

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
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update the account"
                });
            }
        });

        res.status(200).json({
            "status": "success",
            "message": "User updated"
        });
    }
    catch(err){
        console.error("Unexpected error at update user endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at update user endpoint"
        });
    }
};


// Delete account -> doesn't matter if 
const deleteUser = async (req, res) => {
    try {
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);

        // delete the user
        const foundUser = await User.findOne({ "_id": userID });
        if (foundUser) {
            // check if the user is an admin
            foundUser.businessRoles.forEach((business) => {
                if (business.role === BusinessRole.BUSINESS_ADMIN) return res.status(403).json({
                    "status": "error",
                    "message": "The user is an admin of a business"
                });
            });
            
            // pull the user from business
            for (const business of foundUser.businessRoles) {
                const role = (business.role === BusinessRole.ACCOUNTANT) ? "accountants" : "viewers";
                await Business.updateOne({ "_id": business.businessID }, {
                    $pull: { 
                        [role]: { "userID": userID }
                    }
                });
            }
            await User.deleteOne({"_id": userID});
        }
        
        // delete the account
        const foundAccount = await Account.findOne({"userID": userID});
        if (foundAccount) await Account.deleteOne({"userID": userID});

        // clear any jwt cookie left
        res.clearCookie("jwt", { httpOnly: true});
        
        res.status(200).json({
            "status": "success",
            "message": "User deleted"
        });
    }
    catch(err){
        console.error("Unexpected error at delete user endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at delete user endpoint"
        });
    }
};

module.exports = { updateUser, deleteUser, viewUser };