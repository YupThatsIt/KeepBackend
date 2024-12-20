const { 
    quotationCreator,
    invoiceCreator,
    receiptCreator,
    purchaseOrderCreator
} = require("../models/documentModel");
const { itemCreator } = require("../models/itemModel");
const { User, Account } = require("../models/userModel");
const { Business } = require("../models/businessModel");
const {
    DocumentStatus,
    DocumentType,
    BusinessRole,
    BusinessType
} = require("../enum");
const { daysToMilliSeconds } = require("../utils/timeCalculation");
const { haveSameFields } = require("../utils/fieldCheck");
const { newNumber } = require("../utils/newNumberGenerator");
const { validatePhone, validateTaxID } = require("../utils/stringValidation");

const mongoose = require("mongoose");

// about 30 days
const expireTime = daysToMilliSeconds(30);
const documentCodePrefixs = {
    "quotation":"QO", 
    "invoice": "IV", 
    "receipt": "RE", 
    "purchaseOrder": "PO"
};

function findNonAvailableItem(itemObjectArray, items){
    for (let i = 0; i < itemObjectArray.length; i++){
        if (items[i].quantityOnHand < itemObjectArray[i].quantity) return items[i].itemID; 
    }
    return null;
}

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
}

const zeroPad = (num, places) => String(num).padStart(places, '0');


