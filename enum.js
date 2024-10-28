//////////////////////////////
// User and Account Related //
//////////////////////////////

const NameTitle = {
    MALE: "นาย",
    FEMALE: "นาง",
    SINGLE_FEMALE: "นางสาว",
    NOT_SPECIFIED: "ไม่ระบุ"
};

const BusinessRole = {
    BUSINESS_ADMIN: "admin",
    ACCOUNTANT: "accountant",
    VIEWER: "viewer"
};

//////////////////////
// Document Related //
//////////////////////

const DocumentStatus = {
    DRAFT: "ร่าง",
    WAIT_FOR_RESPONSE: "รอตอบกลับ",
    COMPLETED: "เสร็จสิ้น",
    EXPIRED: "หมดอายุ"
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
    PRODUCT: "สินค้า",
    SERVICE: "บริการ"
};

/////////////////////////
// Transaction Related //
/////////////////////////

// regard the status of transaction : it is not certain for now if a transaction could be modify in someway
const TransactionStatus = {
    FINISHED: "สำเร็จแล้ว",
    UNFINISHED: "ยังไม่สำเร็จ",
};

const TransactionType = {
    INCOME: "รายรับ",
    EXPENSE: "รายจ่าย",
};

const BankAccountType = {
    CURRENT: "กระแสรายวัน",
    SAVING: "กระแสออมทรัพย์",
    FIXED_DEPOSIT: "ฝากประจำ"
};

const EwalletAccountType = {
    E_COMMERCE: "E-commerce"
};

const FinancialChannelProviderType = {
    BANK: "ธนาคาร",
    EWALLET: "e-wallet",
    CASH: "เงินสด"
};

///////////////////////
// Contactor Related //
///////////////////////

const ContactType = {
    CLIENT: "ลูกค้า",
    SUPPLIER: "ผู้ขาย"
};

////////////
// Others //
////////////

const BusinessType = {
    COOPERATE: "นิติบุคคล",
    INDIVIDUAL: "บุคคลธรรมดา"
};

module.exports = { 
    NameTitle,
    BusinessRole,
    DocumentStatus,
    ItemType,
    TransactionStatus,
    TransactionType,
    BankAccountType,
    EwalletAccountType,
    FinancialChannelProviderType,
    ContactType,
    BusinessType
};