const { Business } = require("../models/businessModel");
const { User } = require("../models/userModel");
const { validatePhone, validateTaxID } = require("../utils/stringValidation");
const { BusinessRole } = require("../enum");
const mongoose = require("mongoose");

const createBusiness = async(req, res) =>{
    try{
        const { name, branch, address, phone, taxID, logoData} = req.body;
        let logoUrl;
        let branchName = "main";

        // check input
        if (!name || !address || !phone || !taxID) return res.status(400).send("Input is incompleted");
        if (branch) branchName = branch;

        // change if imgData is anything other than a simple string
        if (!logoData) logoUrl = "-";
        else logoUrl = imgData;

        // validate input
        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");
        if (!validateTaxID(taxID)) return res.status(400).send("Invalid tax ID: must be number with length of 13");

        // check duplication
        const foundBusiness = await Business.findOne({ $or: [{"phone": phone}, 
                                                            {"taxID": taxID}, 
                                                            {"address": address},
                                                            {$and: [{"name": name}, {"branch": branchName}]}]}).exec();
        if (foundBusiness) return res.status(400).send("There's registered information already");
        
        // find the user to add id as admin
        // const userID = req.userID;
        console.log(req.userID);
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({_id: userID});
        if (!foundUser) return res.status(403).send("No user found");
        
        // create business
        const newBusiness = new Business({
            "name": name,
            "branch": branchName,
            "address": address,
            "phone": phone,
            "taxID": taxID,
            "admin": {
                "id": foundUser._id
            },
            "accountants": [],
            "viewers": [],
            "joiningCode": "",
            "logoData": logoUrl
        });
        if (!newBusiness) return res.status(500).send("Cannot create new Business mongoDb document");
        await newBusiness.save();
        
        // update user with the role
        const businessID = newBusiness._id;
        foundUser.businessRoles.push({
            businessID: businessID,
            role: BusinessRole.BUSINESS_ADMIN
        })
        foundUser.save();

        // return the business name and branch
        const encodedName = encodeURI(name);
        const encodedBranch = encodeURI(branchName);
        res.json({
            "name": encodedName,
            "branch": encodedBranch
        });
    }
    catch(err){
        res.status(500).send("Error at create business endpoint" + err)
    }
};

module.exports = { createBusiness };