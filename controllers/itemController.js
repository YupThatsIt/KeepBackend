// controllers/itemController.js
const { itemCreator } = require("../models/itemModel");
const { BusinessRole, ItemType } = require("../enum");

const createItem = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: Insufficient permissions"
      });
    }

    const { itemName, itemDescription, itemType, quantity, unitType, imgData } =
      req.body;

    // Validate required fields
    if (!itemName || itemType === undefined || quantity === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Input is incomplete"
      });
    }

    // Validate itemType
    if (!Object.values(ItemType).includes(itemType)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid item type"
      });
    }

    // Validate quantity is non-negative
    if (quantity < 0) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be non-negative"
      });
    }

    const Item = itemCreator(`items::${req.businessID}`);

    // Check for duplicate item name
    const existingItem = await Item.findOne({
      businessID: req.businessID,
      itemName: itemName,
    });

    if (existingItem) {
      return res.status(400).json({
        status: "error",
        message: "Item name already exists"
      });
    }

    // Set default imgUrl if no imgData provided
    const imgUrl = imgData || "-";

    // Create new item with quantity assigned to both fields
    const newItem = new Item({
      businessID: req.businessID,
      itemName,
      itemDescription,
      itemType,
      quantityOnHand: quantity,
      quantityForInvoice: quantity,
      unitType,
      imgUrl,
    });

    await newItem.save();

    res.status(201).json({
      status: "success",
      message: "Item created successfully",
      content: newItem
    });
  } catch (err) {
    console.error("Error in createItem:", err);
    res.status(500).json({
      status: "error",
      message: "Error creating item: " + err.message
    });
  }
};



const updateItem = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    )  {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: Insufficient permissions"
      });
    }

    const { businessID, itemID } = req.params;
    const { itemName, itemDescription, quantity, unitType, imgData } = req.body;

    // Validate input
    if (!itemName || quantity === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Input is incomplete"
      });
    }

    // Validate quantity is non-negative
    if (quantity < 0){
      return res.status(400).json({
        status: "error",
        message: "Quantity must be non-negative"
      });
    }

    const Item = itemCreator(`items::${businessID}`);

    // Check if item exists
    const existingItem = await Item.findOne({
      _id: itemID,
      businessID: businessID,
    });

    if (!existingItem) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }
    // Check for duplicate item name (excluding current item)
    const duplicateItem = await Item.findOne({
      businessID: businessID,
      itemName: itemName,
      _id: { $ne: itemID },
    });

    if (duplicateItem) {
      return res.status(400).json({
        status: "error",
        message: "Item name already exists"
      });
    }

    // Set default imgUrl if no imgData provided
    const imgUrl = imgData || existingItem.imgUrl;

    // Update item
    const updatedItem = await Item.findOneAndUpdate(
      { _id: itemID, businessID: businessID },
      {
        itemName,
        itemDescription,
        quantityOnHand: quantity,
        quantityForInvoice: quantity,
        unitType,
        imgUrl,
      },
      { new: true } // Return the updated document
    );

    res.status(200).json({
      status: "success",
      message: "Item updated successfully",
      content: updatedItem
    });
  } catch (err){
    console.error("Error in updateItem:", err);
    res.status(500).json({
      status: "error",
      message: "Error updating item: " + err.message
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: Insufficient permissions"
      });
    }

    const { businessID, itemID } = req.params;

    const Item = itemCreator(`items::${businessID}`);

    // Find and delete the item
    const deletedItem = await Item.findOneAndDelete({
      _id: itemID,
      businessID: businessID,
    });

    if (!deletedItem) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "Item deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteItem:", err);
    res.status(500).json({
      status: "error",
      message: "Error deleting item: " + err.message
    });
  }
};


const getItemsByType = async (req, res) => {
  try {
    const { businessID } = req.params;
    const { type } = req.query;

    // Validate type parameter
    if (!type || !["product", "service", "all"].includes(type.toLowerCase())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid type parameter. Must be 'product', 'service', or 'all'"
      });
    }

    const Item = itemCreator(`items::${businessID}`);

    // Build query
    let query = { businessID: businessID };

    // Add type filter if not 'all'
    if (type.toLowerCase() !== "all") {
      const itemType =
        type.toLowerCase() === "product" ? ItemType.PRODUCT : ItemType.SERVICE;
      query.itemType = itemType;
    }

    // Get items
    const items = await Item.find(query);

    // Format the response
    const formattedItems = items.map((item) => ({
      id: item._id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemType: item.itemType,
      quantity: item.quantityOnHand,
      unitType: item.unitType,
      imgUrl: item.imgUrl,
    }));

    res.status(200).json({
      status: "success",
      message: "Items retrieved successfully",
      content: formattedItems
    });
  } catch (err)  {
    console.error("Error in getItemsByType:", err);
    res.status(500).json({
      status: "error",
      message: "Error retrieving items: " + err.message
    });
  }
};


const getItemById = async (req, res) => {
  try {
    const { businessID, itemID } = req.params;

    const Item = itemCreator(`items::${businessID}`);

    const item = await Item.findOne({
      _id: itemID,
      businessID: businessID,
    });

    if (!item) {
      return res.status(404).send("Item not found");
    }

    // Format the response
    const formattedItem = {
      id: item._id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemType: item.itemType,
      quantity: item.quantityOnHand,
      unitType: item.unitType,
      imgUrl: item.imgUrl,
    };

    res.status(200).json({ item: formattedItem });
  } catch (err) {
    console.error("Error in getItemById:", err);
    res.status(500).send("Error retrieving item: " + err.message);
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const { businessID, itemID } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (quantity === undefined || quantity < 0) {
      return res
        .status(400)
        .send("Invalid quantity: must be a non-negative number");
    }

    const Item = itemCreator(`items::${businessID}`);

    // Find and update the item
    const updatedItem = await Item.findOneAndUpdate(
      {
        _id: itemID,
        businessID: businessID,
      },
      {
        quantityOnHand: quantity,
        quantityForInvoice: quantity,
      }
    );

    if (!updatedItem) {
      return res.status(404).send("Item not found");
    }

    // Just return success message
    res.status(200).send("Item quantity updated successfully");
  } catch (err) {
    console.error("Error in updateItemQuantity:", err);
    res.status(500).send("Error updating item quantity: " + err.message);
  }
};

module.exports = {
  createItem,
  updateItem,
  deleteItem,
  getItemsByType,
  getItemById,
  updateItemQuantity,
};