const createDocument = async(req, res) =>{
    try {
        // check role, better this way for clarity
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        // assign input accordingly
        // just name is fine
        let {
            docNumber,
            remark,
        } = req.body;
        const {
            docType,
            createDate,
            expireDate,
            contactInfo,
            lineItems
        } = req.body;

        if (
            !docType ||
            !createDate ||
            !expireDate
        ) return res.status(400).json({
            "status": "error",
            "message": "No document type, creation and expiration date"
        });

        // business and user only require the id which fortunately, already came with headers
        // contact and line items will need to be input via user from front end
        if (
            !contactInfo.businessName ||
            !contactInfo.name ||
            !contactInfo.address ||
            !contactInfo.taxID ||
            !contactInfo.phone
        ) return res.status(400).json({
            "status": "error",
            "message": "Contact"
        });
        contactInfo.email = (contactInfo.email) ? contactInfo.email : "-";
        remark = (remark) ? remark : "-";

        // check line item
        if (lineItems.length === 0) return res.status(400).json({
            "status": "error",
            "message": "No line item"
        });

        // needed input from front end
        if (
            !lineItems[0].name ||
            !lineItems[0].itemID ||
            !lineItems[0].quantity ||
            !lineItems[0].taxRate ||
            !lineItems[0].totalCost ||
            !lineItems[0].pricePerUnit
        ) return res.status(400).json({
            "status": "error",
            "message": "Line items do not contain all necessary fields: itemID, quantity, taxRate are needed"
        });


        if (!haveSameFields(lineItems)) return res.status(400).json({
            "status": "error",
            "message": "Each Line items must contain same fields"
        });

        // contact info validation
        if (!validatePhone(contactInfo.phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });
        if (!validateTaxID(contactInfo.taxID)) return res.status(400).json({
            "status": "error",
            "message": "Invalid tax ID: must be number with length of 13"
        });
        
        // check if expiration is greater than creation
        const creationDate = new Date(createDate);
        const expirationDate =new Date(expireDate);

        if (expirationDate.getTime() < creationDate.getTime()) return res.status(400).json({
            "status": "error",
            "message": "Invalid expire date: it must not be greater than create date"
        });

        // Check document type
        // if document need more input then insert accordingly
        const businessID = req.businessID;
        const userID = mongoose.Types.ObjectId.createFromHexString(req.userID);
        const Item = itemCreator(`items::${businessID}`);
        const itemIDs = lineItems.map(lineItems => lineItems.itemID);
        const foundItems = await Item.find({"_id": { $in: itemIDs }});

        let Document;
        let docCode;
        const additionalData = {};

        const dateSearch = formatDateToYYYYMMDD(creationDate);
        switch(docType) {
            case DocumentType.QUOTATION:
                // check availability of items for some type of document
                // const nonAvailableItem = findNonAvailableItem(lineItems, foundItems);
                // if (nonAvailableItem) return res.status(400).json({
                //     "status": "error",
                //     "message": "Item's quantity on hand is lower than request",
                //     "content": nonAvailableItem
                // });
                
                // Generate quotation id
                // assuming docDisplayID is integer only
                Document = quotationCreator(`documents::${businessID}`);
                if (docNumber) {
                    if(isNaN(Number(docNumber))) return res.status(400).json({
                        "status": "error",
                        "message": "Invalid document number: must only be a sequence of numbers"
                    });

                    docCode = documentCodePrefixs.quotation + zeroPad(docNumber, 11).toString()
                    const foundDocument = await Document.findOne({ "type": docType, "documentCode": docCode })
                    if (foundDocument) return res.status(409).json({
                        "status": "error",
                        "message": "Invalid document number: document number is taken"
                    });
                }
                else {
                    // const newRegex = new RegExp(String.raw`\s${}`)
                    // const foundDocument = await Document.find({ "type": docType, "documentCode": { "$regex": /'^' + documentCodePrefixs.quotation + dateSearch + '$'/}}).select({
                    const foundDocument = await Document.find({ "documentType": docType, "documentCode": {$regex: new RegExp('^' + documentCodePrefixs.quotation + dateSearch)}}).select({
                        "_id": 0,
                        "documentCode": 1
                    });
                    const newNum = newNumber(foundDocument.map(document => Number(document.documentCode.slice(10, 13))));
                    docCode = documentCodePrefixs.quotation + dateSearch + zeroPad(newNum, 3).toString();
                }

                break;
            case DocumentType.INVOICE:
                // check availability of items for some type of document
                Document = invoiceCreator(`documents::${businessID}`);
                
                // additional input for invoice
                let { quotationRef } = req.body;
                quotationRef = (quotationRef) ? quotationRef : "-";
                
                // find credit from expire - create
                const timeDiff = expirationDate.getTime() - creationDate.getTime();
                const credit = timeDiff / (1000 * 60 * 60 * 24);
                
                additionalData.quotationRef = quotationRef;
                additionalData.credit = credit;
                
                if (docNumber) {
                    if(isNaN(Number(docNumber))) return res.status(400).json({
                        "status": "error",
                        "message": "Invalid document number: must only be a sequence of numbers"
                    });
                    
                    docCode = documentCodePrefixs.invoice + zeroPad(docNumber, 11).toString()
                    const foundDocument = await Document.findOne({ "type": docType, "documentCode": docCode })
                    if (foundDocument) return res.status(409).json({
                        "status": "error",
                        "message": "Invalid document number: document number is taken"
                    });
                }
                else {
                    const foundDocument = await Document.find({ "type": docType, "documentCode": {$regex: new RegExp('^' + documentCodePrefixs.invoice + dateSearch)}}).select({
                        "_id": 0,
                        "documentCode": 1
                    });
                    const newNum = newNumber(foundDocument.map(document => Number(document.documentCode.slice(10, 13))));
                    docCode = documentCodePrefixs.invoice + dateSearch + zeroPad(newNum, 3).toString();
                }

                break; 
            case DocumentType.RECEIPT:
                // check availability of items for some type of document
                Document = receiptCreator(`documents::${businessID}`);
                
                // additional input for invoice
                let { invoiceRef } = req.body;
                invoiceRef = (invoiceRef) ? invoiceRef : "-";

                additionalData.invoiceRef = invoiceRef;

                if (docNumber) {
                    if(isNaN(Number(docNumber))) return res.status(400).json({
                        "status": "error",
                        "message": "Invalid document number: must only be a sequence of numbers"
                    });

                    docCode = documentCodePrefixs.receipt + zeroPad(docNumber, 11).toString()
                    const foundDocument = await Document.findOne({ "type": docType, "documentCode": docCode })
                    if (foundDocument) return res.status(409).json({
                        "status": "error",
                        "message": "Invalid document number: document number is taken"
                    });
                }
                else {
                    const foundDocument = await Document.find({ "type": docType, "documentCode": {$regex: new RegExp('^' + documentCodePrefixs.receipt + dateSearch)}}).select({
                        "_id": 0,
                        "documentCode": 1
                    });
                    const newNum = newNumber(foundDocument.map(document => Number(document.documentCode.slice(10, 13))));
                    docCode = documentCodePrefixs.receipt + dateSearch + zeroPad(newNum, 3).toString();
                }

                break;
            case DocumentType.PURCHASE_ORDER:
                // check availability of items for some type of document
                Document = purchaseOrderCreator(`documents::${businessID}`);

                if (docNumber) {
                    if(isNaN(Number(docNumber))) return res.status(400).json({
                        "status": "error",
                        "message": "Invalid document number: must only be a sequence of numbers"
                    });

                    docCode = documentCodePrefixs.purchaseOrder + zeroPad(docNumber, 11).toString()
                    const foundDocument = await Document.findOne({ "type": docType, "documentCode": docCode })
                    if (foundDocument) return res.status(409).json({
                        "status": "error",
                        "message": "Invalid document number: document number is taken"
                    });
                }
                else {
                    const foundDocument = await Document.find({ "type": docType, "documentCode": {$regex: new RegExp('^' + documentCodePrefixs.purchaseOrder + dateSearch)}}).select({
                        "_id": 0,
                        "documentCode": 1
                    });
                    const newNum = newNumber(foundDocument.map(document => Number(document.documentCode.slice(10, 13))));
                    docCode = documentCodePrefixs.purchaseOrder + dateSearch + zeroPad(newNum, 3).toString();
                }
                break;
        }
                
        // fetch business info
        const foundBusiness = await Business.findOne({"_id": businessID});
        
        // fetch user info
        const foundUser = await User.findOne({"_id": userID});
        const foundAccount = await Account.findOne({"userID": userID});
        
        // calculate draft expiration
        // expireTime is global variable
        const now = new Date();
        const draftExpireAt = new Date(now.getTime() + expireTime);

        // calculate item 
        // fetch data from items object: name, price per unit -> calculate totalCost
        let totalCost = 0;
        for (let i = 0; i < lineItems.length; i++){
            totalCost += lineItems[i].totalCost;
        }

        const newDocument = new Document({
            "businessInfo" : {
                "name": foundBusiness.name + " (" + foundBusiness.branch + ")",
                "address": foundBusiness.address,
                "taxID": foundBusiness.taxID,
                "logoUrl": foundBusiness.logoUrl,
                "phone": foundBusiness.phone
            },
            "authorInfo": {
                "name": foundAccount.firstName + " " + foundAccount.lastName,
                "phone": foundAccount.phone,
                "email": foundUser.email
            },
            "contactInfo": {
                "businessName": contactInfo.businessName,
                "name": contactInfo.name,
                "address": contactInfo.address,
                "taxID": contactInfo.taxID,
                "phone": contactInfo.phone,
                "email": contactInfo.email
            },
            "remark": remark,
            "documentCode": docCode,
            "documentStatus": DocumentStatus.DRAFT,
            "documentType": docType,
            "totalCost": totalCost,
            "lineItems": lineItems,
            ...additionalData,
            "expireDate": expireDate,
            "createDate": createDate,
            "draftExpireAt": draftExpireAt
        })

        await newDocument.save();

        res.status(200).json({
            "status": "success",
            "message": "New document created"
        });
    }
    catch(err){
        console.error("Unexpected error at create document endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at create document endpoint"
        });
    }
};


