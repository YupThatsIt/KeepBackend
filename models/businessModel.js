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
    logoUrl: {
        type: String
    }
}, { timestamps: true });

const Business = mongoose.model("business", businessSchema, "businesses");
module.exports = { Business };