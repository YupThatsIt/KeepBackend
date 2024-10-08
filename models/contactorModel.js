// StakeHolder related models -> Done

const mongoose = require("mongoose");
const { ContactorType } = require("../enum");

// Item schema
const contactorSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contactorType: {
        type: Number,
        enum: [
            ContactorType.CLIENT,
            ContactorType.SUPPLIER
        ],
        required: true
    },
    contactorName: {
        type: String,
        required: true
    },
    contactorPhone: {
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

const contactorCreator = (collectionName) => {
    return mongoose.model("contactors", contactorSchema, collectionName);
};

module.exports = { contactorCreator }; 