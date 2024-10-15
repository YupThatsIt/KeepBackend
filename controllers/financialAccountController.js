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

    res
      .status(201)
      .json({
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

module.exports = { addFinancialAccount,updateFinancialAccount};
