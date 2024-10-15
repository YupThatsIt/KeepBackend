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
  listFinancialAccounts,
  getFinancialAccount,
} = require("../controllers/financialAccountController");
const {
  getBankProviders,
  getEWalletProviders,
} = require("../controllers/financialProviderController");

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
--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/transactions",
  verifyJWT,
  verifyRole,
  getTransactions
);

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

--------------------------------------------
*/
router.delete(
  "/business/:businessID/finance/account/:accountID",
  verifyJWT,
  verifyRole,
  deleteFinancialAccount
);

/* 
--------------------------------------------
GET /business/:businessID/finance/accounts
--------------------------------------------

Detail: Retrieve all financial accounts for the given business
        Accessible by users with valid access token and business access
--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/accounts",
  verifyJWT,
  verifyRole,
  listFinancialAccounts
);

/* 
--------------------------------------------
GET /business/:businessID/finance/account/:accountID
--------------------------------------------

Detail: Retrieve details of a specific financial account for the given business
        Accessible by users with valid access token and business access

--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/account/:accountID",
  verifyJWT,
  verifyRole,
  getFinancialAccount
);

/* 
--------------------------------------------
GET /business/:businessID/finance/bank-providers
--------------------------------------------

Detail: Retrieve all available bank providers for the given business
        Accessible by users with valid access token and business access
--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/bank-providers",
  verifyJWT,
  verifyRole,
  getBankProviders
);

/* 
--------------------------------------------
GET /business/:businessID/finance/ewallet-providers
--------------------------------------------

Detail: Retrieve all available e-wallet providers for the given business
        Accessible by users with valid access token and business access

--------------------------------------------
*/
router.get(
  "/business/:businessID/finance/ewallet-providers",
  verifyJWT,
  verifyRole,
  getEWalletProviders
);

module.exports = router;
