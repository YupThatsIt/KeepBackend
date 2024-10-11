const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const { createContact } = require("../controllers/contactController");

/* 
--------------------------------------------
POST /business/:businessName/contact
--------------------------------------------

Detail: 1. Check if everything is formatted correctly
        2. Check if the contact phone is duplicated or not

Input ->    {
                "type": Number, (Enum; 0:CLIENT, 1:SUPPLIER)
                "title": Number, (Enum; 0:MALE, 1:FEMALE, 2:SINGLE_FEMALE, 3:NOT_SPECIFIED)
                "firstname": String,
                "lastname": String,
                "phone": String,
                "contactorBusinessName": String,
                "contactorBusinessPhone": String,
                "address": String,
                "taxID": String,
                "imgData": { something }
            }

Outputs ->  Status 200 "Contact created"
            Status 403
            Status 400
            Status 500
--------------------------------------------
*/ 
router.post("/business/:businessName/contact", verifyJWT, verifyRole, createContact);

module.exports = router;