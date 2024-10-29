// routes/item.js
const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const {
  createItem,
  updateItem,
  deleteItem,
  getItemsByType,
  getItemById,
  updateItemQuantity,
} = require("../controllers/itemController");

/* 
--------------------------------------------
POST /business/:businessName/item
--------------------------------------------

Detail: Create a new item for the specified business
        Only accessible by Admin and Accountant roles

Input: {
    "itemName": String,
    "itemDescription": String,
    "itemType": Number, // Enum (PRODUCT, SERVICE)
    "quantity": Number, (Integer)
    "unitType": String,
    "price": Number,
    "imgData": String // optional
}

Outputs:  
    Status 201 { message: "Item created successfully" }
    Status 400 "Input is incomplete"
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 409 Conflict data (like product name)
    Status 500 Server error
--------------------------------------------
*/
router.post("/business/:businessName/item", verifyJWT, verifyRole, createItem);

/* 
--------------------------------------------
PUT /business/:businessName/item/:itemID
--------------------------------------------

Detail: Update an item's details (cannot change itemType)
        Only accessible by Admin and Accountant roles

Input: {
    "itemName": String,
    "itemDescription": String,
    "quantity": Number,
    "unitType": String,
    "price": Number,
    "imgData": String // optional
}

Outputs:  
    Status 200 { message: "Item updated successfully" }
    Status 400 "Input is incomplete" | "Item not found"
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 409 Conflict data (like product name)
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessName/item/:itemID",
  verifyJWT,
  verifyRole,
  updateItem
);

/* 
--------------------------------------------
DELETE /business/:businessName/item/:itemID
--------------------------------------------

Detail: Delete an item from the business
        Only accessible by Admin and Accountant roles

Input: None (parameters in URL)

Outputs:  
    Status 200 { message: "Item deleted successfully" }
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Item not found
    Status 500 Server error
--------------------------------------------
*/
router.delete(
  "/business/:businessName/item/:itemID",
  verifyJWT,
  verifyRole,
  deleteItem
);

/* 
--------------------------------------------
GET /business/:businessName/item?type={type}
--------------------------------------------

Detail: Get items filtered by type
        type can be 'product', 'service' or just leave empty for all

Query Parameters:
    type: String ('product', 'service')

Outputs:  
    Status 200 { items: Array of item objects }
    Status 400 Invalid type parameter
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.get("/business/:businessName/items", verifyJWT, verifyRole, getItemsByType);

/* 
--------------------------------------------
GET /business/:businessName/item/:itemID
--------------------------------------------

Detail: Get details of a specific item by its ID
--------------------------------------------
*/
router.get(
  "/business/:businessName/item/:itemID",
  verifyJWT,
  verifyRole,
  getItemById
);

/* 
--------------------------------------------
PUT /business/:businessName/item/:itemID/quantity
--------------------------------------------

Detail: This will add the quantity amount on top of the existing amount 
        (Not changing but rather adding more amount on top, add in subtract out)
        positive integer for adding
        negative integer for subtracting

Input: {
    "quantity": Number
}

Outputs:  
    Status 200 { message: "Item quantity updated successfully" }
    Status 400 Invalid quantity
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Item not found
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessName/item/:itemID/quantity",
  verifyJWT,
  verifyRole,
  updateItemQuantity
);

module.exports = router;
