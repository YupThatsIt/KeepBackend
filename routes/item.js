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
POST /business/:businessID/item
--------------------------------------------

Detail: Create a new item for the specified business
        Only accessible by Admin and Accountant roles

Input: {
    "itemName": String,
    "itemDescription": String,
    "itemType": Number, // Enum (PRODUCT, SERVICE)
    "quantity": Number,
    "unitType": String,
    "imgData": String // optional
}

Outputs:  
    Status 201 { message: "Item created successfully", item: Object }
    Status 400 "Input is incomplete"
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.post("/business/:businessID/item", verifyJWT, verifyRole, createItem);

/* 
--------------------------------------------
PUT /business/:businessID/item/:itemID
--------------------------------------------

Detail: Update an item's details (cannot change itemType)
        Only accessible by Admin and Accountant roles

Input: {
    "itemName": String,
    "itemDescription": String,
    "quantity": Number,
    "unitType": String,
    "imgData": String // optional
}

Outputs:  
    Status 200 { message: "Item updated successfully", item: Object }
    Status 400 "Input is incomplete" | "Item not found"
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessID/item/:itemID",
  verifyJWT,
  verifyRole,
  updateItem
);

/* 
--------------------------------------------
DELETE /business/:businessID/item/:itemID
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
  "/business/:businessID/item/:itemID",
  verifyJWT,
  verifyRole,
  deleteItem
);

/* 
--------------------------------------------
GET /business/:businessID/item?type={type}
--------------------------------------------

Detail: Get items filtered by type
        type can be 'product', 'service', or 'all'

Query Parameters:
    type: String ('product', 'service', or 'all')

Outputs:  
    Status 200 { items: Array of item objects }
    Status 400 Invalid type parameter
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/

/* 
--------------------------------------------
GET /business/:businessID/item?type={type}
--------------------------------------------

Detail: Get items filtered by type
        type can be 'product', 'service', or 'all'

Query Parameters:
    type: String ('product', 'service', or 'all')

Outputs:  
    Status 200 { items: Array of item objects }
    Status 400 Invalid type parameter
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.get("/business/:businessID/item", verifyJWT, verifyRole, getItemsByType);

/* 
--------------------------------------------
GET /business/:businessID/item/:itemID
--------------------------------------------

Detail: Get details of a specific item by its ID
--------------------------------------------
*/
router.get(
  "/business/:businessID/item/:itemID",
  verifyJWT,
  verifyRole,
  getItemById
);

/* 
--------------------------------------------
PUT /business/:businessID/item/:itemID/quantity
--------------------------------------------

Detail: Update only the quantity of a specific item
        Only accessible by Admin and Accountant roles

Input: {
    "quantity": Number
}

Outputs:  
    Status 200 { message: "Item quantity updated successfully", item: Object }
    Status 400 Invalid quantity
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Item not found
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessID/item/:itemID/quantity",
  verifyJWT,
  verifyRole,
  updateItemQuantity
);

module.exports = router;
