// Business related models -> Done (Maybe a second look should be good)

const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    taxID: {
        type: String,
        required: true,
    },
    admin: {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        memberNumber: {
            type: Number,
            required: true
        }
    },
    accountants: [
        {
            _id: false,
            userID: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            memberNumber: {
                type: Number,
                required: true
            }
        }
    ],
    viewers: [
        {
            _id: false,
            userID: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            memberNumber: {
                type: Number,
                required: true
            }
        }
    ],
    joiningCode: {
        code: {
            type: String
        },
        codeExpireAt: {
            type: Date
        }
    },
    logoUrl: {
        type: String
    }
}, { timestamps: true });

const Business = mongoose.model("business", businessSchema, "businesses");
module.exports = { Business };