const getDocument = async(req, res) =>{
    try {
        const businessID = req.businessID;
        const documentCode = req.params.documentCode;

        const codePrefix = documentCode.slice(0, 2);
        let Document;
        switch(codePrefix){
            case documentCodePrefixs.quotation: 
                Document = quotationCreator(`documents::${businessID}`);
                break;
            case documentCodePrefixs.invoice:
                Document = invoiceCreator(`documents::${businessID}`);
                break;
            case documentCodePrefixs.receipt:
                Document = receiptCreator(`documents::${businessID}`);
                break;
            case documentCodePrefixs.purchaseOrder:
                Document = purchaseOrderCreator(`documents::${businessID}`);
                break;
            default:
                return res.status(400).json({
                    "status": "error",
                    "message": "No document of this code found"
                });
        }

        const foundDocument = await Document.findOne({"documentCode": documentCode}).select({
            "_id": 0
        });
        if (!foundDocument) return res.status(400).json({
            "status": "error",
            "message": "No document of this code found"
        });

        const returnData = foundDocument;

        res.status(200).json({
            "status": "success",
            "message": "New document created",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at get document endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get document endpoint"
        });
    }
};


const listDocuments = async(req, res) =>{
    try {
        // get the qeury first
        const queryOptions = [];
        if (req.query.type instanceof Array) queryOptions.push(...req.query.type);
        else if (req.query.type) queryOptions.push(req.query.type);

        const documentTypes = [];
        if (queryOptions.length !== 0) {
            for (let i = 0; i < queryOptions.length; i++){
                switch (queryOptions[i].toLowerCase()) {
                    case "quotation":
                        if (documentTypes.indexOf(DocumentType.QUOTATION) === -1) documentTypes.push(DocumentType.QUOTATION);
                        break;
                    case "invoice":
                        if (documentTypes.indexOf(DocumentType.INVOICE) === -1) documentTypes.push(DocumentType.INVOICE);
                        break;
                    case "receipt":
                        if (documentTypes.indexOf(DocumentType.RECEIPT) === -1) documentTypes.push(DocumentType.RECEIPT);
                        break;
                    case "purchase-order":
                        if (documentTypes.indexOf(DocumentType.PURCHASE_ORDER) === -1) documentTypes.push(DocumentType.PURCHASE_ORDER);
                        break;
                    default:
                        break;
                }
            }
        }
        else documentTypes.push(...Object.values(DocumentType));

        const businessID = req.businessID;

        // push accounts according to type
        const returnData = [];
        if (documentTypes.includes(DocumentType.QUOTATION)) {
            const Document = quotationCreator(`documents::${businessID}`);
            const quotations = await Document.find({"documentType": DocumentType.QUOTATION}).select({
                "_id": 0,
                "__v": 0,
            });
            returnData.push(...quotations);
        }

        if (documentTypes.includes(DocumentType.INVOICE)) {
            const Document = invoiceCreator(`documents::${businessID}`);
            const invoices = await Document.find({"documentType": DocumentType.INVOICE}).select({
                "_id": 0,
                "__v": 0,
            });
            returnData.push(...invoices);
        }

        if (documentTypes.includes(DocumentType.RECEIPT)) {
            const Document = receiptCreator(`documents::${businessID}`);
            const receipts = await Document.find({"documentType": DocumentType.RECEIPT}).select({
                "_id": 0,
                "__v": 0,
            });
            returnData.push(...receipts);
        }

        if (documentTypes.includes(DocumentType.PURCHASE_ORDER)) {
            const Document = purchaseOrderCreator(`documents::${businessID}`);
            const purchaseOrders = await Document.find({"documentType": DocumentType.PURCHASE_ORDER}).select({
                "_id": 0,
                "__v": 0,
            });
            returnData.push(...purchaseOrders);
        }


        res.status(200).json({
            "status": "success",
            "message": "Return list of documents sucessfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at list documents endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at list documents endpoint"
        });
    }
};


