// controllers/financialAccountController.js
const {
  bankAccountCreator,
  ewalletAccountCreator,
} = require("../models/transactionModel");
const { BusinessRole, FinancialChannelProviderType } = require("../enum");
const mongoose = require("mongoose");

const addFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const { businessID } = req.params;
    const { providerID, accountName, accountType, accountNumber, accountID } =
      req.body;

    // Validate input
    if (!providerID || !accountName || !accountType) {
      return res.status(400).send("Missing required account details");
    }

    if (!["bank", "ewallet"].includes(accountType)) {
      return res.status(400).send("Invalid account type");
    }

    if (accountType === "bank" && !accountNumber) {
      return res.status(400).send("Bank account number is required");
    }

    if (accountType === "ewallet" && !accountID) {
      return res.status(400).send("E-wallet account ID is required");
    }

    let Account;
    let newAccount;

    if (accountType === "bank") {
      Account = bankAccountCreator(`financial_accounts::${businessID}`);
      newAccount = new Account({
        providerID: mongoose.Types.ObjectId(providerID),
        accountName,
        bankAccountNumber: accountNumber,
        bankAccountType: FinancialChannelProviderType.BANK,
      });
    } else {
      Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
      newAccount = new Account({
        providerID: mongoose.Types.ObjectId(providerID),
        accountName,
        ewalletAccountID: accountID,
      });
    }

    await newAccount.save();

    res.status(201).json({
      message: "Financial account created successfully",
      account: newAccount,
    });
  } catch (err) {
    console.error("Error in addFinancialAccount:", err);
    res.status(500).send("Error creating financial account: " + err.message);
  }
};

const updateFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const { businessID, accountID } = req.params;
    const {
      accountName,
      accountNumber,
      accountID: ewalletAccountID,
    } = req.body;

    // Validate input
    if (!accountName && !accountNumber && !ewalletAccountID) {
      return res.status(400).send("No update data provided");
    }

    // First, find the account to determine its type
    const BankAccount = bankAccountCreator(`financial_accounts::${businessID}`);
    const EWalletAccount = ewalletAccountCreator(
      `financial_accounts::${businessID}`
    );

    let account = await BankAccount.findById(accountID);
    let isBank = true;

    if (!account) {
      account = await EWalletAccount.findById(accountID);
      isBank = false;
    }

    if (!account) {
      return res.status(404).send("Financial account not found");
    }

    // Update the account
    if (accountName) account.accountName = accountName;
    if (isBank && accountNumber) account.bankAccountNumber = accountNumber;
    if (!isBank && ewalletAccountID)
      account.ewalletAccountID = ewalletAccountID;

    await account.save();

    res
      .status(200)
      .json({ message: "Financial account updated successfully", account });
  } catch (err) {
    console.error("Error in updateFinancialAccount:", err);
    res.status(500).send("Error updating financial account: " + err.message);
  }
};

const updateAccountAmount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const { businessID, accountID } = req.params;
    const { amount } = req.body;

    // Validate input
    if (amount === undefined || isNaN(amount)) {
      return res.status(400).send("Invalid or missing amount");
    }

    // Find the account (could be bank or e-wallet)
    const BankAccount = bankAccountCreator(`financial_accounts::${businessID}`);
    const EWalletAccount = ewalletAccountCreator(
      `financial_accounts::${businessID}`
    );

    let account = await BankAccount.findById(accountID);

    if (!account) {
      account = await EWalletAccount.findById(accountID);
    }

    if (!account) {
      return res.status(404).send("Financial account not found");
    }

    // Update the account balance
    account.balance = amount; // Assuming there's a 'balance' field in your schema
    await account.save();

    res
      .status(200)
      .json({ message: "Account balance updated successfully", account });
  } catch (err) {
    console.error("Error in updateAccountAmount:", err);
    res.status(500).send("Error updating account balance: " + err.message);
  }
};

const deleteFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const { businessID, accountID } = req.params;

    // Find and delete the account (could be bank or e-wallet)
    const BankAccount = bankAccountCreator(`financial_accounts::${businessID}`);
    const EWalletAccount = ewalletAccountCreator(
      `financial_accounts::${businessID}`
    );

    let deletedAccount = await BankAccount.findByIdAndDelete(accountID);

    if (!deletedAccount) {
      deletedAccount = await EWalletAccount.findByIdAndDelete(accountID);
    }

    if (!deletedAccount) {
      return res.status(404).send("Financial account not found");
    }

    // You might want to add additional logic here, such as:
    // - Checking if there are any transactions associated with this account
    // - Updating any related records or totals

    res.status(200).json({ message: "Financial account deleted successfully" });
  } catch (err) {
    console.error("Error in deleteFinancialAccount:", err);
    res.status(500).send("Error deleting financial account: " + err.message);
  }
};

const listFinancialAccounts = async (req, res) => {
  try {
    const { businessID } = req.params;

    // Get both bank and e-wallet accounts
    const BankAccount = bankAccountCreator(`financial_accounts::${businessID}`);
    const EWalletAccount = ewalletAccountCreator(
      `financial_accounts::${businessID}`
    );

    const bankAccounts = await BankAccount.find();
    const ewalletAccounts = await EWalletAccount.find();

    // Combine and format the accounts
    const accounts = [
      ...bankAccounts.map((account) => ({
        ...account.toObject(),
        accountType: "bank",
      })),
      ...ewalletAccounts.map((account) => ({
        ...account.toObject(),
        accountType: "ewallet",
      })),
    ];

    res.status(200).json({ accounts });
  } catch (err) {
    console.error("Error in getFinancialAccounts:", err);
    res.status(500).send("Error retrieving financial accounts: " + err.message);
  }
};

const getFinancialAccount = async (req, res) => {
  try {
    const { businessID, accountID } = req.params;

    // Check both bank and e-wallet accounts
    const BankAccount = bankAccountCreator(`financial_accounts::${businessID}`);
    const EWalletAccount = ewalletAccountCreator(
      `financial_accounts::${businessID}`
    );

    let account = await BankAccount.findById(accountID);
    let accountType = "bank";

    if (!account) {
      account = await EWalletAccount.findById(accountID);
      accountType = "ewallet";
    }

    if (!account) {
      return res.status(404).send("Financial account not found");
    }

    // Format the account data
    const formattedAccount = {
      ...account.toObject(),
      accountType,
    };

    res.status(200).json({ account: formattedAccount });
  } catch (err) {
    console.error("Error in getFinancialAccount:", err);
    res.status(500).send("Error retrieving financial account: " + err.message);
  }
};

module.exports = {
  addFinancialAccount,
  updateFinancialAccount,
  updateAccountAmount,
  deleteFinancialAccount,
  listFinancialAccounts,
  getFinancialAccount
};
