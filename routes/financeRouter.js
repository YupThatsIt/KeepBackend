// routes/finance.js
const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/verifyJWT");
const verifyRole = require("../middlewares/checkBusinessRole");
const {
  addTransaction,
  getTransaction,
  deleteTransaction,
  getTransactions,
} = require("../controllers/transactionController");
const {
  addFinancialAccount,
  updateFinancialAccount,
  updateAccountAmount,
  deleteFinancialAccount,
} = require("../controllers/financialAccountController");

/* 
--------------------------------------------
POST /business/:businessID/finance/transaction
--------------------------------------------

Detail: Add a new transaction to the specified business
        Only accessible by Admin and Accountant roles

Input ->    {
                "financialChannelID": String,
                "documentReference": String, // optional
                "transactionType": Number, // Enum value
                "amount": Number,
                "comment": String // optional
            }

Outputs ->  Status 201 { message: "Transaction added successfully", transaction: Object }
            Status 400 "Missing required transaction details"
            Status 401 Unauthorized (no token)
            Status 403 Forbidden (insufficient permissions)
            Status 500 Server error
--------------------------------------------
*/
router.post(
  "/business/:businessID/finance/transaction",
  verifyJWT,
  verifyRole,
  addTransaction
);
router.get(
  "/business/:businessID/finance/transaction/:transactionID",
  verifyJWT,
  verifyRole,
  getTransaction
);
router.delete(
  "/business/:businessID/finance/transaction/:transactionID",
  verifyJWT,
  verifyRole,
  deleteTransaction
);

/* 
--------------------------------------------
GET /business/:businessID/finance/transactions
--------------------------------------------

Detail: Retrieve transactions for the given business with optional filters
        Accessible by users with valid access token and business access

Query Parameters:
    type: 'income', 'expense', or 'all' (optional)
    start-date: Start date for filtering (optional)
    end-date: End date for filtering (optional)

Outputs:  
    Status 200 { transactions: Array of transaction objects }
    Status 400 Bad Request (invalid parameters)
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/transactions",
  verifyJWT,
  verifyRole,
  getTransactions
);

module.exports = router;
/* 
--------------------------------------------
POST /business/:businessID/finance/account
--------------------------------------------

Detail: Create a new financial account for the given business
        Only accessible by Admin and Accountant roles

Input: 
    {
        "providerID": String,
        "accountName": String,
        "accountType": String, // "bank" or "ewallet"
        "accountNumber": String, // for bank accounts
        "accountID": String // for ewallet accounts
    }

Outputs:  
    Status 201 { message: "Financial account created successfully", account: Object }
    Status 400 Bad Request (invalid input)
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 500 Server error
--------------------------------------------
*/
router.post(
  "/business/:businessID/finance/account",
  verifyJWT,
  verifyRole,
  addFinancialAccount
);

/* 
--------------------------------------------
PUT /business/:businessID/finance/account/:accountID
--------------------------------------------

Detail: Update an existing financial account for the given business
        Only accessible by Admin and Accountant roles

Input: 
    {
        "accountName": String,
        "accountNumber": String, // for bank accounts
        "accountID": String // for ewallet accounts
    }

Outputs:  
    Status 200 { message: "Financial account updated successfully", account: Object }
    Status 400 Bad Request (invalid input)
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Account not found
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessID/finance/account/:accountID",
  verifyJWT,
  verifyRole,
  updateFinancialAccount
);

/* 
--------------------------------------------
PUT /business/:businessID/finance/account/:accountID/amount
--------------------------------------------

Detail: Update the amount (balance) of an existing financial account
        Only accessible by Admin and Accountant roles

Input: 
    {
        "amount": Number
    }

Outputs:  
    Status 200 { message: "Account balance updated successfully", account: Object }
    Status 400 Bad Request (invalid input)
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Account not found
    Status 500 Server error
--------------------------------------------
*/
router.put(
  "/business/:businessID/finance/account/:accountID/amount",
  verifyJWT,
  verifyRole,
  updateAccountAmount
);

/* 
--------------------------------------------
DELETE /business/:businessID/finance/account/:accountID
--------------------------------------------

Detail: Delete an existing financial account for the given business
        Only accessible by Admin and Accountant roles

Input: None (accountID in URL parameters)

Outputs:  
    Status 200 { message: "Financial account deleted successfully" }
    Status 401 Unauthorized (no token)
    Status 403 Forbidden (insufficient permissions)
    Status 404 Account not found
    Status 500 Server error
--------------------------------------------
*/
router.delete(
  "/business/:businessID/finance/account/:accountID",
  verifyJWT,
  verifyRole,
  deleteFinancialAccount
);

module.exports = router;
