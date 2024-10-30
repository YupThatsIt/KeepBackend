const express = require("express");
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const router = express.Router();
const {
    createDocument
} = require("../controllers/documentController");

/* 
--------------------------------------------
POST /business/:businessName/finance/transaction
--------------------------------------------

create new document in draft state

Example input:
{
    "docType": "ใบเสนอราคา", (Enum DocumentType)
    "createDate": "2024-04-13",
    "expireDate": "2024-04-20",
    "contactInfo": {
      "businessName": "Business",
      "name": "Kahmin Chan",
      "address": "Ankor Wat",
      "taxID": "1234567891230",
      "phone": "1234657890"
    },
    "lineItems": [
    {
        "name": "Oreo",
        "itemID": "672262de97490e80403bce94",
        "quantity": 30,
        "taxRate": 10,
        "pricePerUnit": 20,
        "totalCost": 660
    }, 
    {
        "name": "Tangmo",
        "itemID": "6722670d1c38b91453eb63c3",
        "quantity": 15,
        "taxRate": 10,
        "pricePerUnit": 50,
        "totalCost": 825
    }]
}

    Optional input fields
------------------------------------
"quotationRef": String
"invoiceRef": String
------------------------------------

if document is invoice -> new field "quotationRef": String
if document is receipt -> new field "invoiceRef": String
*/
router.post("/business/:businessName/document", verifyJWT, verifyRole, createDocument);

module.exports = router;