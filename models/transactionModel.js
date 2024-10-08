// Transaction related models -> Editing (Add saving)

const mongoose = require("mongoose");
const { BankAccountType, TransactionType, FinancialChannelProviderType } = require("../enum");

// Transaction which is represent incomes and expenses
const transactionSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    financialChannelID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    documentReference: {
        type: String
    },
    transactionType: {
        type: Number,
        enum: [
            TransactionType.INCOME,
            TransactionType.EXPENSE
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    comment: {
        type: String
    }
}, { timestamps: true });

// Dynamic Collection Name -> go to dynamic model creator function first
// financial account is the base schema for bank and ewallet account
// both schemas use discriminator which mean that it will be store in the same collection which is exactly
// the expected behavior
const financialAccountSchema = new mongoose.Schema({
    providerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    accountName: { // name in this case is not the actual account name but rather what you set (in the system) to identify the account
        type: String,
        required: true
    }
});

// Inherit from financialAccountSchema
const bankAccountSchema = new mongoose.Schema({
    bankAccountNumber: {
        type: String,
        required: true
    },
    bankAccountType: {
        type: Number,
        enum: [ 
            BankAccountType.CURRENT, 
            BankAccountType.SAVING,
            BankAccountType.FIXED_DEPOSIT
        ],
        required: true
    }
});

// Inherit from financialAccountSchema
const ewalletAccountSchema = new mongoose.Schema({
    ewalletAccountID: { // True Money uses Phone, Line Pay uses LineID?
        type: String,
        required: true
    }
});

// System Wide Collection
const financialChannelProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imgUrl: {
        type: String,
        required: true
    },
    providerType: {
        type: Number,
        enum: [ 
            FinancialChannelProviderType.BANK, 
            FinancialChannelProviderType.EWALLET
        ],
        required: true
    }
});


// functions to create collection with custom names
const transactionCreator = (collectionName) => {
    return mongoose.model("transaction", transactionSchema, collectionName);
};

const bankAccountCreator = (collectionName) => {
    const financialAccount = mongoose.model("financial_account", financialAccountSchema, collectionName);
    const bankAccount = financialAccount.discriminator("bank_account", bankAccountSchema, "bank_account");
    return bankAccount;
};

const ewalletAccountCreator = (collectionName) => {
    const financialAccount = mongoose.model("financial_account", financialAccountSchema, collectionName);
    const ewalletAccount = financialAccount.discriminator("ewallet_account", ewalletAccountSchema, "ewallet_account");
    return ewalletAccount;
};

// this model will have only a single collection in the system as of now
const FinancialProvider = mongoose.model("financial_provider", financialChannelProviderSchema, "financial_providers");

// export system wide model
module.exports = { FinancialProvider };
// export functions instead. This will make a schema with collection input name
module.exports = { transactionCreator, bankAccountCreator, ewalletAccountCreator };