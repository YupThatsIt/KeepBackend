// StakeHolder related models -> Done

const mongoose = require("mongoose");
const { ContactType } = require("../enum");

// Item schema
const contactSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contactorType: {
        type: Number,
        enum: [
            ContactType.CLIENT,
            ContactType.SUPPLIER
        ],
        required: true
    },
    contactName: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String,
        required: true
    },
    businessName: {
        type: String
    },
    businessPhone: {
        type: String
    },
    address: {
        type: String,
    },
    taxID: {
        type: String,
        required: true,
        unique: true
    },
    imgUrl: {
        type: String
    }
}, { timestamps: true });

const contactCreator = (collectionName) => {
    return mongoose.model("contacts", contactSchema, collectionName);
};

module.exports = { contactCreator }; 