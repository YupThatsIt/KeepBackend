// Business related models -> Done (Maybe a second look should be good)

const mongoose = require("mongoose");

const businessSchema = mongoose.Schema({
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
        unique: true
    },
    admin: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    accountants: [
        {
            _id: false,
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            }
        }
    ],
    viewers: [
        {
            _id: false,
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            }
        }
    ],
    joiningCode: {
        type: String
    },
    logoUrl: {
        type: String
    }
}, { timestamps: true });

const Business = mongoose.model("business", businessSchema, "businesses");
module.exports = { Business };