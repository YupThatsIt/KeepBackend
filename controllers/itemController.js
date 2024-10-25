// controllers/itemController.js
const { itemCreator } = require("../models/itemModel");
const { BusinessRole, ItemType } = require("../enum");

const createItem = async (req, res) => {
    try {
        // Check if user has proper role (Admin or Accountant)
        if (req.role !== BusinessRole.BUSINESS_ADMIN && req.role !== BusinessRole.ACCOUNTANT) {
            return res.status(403).send("Unauthorized: Insufficient permissions");
        }

        const {
            itemName,
            itemDescription,
            itemType,
            quantityOnHand,
            quantityForInvoice,
            unitType,
            imgData
        } = req.body;

        // Validate required fields
        if (!itemName || itemType === undefined || 
            quantityOnHand === undefined || quantityForInvoice === undefined) {
            return res.status(400).send("Input is incomplete");
        }

        // Validate itemType
        if (!Object.values(ItemType).includes(itemType)) {
            return res.status(400).send("Invalid item type");
        }

        // Validate quantities are non-negative
        if (quantityOnHand < 0 || quantityForInvoice < 0) {
            return res.status(400).send("Quantities must be non-negative");
        }

        const Item = itemCreator(`items::${req.businessID}`);

        // Check for duplicate item name
        const existingItem = await Item.findOne({ 
            businessID: req.businessID,
            itemName: itemName 
        });

        if (existingItem) {
            return res.status(400).send("Item name already exists");
        }

        // Set default imgUrl if no imgData provided
        const imgUrl = imgData || "-";

        // Create new item
        const newItem = new Item({
            businessID: req.businessID,
            itemName,
            itemDescription,
            itemType,
            quantityOnHand,
            quantityForInvoice,
            unitType,
            imgUrl
        });

        await newItem.save();

        res.status(201).json({
            message: "Item created successfully",
            item: newItem
        });
    } catch (err) {
        console.error("Error in createItem:", err);
        res.status(500).send("Error creating item: " + err.message);
    }
};

module.exports = { createItem };