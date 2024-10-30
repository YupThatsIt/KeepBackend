// Item related models -> Done

const mongoose = require("mongoose");
const { ItemType } = require("../enum");

// Item schema
const itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        unique: true
    },
    itemDescription: {
        type: String
    },
    itemType: {
        type: String,
        enum: [
            ItemType.PRODUCT,
            ItemType.SERVICE
        ]
    },
    quantityOnHand: {
        type: Number,
        required: true
    },
    quantityForInvoice: { // might need to delete
        type: Number,
        required: true
    },
    unitType: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    imgUrl: {
        type: String
    }
}, { timestamps: true });

const itemCreator = (collectionName) => {
    return mongoose.model("item", itemSchema, collectionName);
};

module.exports = { itemCreator }; 