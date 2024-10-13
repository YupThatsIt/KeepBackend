const { Business } = require("../models/businessModel");
const { User } = require("../models/userModel");
const { BusinessRole } = require("../enum");
const crypto = require("crypto");
const mongoose = require("mongoose");

const generateJoinCode = async (req, res) => {
    try {
        if (req.role !== BusinessRole.BUSINESS_ADMIN) return res.sendStatus(403);
        const businessID = req.businessID;

        // check if code is duplicated
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

        let updateErr = false;
        await Business.findOneAndUpdate({ "_id": businessID }, {
            "joiningCode.code": randomCode,
            "joiningCode.codeExpireAt": expireTime
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated User : ", docs);
            }
            catch(err) {
                updateErr = true;
                return;
            }
        });
        if (updateErr) return res.status(500).send("Joining code cannot be updated");

        const returnData = {
            "joinCode": randomCode,
            "expireAt": expireTime
        }
        res.status(200).json(returnData);
    }
    catch(err){
        res.status(500).send("Error at generate join code endpoint : " + err);
    }
};


const joinBusiness = async (req, res) => {
    try {
        // get the joining code
        const joinCode = req.body.joinCode;
        if (!joinCode) return res.status(403).send("No join code provided");
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);

        // check if it expired
        const now = new Date();
        const foundBusiness = await Business.findOne({ "joiningCode.code": joinCode});
        if (!foundBusiness) return res.status(403).send("Code is incorrect");
        if (foundBusiness.joiningCode.codeExpireAt.getTime() < now.getTime()) return res.status(403).send("Code is expired");

        const foundUser = await User.findOne({ "_id": userID });
        const businessID = foundBusiness._id;
        
        // check if user is already joined
        if (foundUser.businessRoles.find((element) => {
            return element.businessID.equals(businessID);
        })) return res.status(200).send("User already joined the business");

        // update Business
        foundBusiness.viewers.push({
            "id": userID
        })
        await foundBusiness.save();

        // update User
        foundUser.businessRoles.push({
            businessID: businessID,
            role: BusinessRole.VIEWER
        })
        await foundUser.save();

        // return the business name and branch
        const encodedName = encodeURI(foundBusiness.name);
        const encodedBranch = encodeURI(foundBusiness.branch);
        res.json({
            "name": encodedName,
            "branch": encodedBranch
        });
    }
    catch(err){
        res.status(500).send("Error at join business endpoint : " + err);
    }
};

const leaveBusiness = async (req, res) => {
    try {
        // check if admin, return if true: no admin should be able to leave the business yet
        if (req.role === BusinessRole.BUSINESS_ADMIN) return res.status(403).send("Admin cannot leave the business");
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const businessID = req.businessID;

        // find business
        const foundBusiness = await Business.findOne({ "_id": businessID });
        if (!foundBusiness) return res.status(403).send("Business not found");

        // delete id in Business
        let updateErr = false;
        let role;
        if (req.role === BusinessRole.ACCOUNTANT) role = "accountants";
        else role = "viewers";
        await Business.findOneAndUpdate({ "_id": businessID } ,{
            $pull: { 
                [role]: { "id": userID }
            }
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated Business : ", docs);
            }
            catch(err) {
                updateErr = true;
                return;
            }
        });
        if (updateErr) return res.status(500).send("Cannot delete user from business");

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
                updateErr = true;
                return;
            }
        });
        if (updateErr) return res.status(500).send("Cannot delete business from user");

        res.status(200).send("Leave business success");
    }
    catch(err){
        res.status(500).send("Error at leave business endpoint : " + err);
    }
}

module.exports = { generateJoinCode, joinBusiness, leaveBusiness };