//////////////////////////////
// User and Account Related //
//////////////////////////////

const NameTitle = {
    MALE: 0,
    FEMALE: 1,
    SINGLE_FEMALE: 2
};

const BusinessRole = {
    BUSINESS_ADMIN: 0,
    ACCOUNTANT: 1,
    VIEWER: 2
};

//////////////////////
// Document Related //
//////////////////////

const DocumentStatus = {
    DRAFT: 0,
    WAIT_FOR_RESPONSE: 1,
    COMPLETED: 2,
    EXPIRED: 3
};

// const DocumentType = {
//     QUOTATION: 1,
//     INVOICE: 2,
//     TAX_INVOICE: 3,
//     RECEIPT: 4,
//     PURCHASE_ORDER: 5
// };

//////////////////
// Item Related //
//////////////////

const ItemType = {
    PRODUCT: 0,
    SERVICE: 1
};

/////////////////////////
// Transaction Related //
/////////////////////////

// regard the status of transaction : it is not certain for now if a transaction could be modify in someway
const TransactionStatus = {
    FINISHED: 0,
    UNFINISHED: 1,
};

const TransactionType = {
    INCOME: 0,
    EXPENSE: 1,
};

const BankAccountType = {
    CURRENT: 0,
    SAVING: 1,
    FIXED_DEPOSIT: 2
};

const FinancialChannelProviderType = {
    BANK: 0,
    EWALLET: 1
};

///////////////////////
// Contactor Related //
///////////////////////

const ContactorType = {
    CLIENT: 0,
    SUPPLIER: 1
};

module.exports = { NameTitle, BusinessRole, DocumentStatus, ItemType, TransactionStatus, TransactionType, BankAccountType, FinancialChannelProviderType, ContactorType };