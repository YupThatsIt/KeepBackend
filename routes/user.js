const express = require("express");
const router = express.Router();
const { viewUser, updateUser, deleteUser }  = require("../controllers/userController");
const verifyJWT = require("../middlewares/verifyJWT");

/* 
--------------------------------------------
GET /user
--------------------------------------------

Detail: 1. Check if the user existed or not
        2. Return user's information except password

NOTE: this endpoint will always send back imgUrl as it likely is the only data needed to
        get the image from image sharing services

Input ->    None (user id in the access key)

Outputs ->  Status 200 {
                            "username": String,
                            "email": String,
                            "title": Number, (Enum; 0:MALE, 1:FEMALE, 2:SINGLE_FEMALE, 3:NOT_SPECIFIED)
                            "firstName": String,
                            "lastName": String,
                            "address": String,
                            "phone": String,
                            "imgUrl": String 
                        };
            Status 401 -> no access token
            Status 403 -> can't get the info
--------------------------------------------
*/ 
router.get("/user", verifyJWT, viewUser);

/* 
--------------------------------------------
PUT /user
--------------------------------------------

Detail: 1. Check user's input and validate
        2. Check if input contain duplicated information
        3. Update User and Account

NOTE: this endpoint will always send back imgUrl as it likely is the only data needed to
        get the image from image sharing services

Input ->    None (user id in the access key)

Outputs ->  Status 200 {
                            "username": String,
                            "email": String,
                            "title": Number, (Enum; 0:MALE, 1:FEMALE, 2:SINGLE_FEMALE, 3:NOT_SPECIFIED)
                            "firstName": String,
                            "lastName": String,
                            "address": String,
                            "phone": String,
                            "imgUrl": String 
                        };
            Status 400 -> input is incorrect
            Status 401 -> no access token
            Status 403 -> can't get the info
--------------------------------------------
*/ 
router.put("/user", verifyJWT, updateUser);

/* 
--------------------------------------------
DELETE /user
--------------------------------------------

Detail: 1. Check user ID
        2. Delete the user from any business they are in but won't if the user is an admin
        3. Delete the user


NOTE: access token is useless at this point. so take care to 

Input ->    None (user id in the access key)

Outputs ->  Status 200 {
                            "username": String,
                            "email": String,
                            "title": Number, (Enum; 0:MALE, 1:FEMALE, 2:SINGLE_FEMALE, 3:NOT_SPECIFIED)
                            "firstName": String,
                            "lastName": String,
                            "address": String,
                            "phone": String,
                            "imgUrl": String 
                        };
            Status 400 -> input is incorrect
            Status 401 -> no access token
            Status 403 -> can't get the info
--------------------------------------------
*/ 
router.delete("/user", verifyJWT, deleteUser);

module.exports = router;