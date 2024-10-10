const { User, Account } = require("../models/userModel");
const { validateEmail, validateNameEN, validateName, validatePhone }= require("../utils/stringValidation");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const registrationValidate = async (req, res) => {
    try {
        const { user, email } = req.body;

        // check if user or email is undefined. In case data got lost when sending
        if (!user || !email) return res.status(400).send("Input is incomplete");
        
        // validate email format
        if (!validateEmail(email)) return res.status(400).send("Invalid email");

        // find user
        const foundUser = await User.findOne({ $or: [ {"username": user}, {"email": email}]}).exec();
        if (foundUser) return res.status(400).send("Username or email is already taken.");

        return res.status(200).send("User data is valid");
    }
    catch(err) {
        return res.status(500).send("Error in registration controller");
    }
};

const registerUser = async (req, res) => {
    try {
        const { user, email, pwd, title, firstName, lastName, address, phone, imgData} = req.body;
        let imgUrl;
        
        if (!user || !email || !pwd || !firstName || !lastName || !address || !phone) return res.status(400).send("Input is incompleted");
        if (isNaN(title)) return res.status(400).send("Invalid title: must be enum of int");

        // change if imgData is anything other than a simple string
        if (!imgData) imgUrl = "-";
        else imgUrl = imgData;

        // data validation
        if (!validateName(firstName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validateName(lastName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");
        
        // capitalize english names
        let formattedFirstName;
        let formattedLastName; 
        if (validateNameEN(firstName)) formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        else formattedFirstName = firstName;
        if (validateNameEN(lastName)) formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        else formattedLastName = lastName;
        
        const foundAccount = await User.findOne({"phone": phone}).exec();
        if (foundAccount) return res.send(400).send("Phone number is already in used");

        const salt = await bcrypt.genSalt(10);
        const hashPwd = await bcrypt.hash(pwd, salt); // hash/encrypt password for security reason
        const newUser = new User({
            "email": email,
            "username": user,
            "password": hashPwd,
            "businessRoles": [],
            "refreshtoken": ""
        });
        if (!newUser) return res.status(500).send("Cannot create new User mongoDb document");
        await newUser.save();
        
        const userID = newUser._id;
        const newAccount = new Account({
            "userID": userID,
            "title": title,
            "firstName": formattedFirstName,
            "lastName": formattedLastName,
            "phone": phone,
            "imgUrl": imgUrl
        });
        if (!newAccount) return res.status(500).send("Cannot create new Account mongoDb document");
        await newAccount.save();

        // generate authentication tokens
        const accessToken = jwt.sign(
            { "userID": newUser._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30m' }
        );
        const refreshToken = jwt.sign(
            { "userID": newUser._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        newUser.refreshtoken = refreshToken;
        await newUser.save();

        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ accessToken });
    }
    catch(err) {
        return res.status(500).send("Error in registration controller" + err);
    }
};



module.exports = { registerUser, registrationValidate };