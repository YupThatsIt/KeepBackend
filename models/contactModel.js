// Contact related models -> Done

const mongoose = require("mongoose");
const { ContactType, NameTitle, BusinessType } = require("../enum");

// Contact schema
const contactSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contactType: {
        type: String,
        enum: [
            ContactType.CLIENT,
            ContactType.SUPPLIER
        ],
        required: true
    },
    contactTitle: {
        type: String,
        enum: [ 
            NameTitle.MALE, 
            NameTitle.FEMALE,
            NameTitle.SINGLE_FEMALE,
            NameTitle.NOT_SPECIFIED
        ],
        required: true
    },
    businessType: {
        type: String,
        enum: [ 
            BusinessType.COOPERATE,
            BusinessType.INDIVIDUAL
        ],
        required: true
    },
    contactFirstName: {
        type: String,
        required: true
    },
    contactLastName: {
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
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    taxID: {
        type: String,
        required: true,
    },
    imgUrl: {
        type: String
    }
}, { timestamps: true });

const contactCreator = (collectionName) => {
    return mongoose.model("contacts", contactSchema, collectionName);
};

module.exports = { contactCreator }; 