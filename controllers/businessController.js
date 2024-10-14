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
                                                            {$and: [{"name": name}, {"branch": branchName}]}]});
        if (foundBusiness) return res.status(403).send("There's registered information already");
        
        // find the user to add id as admin
        // const userID = req.userID;
        console.log(req.userID);
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({"_id": userID});
        if (!foundUser) return res.status(403).send("No user found");
        
        // create business
        const newBusiness = new Business({
            "name": name,
            "branch": branchName,
            "address": address,
            "phone": phone,
            "taxID": taxID,
            "admin": {
                "userID": userID,
                "memberNumber": 1
            },
            "accountants": [],
            "viewers": [],
            "joiningCode": "",
            "logoUrl": logoUrl
        });
        if (!newBusiness) return res.status(500).send("Cannot create new Business mongoDb document");
        await newBusiness.save();
        
        // update user with the role
        const businessID = newBusiness._id;
        foundUser.businessRoles.push({
            businessID: businessID,
            role: BusinessRole.BUSINESS_ADMIN
        })
        await foundUser.save();

        // return the business name and branch
        const encodedName = encodeURI(name);
        const encodedBranch = encodeURI(branchName);
        res.json({
            "name": encodedName,
            "branch": encodedBranch
        });
    }
    catch(err){
        res.status(500).send("Error at create business endpoint : " + err);
    }
};


const getBusinesses = async (req, res) => {
    try {
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({ "_id": userID });
        if (!foundUser) return res.status(403).send("No user is found");

        const returnData = [];
        for (const business of foundUser.businessRoles) {
            const foundBusiness = await Business.findOne({ "_id": business.businessID });
            returnData.push({
                "role": business.role,
                "name": encodeURI(foundBusiness.name),
                "branch": encodeURI(foundBusiness.branch),
                "logoUrl": foundBusiness.logoUrl
            });
        }
        
        res.json(returnData);
    }
    catch(err){
        res.status(500).send("Error at get businesses endpoint : " + err);
    }
};


const viewBusiness = async (req, res) => {
    try {
        // no role checking because anyone can do it
        // already check if the user have access to the business or not
        const foundBusiness = await Business.findOne({ "_id": req.businessID });
        if (!foundBusiness) return res.status(403).send("No business found");

        const returnData = {
            "name": foundBusiness.name,
            "branch": foundBusiness.branch,
            "address": foundBusiness.address,
            "phone": foundBusiness.phone,
            "taxID": foundBusiness.taxID,
            "logoUrl": foundBusiness.logoUrl
        };

        res.json(returnData);
    }
    catch(err){
        res.status(500).send("Error at view businesses endpoint : " + err);
    }
};


const updateBusiness = async (req, res) => {
    try {
        // check role
        if (req.role !== BusinessRole.BUSINESS_ADMIN) return res.sendStatus(403);
        const businessID = req.businessID;

        const { name, branch, address, phone, logoData} = req.body;
        let logoUrl;
        let branchName = "main";

        // check input
        if (!name || !address || !phone) return res.status(400).send("Input is incompleted");
        if (branch) branchName = branch;

        // change if imgData is anything other than a simple string
        if (!logoData) logoUrl = "-";
        else logoUrl = imgData;

        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");

        const foundBusiness = await Business.findOne({ $and: 
                                                        [{$or: [{"phone": phone}, 
                                                                {"address": address},
                                                                {$and: [{"name": name}, {"branch": branchName}]}
                                                         ]},
                                                         {
                                                            "_id": {$ne: businessID}
                                                         }]});
        if (foundBusiness) return res.status(403).send("There's registered information already");

        let updateErr = false;
        await Business.findOneAndUpdate({ "_id": businessID }, {
            "name": name,
            "branch": branchName,
            "address": address,
            "phone": phone,
            "logoUrl": logoUrl
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                updateErr = true;
                return;
            }
        });
        if (updateErr) res.status(500).send("Business information cannot be updated");

        res.status(200).send("Business updated!");
    }
    catch(err){
        res.status(500).send("Error at update businesses endpoint : " + err);
    }
};


const deleteBusiness = async (req, res) => {
    try {

    }
    catch(err){
        res.status(500).send("Error at delete businesses endpoint : " + err);
    }
};

module.exports = { createBusiness, getBusinesses, viewBusiness, updateBusiness };