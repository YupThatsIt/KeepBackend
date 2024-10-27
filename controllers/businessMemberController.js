const { Business } = require("../models/businessModel");
const { User, Account } = require("../models/userModel");
const { BusinessRole } = require("../enum");
const mongoose = require("mongoose");

// all permission
const getBusinessMembers = async (req, res) => {
    try {
        const businessID = req.businessID;
        
        const queryOptions = [];
        if (req.query.role instanceof Array) queryOptions.push(...req.query.role);
        else if (req.query.role) queryOptions.push(req.query.role);
        
        // get type of members which will be return
        const typeOfMembers = [];
        if (queryOptions.length !== 0) {
            for (let i = 0; i < queryOptions.length; i++){
                switch (queryOptions[i].toLowerCase()) {
                    case "admin":
                        if (typeOfMembers.indexOf(BusinessRole.BUSINESS_ADMIN) === -1) typeOfMembers.push(BusinessRole.BUSINESS_ADMIN);
                        break;
                    case "accountants":
                        if (typeOfMembers.indexOf(BusinessRole.ACCOUNTANT) === -1) typeOfMembers.push(BusinessRole.ACCOUNTANT);
                        break;
                    case "viewers":
                        if (typeOfMembers.indexOf(BusinessRole.VIEWER) === -1) typeOfMembers.push(BusinessRole.VIEWER);
                        break;
                    default:
                        break;
                }
            }
        }
        else typeOfMembers.push(BusinessRole.BUSINESS_ADMIN, BusinessRole.ACCOUNTANT, BusinessRole.VIEWER);
        
        // it likely won't happen but should be checked anyway
        const foundBusiness = await Business.findOne({"_id": businessID});
        if (!foundBusiness) return res.status(403).json({
            "status": "error",
            "message": "Business is not found"
        });
        
        // push all memberID to query for information
        const members = [];
        const roles = [];
        const memberNums = [];
        if (typeOfMembers.includes(BusinessRole.BUSINESS_ADMIN)) {
            members.push(foundBusiness.admin.userID);
            memberNums.push(foundBusiness.admin.memberNumber);
            roles.push(BusinessRole.BUSINESS_ADMIN);
        }
        if (typeOfMembers.includes(BusinessRole.ACCOUNTANT)) {
            const accountants = foundBusiness.accountants;
            for (let i = 0; i < accountants.length; i++){
                members.push(accountants[i].userID);
                memberNums.push(accountants[i].memberNumber);
                roles.push(BusinessRole.ACCOUNTANT);
            }
        }
        if (typeOfMembers.includes(BusinessRole.VIEWER)) {
            const viewers = foundBusiness.viewers;
            for (let i = 0; i < viewers.length; i++){
                members.push(viewers[i].userID);
                memberNums.push(viewers[i].memberNumber);
                roles.push(BusinessRole.VIEWER);
            }
        }
        
        // the problem is that: this will only return accounts in order of creation
        const memberAccountInfos = await Account.find({"userID": {$in: members}}).select({
            "_id": 0,
            "userID": 1,
            "title": 1,
            "firstName": 1,
            "lastName": 1,
            "imgUrl": 1
        });

        const returnData = [];
        for (let i = 0; i < members.length; i++){
            const item = memberAccountInfos.find((element) => {
                return element.userID.equals(members[i]);
            })
            returnData.push({
                "userID": members[i],
                "memberNumber": memberNums[i],
                "title": item.title,
                "firstName": item.firstName,
                "lastName": item.lastName,
                "imgUrl": item.imgUrl,
                "role": roles[i]  
            })
        }
        
        res.status(200).json({
            "status": "success",
            "message": "Return members successfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at get business members endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get business members endpoint"
        });
    }
};

// const viewMember = async (req, res) => {
//     try {

//         res.status(200).send("");
//     }
//     catch(err){
//         res.status(500).send("Error at get business members endpoint : " + err);
//     }
// };

