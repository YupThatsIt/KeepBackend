const { Business } = require("../models/businessModel");
const { User } = require("../models/userModel");
const { BusinessRole } = require("../enum");
const crypto = require("crypto");
const mongoose = require("mongoose");
const newNumber = require("../utils/newNumberGenerator");

const generateJoinCode = async (req, res) => {
    try {
        if (req.role !== BusinessRole.BUSINESS_ADMIN) return res.status(403).json({
            "status": "error",
            "message": "User is not the admin"
        });
        const businessID = req.businessID;

        // check if code is duplicated, which include the last one too
        let randomCode;
        do {
            randomCode = crypto.randomBytes(3).toString("hex");
        }
        while (await Business.findOne({ "joiningCode.code": randomCode}));

        // set code expiration, default is 2 minutes
        const expireDurationMinute = 2; // minutes expiration
        const now = new Date();
        const expireTime = new Date(now.getTime() + (expireDurationMinute * 60 * 1000));
        console.log(expireTime.toString());

        await Business.findOneAndUpdate({ "_id": businessID }, {
            "joiningCode.code": randomCode,
            "joiningCode.codeExpireAt": expireTime
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                console.log(err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Joining code cannot be updated"
                });
            }
        });

        const returnData = {
            "joinCode": randomCode,
            "expireAt": expireTime
        }
        res.status(200).json({
            "status": "success",
            "message": "Join code generated",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at generate business code endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at generate business code endpoint"
        });
    }
};


const joinBusiness = async (req, res) => {
    try {
        // get the joining code
        const joinCode = req.body.joinCode;
        if (!joinCode) return res.status(403).json({
            "status": "error",
            "message": "No join code provided"
        });
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);

        // check if it expired
        const now = new Date();
        const foundBusiness = await Business.findOne({ "joiningCode.code": joinCode});
        if (!foundBusiness) return res.status(403).json({
            "status": "error",
            "message": "Code is incorrect"
        });
        if (foundBusiness.joiningCode.codeExpireAt.getTime() < now.getTime()) return res.status(403).send("Code is expired");

        const foundUser = await User.findOne({ "_id": userID });
        const businessID = foundBusiness._id;
        
        // check if user is already joined
        if (foundUser.businessRoles.find((element) => {
            return element.businessID.equals(businessID);
        })) return res.status(200).json({
            "status": "success",
            "message": "User is already in the business"
        });

        // update Business
        // generate new member number which is lowest possible number in the sequence
        const memberNumberArr = [];
        memberNumberArr.push(foundBusiness.admin.memberNumber);
        for (const viewer of foundBusiness.viewers){
            memberNumberArr.push(viewer.memberNumber);
        }
        for (const accountant of foundBusiness.accountants){
            memberNumberArr.push(accountant.memberNumber);
        }
        memberNumberArr.sort();
        const newMemberID = newNumber(memberNumberArr);

        // update user in business
        foundBusiness.accountants.push({
            "userID": userID,
            "memberNumber": newMemberID
        })
        await foundBusiness.save();

        // update User
        foundUser.businessRoles.push({
            businessID: businessID,
            role: BusinessRole.ACCOUNTANT
        })
        await foundUser.save();

        // return the business name and branch
        const returnData = {
            "name": encodeURI(foundBusiness.name),
            "branch": encodeURI(foundBusiness.branch)
        }
        res.status(200).json({
            "status": "success",
            "message": "Joined the business",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at join business code endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at join business code endpoint"
        });
    }
};


const leaveBusiness = async (req, res) => {
    try {
        // check if admin, return if true: no admin should be able to leave the business yet
        if (req.role === BusinessRole.BUSINESS_ADMIN) res.status(403).json({
            "status": "error",
            "message": "Admin cannot leave the business"
        });
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const businessID = req.businessID;

        // find business
        const foundBusiness = await Business.findOne({ "_id": businessID });
        if (!foundBusiness) return res.status(403).json({
            "status": "error",
            "message": "Business is not found"
        });

        // delete id in Business
        // tertinary is quite bad actually. When we implement more role into our system, then everything could break.
        const role = (req.role === BusinessRole.ACCOUNTANT) ? "accountants" : "viewers";
        await Business.findOneAndUpdate({ "_id": businessID } ,{
            $pull: { 
                [role]: { "userID": userID }
            }
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated Business : ", docs);
            }
            catch(err) {
                console.log(err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot delete user from business"
                });
            }
        });

        // delete role in User
        await User.findOneAndUpdate({ "_id": userID }, {
            $pull: { 
                "businessRoles": { "businessID": businessID }
            }
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot delete business from user"
                });
            }
        });

        res.status(200).json({
            "status": "success",
            "message": "Leave the business successfully"
        });
    }
    catch(err){
        console.error("Unexpected error at leave business code endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at leave business code endpoint"
        });
    }
}

module.exports = { generateJoinCode, joinBusiness, leaveBusiness };