const proceedToNextDocState = async(req, res) =>{
    try {
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        const businessID = req.businessID;
        const documentCode = req.params.documentCode;

        const codePrefix = documentCode.slice(0, 2);
        let Document;
        let docType;
        switch(codePrefix){
            case documentCodePrefixs.quotation: 
                Document = quotationCreator(`documents::${businessID}`);
                docType = DocumentType.QUOTATION;
                break;
            case documentCodePrefixs.invoice:
                Document = invoiceCreator(`documents::${businessID}`);
                docType = DocumentType.INVOICE;
                break;
            case documentCodePrefixs.receipt:
                Document = receiptCreator(`documents::${businessID}`);
                docType = DocumentType.RECEIPT;
                break;
            case documentCodePrefixs.purchaseOrder:
                Document = purchaseOrderCreator(`documents::${businessID}`);
                docType = DocumentType.PURCHASE_ORDER;
                break;
            default:
                return res.status(400).json({
                    "status": "error",
                    "message": "No document of this code found"
                });
        }

        const foundDocument = await Document.findOne({"documentCode": documentCode});
        const currentState = foundDocument.documentStatus;
        const lineItems = foundDocument.lineItems;

        if (currentState === DocumentStatus.DRAFT){
            // nullify the expire field
            foundDocument.draftExpireAt = null;
            if (docType === DocumentType.PURCHASE_ORDER || docType === DocumentType.INVOICE){
                foundDocument.documentStatus = DocumentStatus.WAIT_FOR_RESPONSE;
            }
            else {
                foundDocument.documentStatus = DocumentStatus.COMPLETED;
            }
        }
        else if (currentState === DocumentStatus.WAIT_FOR_RESPONSE){
            const Item = itemCreator(`items::${businessID}`);

            const itemIDs = lineItems.map(lineItem => lineItem.itemID);
            const foundItems = await Item.find({"_id": { $in: itemIDs}}).select({
                "_id": 1,
                "quantityOnHand": 1
            });


            if (docType === DocumentType.PURCHASE_ORDER){
                // do the purchase order logic
                
                // create expense transaction
                // check if money is enough
                
                // add items
                for (const curItem of foundItems){
                    const curLineItem = foundDocument.lineItems.find(lineItem => lineItem.itemID.equals(curItem._id));
                    curItem.quantityOnHand += curLineItem.quantity;
                    await curItem.save();
                }
            }
            else if (docType === DocumentType.INVOICE){
                // do the invoice logic

                // decrease items
                // check if items are enough
                

                // error check
                for (let i = 0; i < foundDocument.lineItems.length; i++){
                    const curItem = foundItems.find(item => item._id.equals(itemIDs[i]));
                    if (foundDocument.lineItems[i].quantity > curItem.quantityOnHand) {
                        return res.status(409).json({
                            "status": "error",
                            "message": `${foundDocument.lineItems[i].name} have more quantity than available, please edit the document accordingly`
                        });
                    }
                }

                // save document
                for (const curItem of foundItems){
                    const curLineItem = foundDocument.lineItems.find(lineItem => lineItem.itemID.equals(curItem._id));
                    curItem.quantityOnHand -= curLineItem.quantity;
                    await curItem.save();
                }

                // create income transaction

            }
            const now = new Date();
            foundDocument.responseReceivedAt = new Date(now.getTime());
            foundDocument.documentStatus = DocumentStatus.COMPLETED;
        }

        await foundDocument.save();


        res.status(200).json({
            "status": "success",
            "message": "Document state changed to " + foundDocument.documentStatus
        });
    }
    catch(err){
        console.error("Unexpected error at document proceed state endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at document proceed state endpoint"
        });
    }
};


