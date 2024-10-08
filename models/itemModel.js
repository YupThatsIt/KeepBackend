// Item related models -> Done

const mongoose = require("mongoose");
const { ItemType } = require("../enum");

// Item schema
const itemSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    itemName: {
        type: String,
        required: true,
        unique: true
    },
    itemDescription: {
        type: String
    },
    itemType: {
        type: Number,
        enum: [
            ItemType.PRODUCT,
            ItemType.SERVICE
        ]
    },
    quantityOnHand: {
        type: Number,
        required: true
    },
    quantityForInvoice: {
        type: Number,
        required: true
    },
    unitType: {
        type: String
    },
    imgUrl: {
        type: String
    }
}, { timestamps: true });

const itemCreator = (collectionName) => {
    return mongoose.model("item", itemSchema, collectionName);
};

module.exports = { itemCreator }; 