const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const { createBusiness } = require("../controllers/businessController");

/* 
--------------------------------------------
POST /business
--------------------------------------------

Detail: 

Input ->    {
                "name": String, (format : SOMETEXT@SOMETEXT.SOMETEXT)
                "branch": String, (default : "main")
                "address": String,
                "phone": String,
                "taxID": String,
                "logoData" {}
            }

Outputs ->  Status 200 "Business created"
--------------------------------------------
*/ 
router.post("/business", verifyJWT, createBusiness);

module.exports = router;