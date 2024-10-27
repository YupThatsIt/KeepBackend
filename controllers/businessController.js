const { Business } = require("../models/businessModel");
const { User } = require("../models/userModel");
const { validatePhone, validateTaxID } = require("../utils/stringValidation");
const { BusinessRole } = require("../enum");
const mongoose = require("mongoose");


const createBusiness = async(req, res) =>{
    try{
        const {
            name,
            branch,
            address,
            phone,
            taxID,
            registrationNumber,
            logoData
        } = req.body;
        
        // check for necessary input
        if (!name ||
            !address ||
            !phone ||
            !taxID ||
            !registrationNumber
        ) return res.status(400).json({
            "status": "error",
            "message": "Input is incompleted"
        });
        
        // change if imgData is anything other than a simple string
        const logoUrl = (logoData) ? logoData : "-";
        const branchName = (branch) ? branch : "main";

        // validate input
        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });
        if (!validateTaxID(taxID)) return res.status(400).json({
            "status": "error",
            "message": "Invalid tax ID: must be number with length of 13"
        });
        if (!validateTaxID(registrationNumber)) return res.status(400).json({
            "status": "error",
            "message": "Invalid registration number: must be number with length of 13"
        });

        // check duplication
        const foundBusiness = await Business.findOne({ $or: [{"phone": phone}, 
                                                            {"address": address},
                                                            {$and: [{"name": name}, {"branch": branchName}]}
                                                            // {$and: [{"name": name}, {"branch" : {$ne: branchName}}, { "taxID" : {$ne: taxID}}]},
                                                            // {$and: [{"name": {$ne: name}}, {"taxID": taxID}]}
                                                        ]});
        if (foundBusiness) return res.status(403).json({
            "status": "error",
            "message": "Duplicated data: phone, taxID, address is taken/this branch of business already exist"
        });
        
        // find the user to add id as admin
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({"_id": userID});
        if (!foundUser) return res.status(403).json({
            "status": "error",
            "message": "The user is not found"
        });
        
        // create business
        const newBusiness = new Business({
            "name": name,
            "branch": branchName,
            "address": address,
            "phone": phone,
            "taxID": taxID,
            "registrationNumber": registrationNumber,
            "admin": {
                "userID": userID,
                "memberNumber": 1
            },
            "accountants": [],
            "viewers": [],
            "joiningCode": "",
            "logoUrl": logoUrl
        });
        if (!newBusiness) return res.status(500).json({
            "status": "error",
            "message": "Cannot create new mongoDb document: new Business can't be created"
        });
        await newBusiness.save();
        
        // update user with the role
        // maybe atomic will be better but this much is fine
        const businessID = newBusiness._id;
        foundUser.businessRoles.push({
            businessID: businessID,
            role: BusinessRole.BUSINESS_ADMIN
        })
        await foundUser.save();

        const returnData = {
            "name": encodeURI(name),
            "branch": encodeURI(branchName)
        }

        // return the encoded business name and branch
        res.status(201).json({
            "status": "success",
            "message": "New business created",
            "content" : returnData
        });
    }
    catch(err){
        console.error("Unexpected error at create business endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at create business endpoint"
        });
    }
};


const getBusinesses = async (req, res) => {
    try {
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const foundUser = await User.findOne({ "_id": userID });
        if (!foundUser) return res.status(403).json({
            "status": "error",
            "message": "No user is found"
        });

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
        
        res.status(200).json({
            "status": "success",
            "message": `Return businesses which ${foundUser.username} has a role in successfully`,
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at get business endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get business endpoint"
        });
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
            "registrationNumber": foundBusiness.registrationNumber,
            "logoUrl": foundBusiness.logoUrl
        };

        res.status(200).json({
            "status": "success",
            "message": "Return business detail successfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at view business endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at view business endpoint"
        });
    }
};


const updateBusiness = async (req, res) => {
    try {
        // check role
        if (req.role !== BusinessRole.BUSINESS_ADMIN) return res.status(403).json({
            "status": "error",
            "message": "User is not the admin"
        });
        const businessID = req.businessID;

        const {
            name,
            branch,
            address,
            phone,
            logoData
        } = req.body;
        
        // check input
        if (!name ||
            !address ||
            !phone
        ) return res.status(400).json({
            "status": "error",
            "message": "Input is incomplete: name, address and phone are needed"
        });
        
        // change if imgData is anything other than a simple string
        const branchName = (branch) ? branch : "main";
        const logoUrl = (logoData) ? logoData : "-";

        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });

        const foundBusiness = await Business.findOne({ $and: 
                                                        [{$or: [{"phone": phone}, 
                                                                {"address": address},
                                                                {$and: [{"name": name}, {"branch": branchName}]}
                                                                // {$and: [{"name": name}, {"branch" : {$ne: branchName}}, { "taxID" : {$ne: taxID}}]},
                                                                // {$and: [{"name": {$ne: name}}, {"taxID": taxID}]}
                                                         ]},
                                                         {
                                                            "_id": {$ne: businessID}
                                                         }]});
        if (foundBusiness) return res.status(403).json({
            "status": "error",
            "message": "Duplicated data: phone, taxID, address is taken/this branch of business already exist"
        });

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
                console.log(err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Business information cannot be updated"
                });
            }
        });

        return res.status(200).json({
            "status": "success",
            "message": "Business updated"
        });
    }
    catch(err){
        console.error("Unexpected error at update business endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at update business endpoint"
        });
    }
};


const deleteBusiness = async (req, res) => {
    try {
        // why can't I still not do this
        if (req.role !== BusinessRole.BUSINESS_ADMIN) return res.status(403).json({
            "status": "error",
            "message": "User is not the admin"
        });
        const businessID = req.businessID;
        // because we must destroy everything include all related collections
    }
    catch(err){
        res.status(500).send("Error at delete businesses endpoint : " + err);
    }
};

module.exports = { createBusiness, getBusinesses, viewBusiness, updateBusiness };