const updateDocument = async(req, res) => {
    try {
        // check role, better this way for clarity
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        const businessID = req.businessID;
        const documentCode = req.params.documentCode;

        const codePrefix = documentCode.slice(0, 2);
        let Document;
        switch(codePrefix){
            case documentCodePrefixs.quotation: 
                Document = quotationCreator(`documents::${businessID}`);
                docType = DocumentType.QUOTATION;
                break;
            case documentCodePrefixs.invoice:
                Document = invoiceCreator(`documents::${businessID}`);
                docType = DocumentType.INVOICE;
                break;
            case documentCodePrefixs.receipt:
                Document = receiptCreator(`documents::${businessID}`);
                docType = DocumentType.RECEIPT;
                break;
            case documentCodePrefixs.purchaseOrder:
                Document = purchaseOrderCreator(`documents::${businessID}`);
                docType = DocumentType.PURCHASE_ORDER;
                break;
            default:
                return res.status(400).json({
                    "status": "error",
                    "message": "No document of this code found"
                });
        }

        const foundDocument = await Document.findOne({"documentCode": documentCode});

        if (foundDocument.documentStatus !== DocumentStatus.DRAFT) return res.status(403).json({
            "status": "error",
            "message": "The document is not in draft state: cannot edit"
        });

        // just name is fine
        let {
            remark,
        } = req.body;
        const {
            createDate,
            expireDate,
            contactInfo,
            lineItems
        } = req.body;

        if (
            !createDate ||
            !expireDate
        ) return res.status(400).json({
            "status": "error",
            "message": "No document type, creation and expiration date"
        });

        // business and user only require the id which fortunately, already came with headers
        // contact and line items will need to be input via user from front end
        if (
            !contactInfo.businessName ||
            !contactInfo.name ||
            !contactInfo.address ||
            !contactInfo.taxID ||
            !contactInfo.phone
        ) return res.status(400).json({
            "status": "error",
            "message": "Contact"
        });
        contactInfo.email = (contactInfo.email) ? contactInfo.email : "-";
        remark = (remark) ? remark : "-";

        // check line item
        if (lineItems.length === 0) return res.status(400).json({
            "status": "error",
            "message": "No line item"
        });

        // needed input from front end
        if (
            !lineItems[0].name ||
            !lineItems[0].itemID ||
            !lineItems[0].quantity ||
            !lineItems[0].taxRate ||
            !lineItems[0].totalCost ||
            !lineItems[0].pricePerUnit
        ) return res.status(400).json({
            "status": "error",
            "message": "Line items do not contain all necessary fields: itemID, quantity, taxRate are needed"
        });


        if (!haveSameFields(lineItems)) return res.status(400).json({
            "status": "error",
            "message": "Each Line items must contain same fields"
        });

        // contact info validation
        if (!validatePhone(contactInfo.phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });
        if (!validateTaxID(contactInfo.taxID)) return res.status(400).json({
            "status": "error",
            "message": "Invalid tax ID: must be number with length of 13"
        });
        
        // check if expiration is greater than creation
        const creationDate = new Date(createDate);
        const expirationDate =new Date(expireDate);

        if (expirationDate.getTime() < creationDate.getTime()) return res.status(400).json({
            "status": "error",
            "message": "Invalid expire date: it must not be greater than create date"
        });

        const now = new Date();
        const draftExpireAt = new Date(now.getTime() + expireTime);

        let totalCost = 0;
        for (let i = 0; i < lineItems.length; i++){
            totalCost += lineItems[i].totalCost;
        }

        // update
        foundDocument.contactInfo = contactInfo;
        foundDocument.lineItems = lineItems;
        foundDocument.totalCost = totalCost;
        foundDocument.draftExpireAt = draftExpireAt;
        foundDocument.expireDate = expireDate;
        foundDocument.createDate = createDate;
        foundDocument.remark = remark;

        if (foundDocument.documentType === DocumentType.INVOICE) {
            let { quotationRef } = req.body;
            quotationRef = (quotationRef) ? quotationRef : "-";
            foundDocument.quotationRef = quotationRef;

            const timeDiff = expirationDate.getTime() - creationDate.getTime();
            const credit = timeDiff / (1000 * 60 * 60 * 24);
            foundDocument.credit = credit;
        }
        else if (foundDocument.documentType === DocumentType.RECEIPT) {
            let { invoiceRef } = req.body;
            invoiceRef = (invoiceRef) ? invoiceRef : "-";
            foundDocument.invoiceRef = invoiceRef;
        }

        await foundDocument.save();

        res.status(200).json({
            "status": "success",
            "message": "Document updated"
        });
    }
    catch(err){
        console.error("Unexpected error at update document endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at update document endpoint"
        });
    }
};