const promoteToAccountant = async (req, res) => {
    try {
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin"
        });

        const businessID = req.businessID;
        const memberNumber = Number(req.params.memberNumber);
        if (memberNumber === undefined) return res.status(400).json({
            "status": "error",
            "message": "Missing input: memberNumber is needed"
        });

        const foundBusiness = await Business.findOne({"_id": businessID});
        if (!foundBusiness) return res.status(404).json({
            "status": "error",
            "message": "Business is not found"
        });

        // check if member is really in viewer array
        const viewers = foundBusiness.viewers;
        const foundMember = viewers.find(element => {
            return element.memberNumber === memberNumber
        });
        if (!foundMember) return res.status(404).json({
            "status": "error",
            "message": "Missing member: member with this number doesn't exist in viewers"
        });

        // change role in user
        const memberID = foundMember.userID;
        await User.findOneAndUpdate({ "_id": memberID, "businessRoles.businessID": businessID }, {
            $set: {"businessRoles.$.role": BusinessRole.ACCOUNTANT}
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update user's role"
                });
            }
        });

        // change role in business
        foundBusiness.accountants.push({
            "userID": memberID,
            "memberNumber": memberNumber
        });
        foundBusiness.viewers = foundBusiness.viewers.filter(viewer => viewer.userID !== memberID);
        await foundBusiness.save();

        res.status(200).json({
            "status": "success",
            "message": "The member got promoted to an accountant"
        });
    }
    catch(err){
        console.error("Unexpected error at promote to accountant endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at promote to accountant endpoint"
        });
    }
};

const promoteToAdmin = async (req, res) => {
    try {
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin"
        });

        const businessID = req.businessID;
        const memberNumber = Number(req.params.memberNumber);
        if (memberNumber === undefined) return res.status(400).json({
            "status": "error",
            "message": "Missing input: memberNumber is needed"
        });

        const foundBusiness = await Business.findOne({"_id": businessID});
        if (!foundBusiness) return res.status(404).json({
            "status": "error",
            "message": "Business is not found"
        });

        // find the member in both accountants and viewers
        // must be an accountant only
        const accountants = foundBusiness.accountants;
        const foundMember = accountants.find(element => {
            return element.memberNumber === memberNumber
        });
        if (!foundMember) return res.status(404).json({
            "status": "error",
            "message": "Missing member: member with this number doesn't exist in accountants"
        });

        const memberID = foundMember.userID;
        const currentAdmin = foundBusiness.admin;
        
        // change current admin role in user
        await User.findOneAndUpdate({ "_id": currentAdmin.userID, "businessRoles.businessID": businessID }, {
            $set: {"businessRoles.$.role": BusinessRole.ACCOUNTANT}
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update current admin's role in User"
                });
            }
        });
        
        // add current admin to accountants
        foundBusiness.accountants.push({
            "userID": currentAdmin.userID,
            "memberNumber": currentAdmin.memberNumber
        });

        // change new admin role in user 
        await User.findOneAndUpdate({ "_id": memberID, "businessRoles.businessID": businessID }, {
            $set: {"businessRoles.$.role": BusinessRole.BUSINESS_ADMIN}
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update new admin's role in User"
                });
            }
        });

        // change new admin in business
        foundBusiness.admin = {
            "userID": memberID, 
            "memberNumber": memberNumber
        };

        // remove new admin from accountants
        foundBusiness.accountants = foundBusiness.accountants.filter(accountant => accountant.userID !== memberID);
        
        await foundBusiness.save();

        res.status(200).json({
            "status": "success",
            "message": "The member got promoted to become a new admin. You are no longer the admin"
        });
    }
    catch(err){
        console.error("Unexpected error at promote to admin endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at promote to admin endpoint"
        });
    }
};

const demoteToViewer = async (req, res) => {
    try {
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin"
        });

        const businessID = req.businessID;
        const memberNumber = Number(req.params.memberNumber);
        if (memberNumber === undefined) return res.status(400).json({
            "status": "error",
            "message": "Missing input: memberNumber is needed"
        });

        const foundBusiness = await Business.findOne({"_id": businessID});
        if (!foundBusiness) return res.status(404).json({
            "status": "error",
            "message": "Business is not found"
        });

        // check if member is really in accountant array
        const accountants = foundBusiness.accountants;
        const foundMember = accountants.find(element => {
            return element.memberNumber === memberNumber
        });
        if (!foundMember) return res.status(404).json({
            "status": "error",
            "message": "Missing member: member with this number doesn't exist in accountants"
        });

        // change role in user
        const memberID = foundMember.userID;
        await User.findOneAndUpdate({ "_id": memberID, "businessRoles.businessID": businessID }, {
            $set: {"businessRoles.$.role": BusinessRole.VIEWER}
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update user's role"
                });
            }
        });

        // change role in business
        foundBusiness.viewers.push({
            "userID": memberID,
            "memberNumber": memberNumber
        });
        foundBusiness.accountants = foundBusiness.accountants.filter(accountant => accountant.userID !== memberID);
        await foundBusiness.save();

        res.status(200).json({
            "status": "success",
            "message": "The member got demoted to a viewer"
        });
    }
    catch(err){
        console.error("Unexpected error at demote to viewer endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at demote to viewer endpoint"
        });
    }
};




module.exports = { getBusinessMembers, promoteToAccountant, promoteToAdmin, demoteToViewer };