// Transaction related models -> Editing (Add saving)

const mongoose = require("mongoose");
const {
    BankAccountType,
    TransactionType,
    FinancialChannelProviderType,
    EwalletAccountType
} = require("../enum");

// Transaction which is represent incomes and expenses
const transactionSchema = new mongoose.Schema({
    businessID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    financialChannelID: { // channel
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    documentReference: {
        type: String
    },
    transactionType: {
        type: String,
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
const financialAccountBase = {
    shortenedCode: { // short code is for frontend as displayID
        type: String,
        required: true
    },
    accountName: { // name in this case is not the actual account name but rather what you set (in the system) to identify the account
        type: String,
        required: true
    },
    balance: { // non negative integer
        type: Number
    },
    providerType: {
        type: String,
        enum: [ 
            FinancialChannelProviderType.BANK, 
            FinancialChannelProviderType.EWALLET,
            FinancialChannelProviderType.CASH
        ],
        required: true
    }
}

const cashAccountSchema = new mongoose.Schema(financialAccountBase);

// Inherit from financialAccountSchema
const bankAccountSchema = new mongoose.Schema({
    ...financialAccountBase,
    providerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    bankAccountNumber: {
        type: String,
        required: true
    },
    bankAccountType: {
        type: String,
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
    ...financialAccountBase,
    providerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ewalletAccountNumber: { // True Money uses Phone, Line Pay uses LineID?
        type: String,
        required: true
    },
    ewalletAccountType: {
        type: String,
        enum: [ 
            EwalletAccountType.CURRENT, 
        ],
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
        type: String,
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
    const bankAccount = mongoose.model("bank_account", bankAccountSchema, collectionName);
    return bankAccount;
};

const ewalletAccountCreator = (collectionName) => {
    const ewalletAccount = mongoose.model("ewallet_account", ewalletAccountSchema, collectionName);
    return ewalletAccount;
};

const cashAccountCreator = (collectionName) => {
    const cashAccount = mongoose.model("cash_account", cashAccountSchema, collectionName);
    return cashAccount;
};

// this model will have only a single collection in the system as of now
const FinancialProvider = mongoose.model("financial_provider", financialChannelProviderSchema, "financial_providers");

// export functions instead. This will make a schema with collection input name
module.exports = { transactionCreator, bankAccountCreator, ewalletAccountCreator, cashAccountCreator, FinancialProvider};