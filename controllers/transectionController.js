const { transactionCreator } = require("../models/transactionModel");
const { BusinessRole } = require("../enum");
const mongoose = require("mongoose");

const addTransaction = async (req, res) => {
    try {
        // Check if user has proper role (Admin or Accountant)
        if (req.role !== BusinessRole.BUSINESS_ADMIN && req.role !== BusinessRole.ACCOUNTANT) {
            return res.status(403).send("Unauthorized: Insufficient permissions");
        }

        const businessID = req.params.businessID;
        const Transaction = transactionCreator(`transactions::${businessID}`);

        // Extract transaction details from request body
        const { financialChannelID, documentReference, transactionType, amount, comment } = req.body;

        // Validate input
        if (!financialChannelID || !transactionType || amount === undefined) {
            return res.status(400).send("Missing required transaction details");
        }

        // Create new transaction
        const newTransaction = new Transaction({
            businessID: mongoose.Types.ObjectId(businessID),
            financialChannelID: mongoose.Types.ObjectId(financialChannelID),
            documentReference,
            transactionType,
            amount,
            comment
        });

        // Save the transaction
        await newTransaction.save();

        res.status(201).json({ message: "Transaction added successfully", transaction: newTransaction });
    } catch (err) {
        console.error("Error in addTransaction:", err);
        res.status(500).send("Error adding transaction: " + err.message);
    }
};

module.exports = { addTransaction };