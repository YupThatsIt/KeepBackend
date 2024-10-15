// controllers/financialAccountController.js
const { bankAccountCreator, ewalletAccountCreator } = require("../models/transactionModel");
const { BusinessRole, FinancialChannelProviderType } = require("../enum");
const mongoose = require("mongoose");

const addFinancialAccount = async (req, res) => {
    try {
        // Check if user has proper role (Admin or Accountant)
        if (req.role !== BusinessRole.BUSINESS_ADMIN && req.role !== BusinessRole.ACCOUNTANT) {
            return res.status(403).send("Unauthorized: Insufficient permissions");
        }

        const { businessID } = req.params;
        const { providerID, accountName, accountType, accountNumber, accountID } = req.body;

        // Validate input
        if (!providerID || !accountName || !accountType) {
            return res.status(400).send("Missing required account details");
        }

        if (!['bank', 'ewallet'].includes(accountType)) {
            return res.status(400).send("Invalid account type");
        }

        if (accountType === 'bank' && !accountNumber) {
            return res.status(400).send("Bank account number is required");
        }

        if (accountType === 'ewallet' && !accountID) {
            return res.status(400).send("E-wallet account ID is required");
        }

        let Account;
        let newAccount;

        if (accountType === 'bank') {
            Account = bankAccountCreator(`financial_accounts::${businessID}`);
            newAccount = new Account({
                providerID: mongoose.Types.ObjectId(providerID),
                accountName,
                bankAccountNumber: accountNumber,
                bankAccountType: FinancialChannelProviderType.BANK
            });
        } else {
            Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
            newAccount = new Account({
                providerID: mongoose.Types.ObjectId(providerID),
                accountName,
                ewalletAccountID: accountID
            });
        }

        await newAccount.save();

        res.status(201).json({ message: "Financial account created successfully", account: newAccount });
    } catch (err) {
        console.error("Error in addFinancialAccount:", err);
        res.status(500).send("Error creating financial account: " + err.message);
    }
};

module.exports = { addFinancialAccount };