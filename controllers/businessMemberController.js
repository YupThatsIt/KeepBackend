const { Business } = require("../models/businessModel");
const { User } = require("../models/userModel");
const { BusinessRole } = require("../enum");
const mongoose = require("mongoose");

const getBusinessMembers = async (req, res) => {
    try {
        const query = req.query;
        // if (query) {
        //     if 
        // }

        res.status(200).send("");
    }
    catch(err){
        res.status(500).send("Error at get business members endpoint : " + err);
    }
};



module.exports = { getBusinessMembers };