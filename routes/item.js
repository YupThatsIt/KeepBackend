// routes/item.js
const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const { createItem } = require("../controllers/itemController");

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
