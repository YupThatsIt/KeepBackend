const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const { createBusiness, getBusinesses, viewBusiness, updateBusiness } = require("../controllers/businessController");
const { generateJoinCode, joinBusiness, leaveBusiness } = require("../controllers/businessJoinLeaveController");
const { getBusinessMembers } = require("../controllers/businessMemberController");

/* 
--------------------------------------------
POST /business
--------------------------------------------

Detail: Create new business

Input ->    {
                "name": String,
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

/* 
--------------------------------------------
GET /businesses
--------------------------------------------

Detail: Get businesses that user is in. But only return necessary data

Input -> Nothing

Outputs ->  Status 200 [{
                            "role": Number, (Enum; 0:ADMIN, 1:ACCOUNTANT, 2:VIEWER)
                            "name": String,
                            "branch": String,
                            "logoUrl": String
                        },
                        {
                            "role": Number, (Enum; 0:ADMIN, 1:ACCOUNTANT, 2:VIEWER)
                            "name": String,
                            "branch": String,
                            "logoUrl": String
                        },
                        ...
                        ]
--------------------------------------------
*/ 
router.get("/businesses", verifyJWT, getBusinesses);

/* 
--------------------------------------------
GET /business/:businessName
--------------------------------------------

Detail: Get detailed business information

Input -> BusinessName as a parameter

Outputs ->  Status 200 {
                            "name": String,
                            "branch": String,
                            "address": String,
                            "phone": String,
                            "taxID": String,
                            "logoUrl": String
                        }
--------------------------------------------
*/ 
router.get("/business/:businessName", verifyJWT, verifyRole, viewBusiness);

/* 
--------------------------------------------
PUT /business/:businessName
--------------------------------------------

Detail: Get detailed business information

Input -> {
            "name": String,
            "branch": String,
            "address": String,
            "phone": String,
            "logoData": { something }
        }

Outputs ->  Status 200 -> Business updated
--------------------------------------------
*/ 
router.put("/business/:businessName", verifyJWT, verifyRole, updateBusiness);

// router.delete("/business/:businessName", verifyJWT, verifyRole, updateBusiness);

/* 
--------------------------------------------
GET /business/:businessName/join-code
--------------------------------------------

Detail: Generate join code for a business for limited time

Input -> nothing

Outputs ->  Status 200 -> { "joinCode": String } (6 digits hex)
--------------------------------------------
*/ 
router.get("/business/:businessName/join-code", verifyJWT, verifyRole, generateJoinCode);

/* 
--------------------------------------------
POST /business/join
--------------------------------------------

Detail: Join the business

Input -> {
            "joinCode": String
        }

Outputs ->  Status 200 -> Business joined
--------------------------------------------
*/ 
router.post("/business/join", verifyJWT, joinBusiness);

/* 
--------------------------------------------
DELETE /business/:businessName/leave
--------------------------------------------

Detail: Leave a business if the user is not the admin

Input -> Nothing

Outputs ->  Status 200 -> Business joined
--------------------------------------------
*/ 
router.delete("/business/:businessName/leave", verifyJWT, verifyRole, leaveBusiness);

router.get("/business/:businessName/members", verifyJWT, verifyRole, getBusinessMembers);


module.exports = router;