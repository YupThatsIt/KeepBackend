const { User, Account } = require("../models/userModel");
const { validateEmail, validateNameEN, validateName, validatePhone }= require("../utils/stringValidation");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { NameTitle } = require("../enum");
const bcrypt = require("bcrypt");

const registrationValidate = async (req, res) => {
    try {
        const { 
            user,
            email 
        } = req.body;

        // Check input's completeness
        if (
            !user || 
            !email
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: user and email are needed"
        });
        
        // Return invalid email
        if (!validateEmail(email)) return res.status(400).json({
            "status": "error",
            "message": "Incorrect format: email's format is wrong"
        });

        // Find user and return if found
        const foundUser = await User.findOne({ $or: [{"username": user}, {"email": email}]});
        if (foundUser) return res.status(409).json({
            "status": "error",
            "message": "Duplication: the username or email is already taken"
        });

        return res.status(200).json({
            "status": "success",
            "message": "User's username and email are valid"
        });
    }
    catch(err) {
        // internal server error should be handle by backend. Not send to the frontend
        console.error("Unexpected error at registration-validation endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at registration-validation endpoint"
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { 
            user,
            email,
            pwd,
            title,
            firstName,
            lastName,
            phone,
            imgData
        } = req.body;
        
        // Check input's completeness
        if (
            !user ||
            !email ||
            !pwd ||
            !firstName ||
            !lastName ||
            !phone
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: user, email, pwd, firstName, lastName, address and phone are needed"
        });
        if (Object.values(NameTitle).indexOf(title) === -1) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum NameTitle"
        });
        
        // Change the imgUrl accordingly
        const imgUrl = (imgData) ? imgData : "-";

        // Input validation
        if (!validateName(firstName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validateName(lastName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid lastname: must contain only TH or EN alphabet"
        });
        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be a number with length of 10"
        });
        
        // Check data duplication
        const foundAccount = await Account.findOne({"phone": phone});
        if (foundAccount) return res.status(409).json({
            "status": "error",
            "message": "Duplication: phone number is already taken"
        });

        // Capitalize English names
        const formattedFirstName = (validateNameEN(firstName)) ? firstName[0].toUpperCase() + firstName.slice(1).toLowerCase() : firstName;
        const formattedLastName = (validateNameEN(lastName)) ? lastName[0].toUpperCase() + lastName.slice(1).toLowerCase() : lastName;

        // hash user's password
        const salt = await bcrypt.genSalt(10);
        const hashPwd = await bcrypt.hash(pwd, salt);
        
        // Create new instance of User
        const newUser = new User({
            "email": email,
            "username": user,
            "password": hashPwd,
            "businessRoles": [],
            "refreshToken": ""
        });
        if (!newUser) return res.status(500).json({
            "status": "error",
            "message": "Cannot create new mongoDb document: new User can't be created"
        });
        
        // Create new Account
        const userID = newUser._id;
        const newAccount = new Account({
            "userID": userID,
            "title": title,
            "firstName": formattedFirstName,
            "lastName": formattedLastName,
            "phone": phone,
            "imgUrl": imgUrl
        });
        if (!newAccount) return res.status(500).json({
            "status": "error",
            "message": "Cannot create new mongoDb document: new Account can't be created"
        });

        // Saving both new Account and User
        await newUser.save();
        await newAccount.save();

        // Generate JWT
        const accessToken = generateAccessToken(userID);
        const refreshToken = generateRefreshToken(userID);

        // Save newly generated refresh token to User
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Set refresh token to cookie with maximum age of 1 day
        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            "status": "success",
            "message": "New User and New Account created",
            "content": accessToken
        });
    }
    catch(err) {
        // internal server error should be handle by backend. Not send to the frontend
        console.error("Unexpected error at registration endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at registration endpoint"
        });
    }
};



module.exports = { registerUser, registrationValidate };