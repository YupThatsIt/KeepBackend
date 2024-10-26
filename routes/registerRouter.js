const express = require("express");
const router = express.Router();
const { registerUser, registrationValidate } = require("../controllers/registrationController");

/* 
--------------------------------------------
POST /user/registration-validation
--------------------------------------------

Detail: Check if username and password are taken or not

Input ->    {
                "email": String, (format : SOMETEXT@SOMETEXT.SOMETEXT)
                "user": String,
            }

Outputs ->  Status 200 "User's username and email are valid"

            Status 400 "Incomplete input: user and email are needed"
            Status 400 "Incorrect format: email's format is wrong"
            Status 409 "Duplication: the username or email is already taken"
--------------------------------------------
*/ 
router.post("/user/registration-validation", registrationValidate);

/* 
--------------------------------------------
POST /user/registration
--------------------------------------------

Detail: Create new User and Account

NOTE: imgData is optional for now, until frontend decided to send a placeholder image url or something similar if the user doesn't provide an image

Input ->    {
                "email": String, (format : SOMETEXT@SOMETEXT.SOMETEXT)
                "user": String,
                "pwd": String,
                "title": Number, (Enum; 0:MALE, 1:FEMALE, 2:SINGLE_FEMALE, 3:NOT_SPECIFIED)
                "firstName": String,
                "lastName": String,
                "address": String,
                "phone": String,
                "imgData": { something }
            }

Outputs ->  Status 200 {"access token": accessToken}

            Status 400 "Incomplete input: user, email, pwd, firstName, lastName, address and phone are needed"
            Status 400 "Invalid enum: title must be enum of 0-3 only"
            Status 400 "Invalid firstname: must contain only TH or EN alphabet"
            Status 400 "Invalid lastname: must contain only TH or EN alphabet"
            Status 400 "Invalid phone number: must be a number with length of 10"
            Status 409 "Duplication: phone number is already taken"
--------------------------------------------
*/ 
router.post("/user/registration", registerUser);

module.exports = router;