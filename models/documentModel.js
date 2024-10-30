// Business related models -> Done

const mongoose = require('mongoose');
const { DocumentStatus, DocumentType } = require("../enum");

const documentBase = {
    businessInfo: {
        name: {
            type: String
        },
        address: {
            type: String
        },
        taxID: {
            type: String
        },
        logoUrl: {
            type: String
        },
        phone: {
            type: String
        }
    },
    authorInfo: {
        name: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String
        }
    },
    contactInfo: {
        businessName: {
            type: String
        },
        name: {
            type: String
        },
        address: {
            type: String
        },
        taxID: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String
        }
    },
    remark: {
        type: String
    },
    documentCode: {
        type: String,
        required: true,
        unique: true
    },
    documentStatus: {
        type: String,
        enum: [
            DocumentStatus.DRAFT,
            DocumentStatus.WAIT_FOR_RESPONSE,
            DocumentStatus.COMPLETED,
        ],
        required: true
    },
    documentType: {
        type: String,
        enum: [
            DocumentType.QUOTATION,
            DocumentType.INVOICE,
            DocumentType.RECEIPT,
            DocumentType.PURCHASE_ORDER
        ],
        required: true
    },
    costBeforeTax: {
        type: Number,
    },
    totalTax: {
        type: Number,
    },
    totalCost: {
        type: Number,
        required: true
    },
    lineItems: [{
        _id: false,
        itemID: {
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String
        },
        quantity: {
            type: Number
        },
        pricePerUnit: {
            type: Number
        },
        taxRate: {
            type: Number
        },
        totalCost: {
            type: Number
        }
    }],
    expireDate: {
        type: Date
    },
    createDate: {
        type: Date
    },
    creationCompletedAt: {
        type: Date
    },
    draftExpireAt: {
        type: Date,
        index: { expires: 0 }
    }
}

const quotationSchema = mongoose.Schema({
    ...documentBase
}, {
    timestamps: true
});

const invoiceSchema = mongoose.Schema({
    ...documentBase,
    quotationRef: {
        type: String
    },
    credit: {
        type: Number,
        required: true
    },
    responseReceivedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const taxInvoiceSchema = mongoose.Schema({
    ...documentBase,
    invoiceRef: {
        type: String
    }
}, {
    timestamps: true
});

const receiptSchema = mongoose.Schema({
    ...documentBase,
    invoiceRef: {
        type: String
    }
}, {
    timestamps: true
});

const purchaseOrderSchema = mongoose.Schema({
    ...documentBase,
    responseReceivedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const quotationCreator = (collectionName) => {
    return mongoose.model("quotations", quotationSchema, collectionName);
};

const invoiceCreator = (collectionName) => {
    return mongoose.model("invoices", invoiceSchema, collectionName);
};

const taxInvoiceCreator = (collectionName) => {
    return mongoose.model("tax_invoices", taxInvoiceSchema, collectionName);
};

const receiptCreator = (collectionName) => {
    return mongoose.model("receipts", receiptSchema, collectionName);
};

const purchaseOrderCreator = (collectionName) => {
    return mongoose.model("purchase_orders", purchaseOrderSchema, collectionName);
};

module.exports = { quotationCreator, invoiceCreator, taxInvoiceCreator, receiptCreator, purchaseOrderCreator };