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

    let {
      quantity,
      unitType
    } = req.body;
    const {
      itemName,
      itemDescription,
      itemType,
      price,
      imgData
    } = req.body;

    // change values accordingly
    if (quantity === undefined) quantity = 0;
    if (unitType === ItemType.SERVICE){
      quantity = 1;
      unitType = "-";
    }
      
    
    // Validate required field
    if (
      !itemName ||
      !itemType ||
      !price ||
      isNaN(price) ||
      !Number.isInteger(quantity)
    ) return res.status(400).json({
        "status": "error",
        "message": "Input is incomplete"
      });

    // Validate itemType
    if (!Object.values(ItemType).includes(itemType)) {
      return res.status(400).json({
        "status": "error",
        "message": "Invalid item type"
      });
    }

    // Validate quantity and price. They must be non-negative
    if (price < 0) {
      return res.status(400).json({
        "status": "error",
        "message": "Price must be non-negative"
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        "status": "error",
        "message": "Quantity must be non-negative"
      });
    }

    const Item = itemCreator(`items::${req.businessID}`);

    // Check for duplicate item name
    const existingItem = await Item.findOne({
      itemName: itemName,
    });

    if (existingItem) {
      return res.status(409).json({
        "status": "error",
        "message": "Item name already exists"
      });
    }

    // Set default imgUrl if no imgData provided
    const imgUrl = imgData || "-";

    // Create new item with quantity assigned to both fields
    const newItem = new Item({
      itemName,
      itemDescription,
      itemType,
      quantityOnHand: quantity,
      quantityForInvoice: 0,
      price,
      unitType,
      imgUrl,
    });

    await newItem.save();

    res.status(201).json({
      "status": "success",
      "message": "Item created successfully"
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

    const businessID = req.businessID;
    const itemID = req.params.itemID;
    let {
      quantity,
      unitType
    } = req.body;
    const {
      itemName,
      itemDescription,
      price,
      imgData
     } = req.body;

     // change values accordingly
     if (quantity === undefined) quantity = 0;
     if (unitType === ItemType.SERVICE) {
      quantity = 1;
      unitType = "-";
     }
     
     // Validate input
    if (!itemName || !price || isNaN(quantity) || !Number.isInteger(price)) {
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

    if (price < 0){
      return res.status(400).json({
        status: "error",
        message: "Price must be non-negative"
      });
    }

    const Item = itemCreator(`items::${businessID}`);

    // Check if item exists
    const existingItem = await Item.findOne({"_id": itemID});

    if (!existingItem) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    // Check for duplicate item name (excluding current item)
    const duplicateItem = await Item.findOne({
      itemName: itemName,
      _id: { $ne: itemID },
    });

    if (duplicateItem) {
      return res.status(409).json({
        status: "error",
        message: "Item name already exists"
      });
    }

    // Set default imgUrl if no imgData provided
    const imgUrl = imgData || "-";

    // Update item
    const updatedItem = await Item.findOneAndUpdate(
      { "_id": itemID },
      {
        itemName,
        itemDescription,
        quantityOnHand: quantity,
        unitType,
        price,
        imgUrl,
      },
      { new: true } // Return the updated document
    );

    res.status(200).json({
      status: "success",
      message: "Item updated successfully"
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

    const businessID = req.businessID;
    const itemID = req.params.itemID;

    const Item = itemCreator(`items::${businessID}`);

    // Find and delete the item
    const foundItem = await Item.findOne({"_id": itemID});
    if (foundItem) await Item.deleteOne({"_id": itemID});

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
    const businessID = req.businessID;

    const queryOptions = [];
    if (req.query.type instanceof Array) queryOptions.push(...req.query.type);
    else if (req.query.type) queryOptions.push(req.query.type);

    const itemTypes = [];
    if (queryOptions.length !== 0) {
        for (let i = 0; i < queryOptions.length; i++){
            switch (queryOptions[i].toLowerCase()) {
                case "product":
                    if (itemTypes.indexOf(ItemType.PRODUCT) === -1) itemTypes.push(ItemType.PRODUCT);
                    break;
                case "service":
                    if (itemTypes.indexOf(ItemType.SERVICE) === -1) itemTypes.push(ItemType.SERVICE);
                    break;
                default:
                    break;
            }
        }
    }
    else itemTypes.push(ItemType.PRODUCT, ItemType.SERVICE);

    const Item = itemCreator(`items::${businessID}`);

    // Get items
    const items = await Item.find({"itemType": {$in: itemTypes}});

    console.log(items);

    // Format the response
    const formattedItems = items.map((item) => ({
      id: item._id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemType: item.itemType,
      quantity: item.quantityOnHand,
      price: item.price,
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
    const businessID = req.businessID;
    const itemID = req.params.itemID;

    const Item = itemCreator(`items::${businessID}`);

    const item = await Item.findOne({"_id": itemID,});

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    // Format the response
    const formattedItem = {
      id: item._id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemType: item.itemType,
      quantity: item.quantityOnHand,
      price: item.price,
      unitType: item.unitType,
      imgUrl: item.imgUrl,
    };

    res.status(200).json({
      status: "success",
      message: "Item retrieved successfully",
      content: formattedItem
    });
  } catch (err) {
    console.error("Error in getItemById:", err);
    res.status(500).json({
      status: "error",
      message: "Error retrieving item: " + err.message
    });
  }
};


const updateItemQuantity = async (req, res) => {
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

    const businessID = req.businessID;
    const itemID = req.params.itemID;

    const { quantity } = req.body;
    // Validate quantity
    if (quantity === undefined || !Number.isInteger(quantity)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid quantity: must be an integer"
      });
    }

    const Item = itemCreator(`items::${businessID}`);

    // Find and update the item
    const foundItem = await Item.findOne({"_id": itemID});

    if (!foundItem){
      return res.status(404).json({
        status: "error",
        message: "Item not found"
      });
    }

    if (foundItem.quantityOnHand + quantity < 0) return res.status(400).json({
      status: "error",
      message: "quantity on hand is below 0"
    })
    foundItem.quantityOnHand += quantity;
    await foundItem.save()

    // Just return success message
    res.status(200).json({
      status: "success",
      message: "Item quantity updated successfully"
    });
  } catch (err) {
    console.error("Error in updateItemQuantity:", err);
    res.status(500).json({
      status: "error",
      message: "Error updating item quantity: " + err.message
    });
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
