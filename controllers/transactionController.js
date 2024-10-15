// controllers/transactionController.js
const { transactionCreator } = require("../models/transactionModel");
const { BusinessRole, TransactionType } = require("../enum");
const mongoose = require("mongoose");

const addTransaction = async (req, res) => {
  try {
    // Role check (although verifyRole middleware should have handled this)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).send("Unauthorized: Insufficient permissions");
    }

    const {
      financialChannelID,
      documentReference,
      transactionType,
      amount,
      comment,
    } = req.body;

    // Input validation
    if (
      !financialChannelID ||
      transactionType === undefined ||
      amount === undefined
    ) {
      return res.status(400).send("Missing required transaction details");
    }

    // Additional validations
    if (!Object.values(TransactionType).includes(transactionType)) {
      return res.status(400).send("Invalid transaction type");
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).send("Invalid amount: must be a positive number");
    }

    const Transaction = transactionCreator(`transactions::${req.businessID}`);

    const newTransaction = new Transaction({
      businessID: mongoose.Types.ObjectId(req.businessID),
      financialChannelID: mongoose.Types.ObjectId(financialChannelID),
      documentReference,
      transactionType,
      amount,
      comment,
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error in addTransaction:", err);
    res.status(500).send("Error adding transaction: " + err.message);
  }
};

module.exports = { addTransaction };
