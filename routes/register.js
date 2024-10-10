const express = require("express");
const router = express.Router();
const { registerUser, registrationValidate } = require("../controllers/registrationController");

// Current Endpoints

/* 
--------------------------------------------
POST /user/registration-validation
--------------------------------------------

Detail: 1. Check if the email is in the correct format (If front end checked already, we can remove it)
        2. Check if the user is in the database already (TLDR; username and email are unique)

Input ->    {
                "email": String, (format : SOMETEXT@SOMETEXT.SOMETEXT)
                "user": String,
            }

Outputs ->  Status 200 "User data is valid"
            Status 400 "Input is incomplete" (missing one of the field)
            Status 400 "Invalid email"
            Status 400 "Username or email is already taken"
--------------------------------------------
*/ 
router.post("/user/registration-validation", registrationValidate);

/* 
--------------------------------------------
POST /user/registration
--------------------------------------------

Detail: 1. Check if user data is correct
        3. Check if firstname and lastname do not contain number or illegal characters
        2. Check if phone is in the right format and is not a duplication (Phone must be unique)

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

Outputs ->  Status 200 "User registered"
            Status 400 "Input is incomplete"
            Status 400 "Invalid title"
            Status 400 "Invalid firstname"
            Status 400 "Invalid lastname"
            Status 409 "Invalid phone number"
            Status 400 "Phone number is already in used"
--------------------------------------------
*/ 
router.post("/user/registration", registerUser);

module.exports = router;