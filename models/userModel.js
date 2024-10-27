// User related models -> Done (Optional refactor)

const mongoose = require("mongoose");
const { NameTitle, BusinessRole } = require("../enum");

// User document holds authentication and authorization related data. Which include business roles too
// refresh token is used for JWT authentication. Its existence is needed for now
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    businessRoles: [{
        _id: false,
        businessID: {
            type: mongoose.Schema.Types.ObjectId
        }, 
        role: {
            type: String,
            enum: [ 
                BusinessRole.BUSINESS_ADMIN,
                BusinessRole.ACCOUNTANT, 
                BusinessRole.VIEWER 
            ]
        }
    }],
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// seperation of user and account for security and quering time reasons
const userAccountSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        enum: [ 
            NameTitle.MALE, 
            NameTitle.FEMALE,
            NameTitle.SINGLE_FEMALE,
            NameTitle.NOT_SPECIFIED
        ],
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    imgUrl: {
        type: String
    }
}, { timestamps: true });

const User = mongoose.model("users", userSchema, "users");
const Account = mongoose.model("accounts", userAccountSchema, "accounts");
module.exports = { User, Account };