const deleteDocument = async (req, res) => {
    try {
        // check role, better this way for clarity
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        const businessID = req.businessID;
        const documentCode = req.params.documentCode;

        const codePrefix = documentCode.slice(0, 2);
        let Document;
        switch(codePrefix){
            case documentCodePrefixs.quotation: 
                Document = quotationCreator(`documents::${businessID}`);
                docType = DocumentType.QUOTATION;
                break;
            case documentCodePrefixs.invoice:
                Document = invoiceCreator(`documents::${businessID}`);
                docType = DocumentType.INVOICE;
                break;
            case documentCodePrefixs.receipt:
                Document = receiptCreator(`documents::${businessID}`);
                docType = DocumentType.RECEIPT;
                break;
            case documentCodePrefixs.purchaseOrder:
                Document = purchaseOrderCreator(`documents::${businessID}`);
                docType = DocumentType.PURCHASE_ORDER;
                break;
            default:
                return res.status(400).json({
                    "status": "error",
                    "message": "No document of this code found"
                });
        }

        const foundDocument = await Document.findOne({"documentCode": documentCode});

        if (foundDocument.documentStatus !== DocumentStatus.DRAFT) return res.status(403).json({
            "status": "error",
            "message": "The document is not in draft state: cannot delete"
        });

        await Document.deleteOne({"documentCode": documentCode});
        
        res.status(200).json({
            "status": "success",
            "message": "Document deleted"
        });
    }
    catch(err){
        console.error("Unexpected error at delete document endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at delete document endpoint"
        });
    }
};

module.exports = { 
    createDocument, 
    listDocuments,
    getDocument,
    proceedToNextDocState,
    updateDocument,
    deleteDocument
}