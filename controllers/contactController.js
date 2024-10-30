const { contactCreator } = require("../models/contactModel");
const { BusinessRole, ContactType, NameTitle, BusinessType } = require("../enum");
const { validateEmail, validatePhone, validateTaxID, validateNameEN, validateName} = require("../utils/stringValidation"); 

const createContact = async(req, res) =>{
    try {
        // check role, better this way for clarity
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        // get specific contact model, there will be many according to business
        const Contact = contactCreator(`contacts::${req.businessID}`);

        // get data passed in through request
        const {
            type,
            businessType,
            contactBusinessName,
            title,
            firstName,
            lastName,
            phone,
            address,
            email,
            taxID,
            imgData
        } = req.body;
        
        // check if the input is complete
        if (!firstName ||
            !lastName ||
            !phone ||
            !address ||
            !email ||
            !taxID
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: firstName, lastName, phone, address, email and taxID are needed"
        });

        let businessName;
        if (businessType === BusinessType.COOPERATE) {
            if (!contactBusinessName) res.status(400).json({
                "status": "error",
                "message": "Incomplete input: business name are needed for cooperate type"
            });
            businessName = contactBusinessName;
        }
        else businessName = "-";
        const imgUrl = (!imgData) ? "-" : imgData;
        
        // validate input
        if (!validateName(firstName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validateName(lastName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });
        if (!validateTaxID(taxID)) return res.status(400).json({
            "status": "error",
            "message": "Invalid tax ID: must be number with length of 13"
        });
        if (!validateEmail(email)) return res.status(400).json({
            "status": "error",
            "message": "Invalid email"
        });
        
        if (!Object.values(ContactType).includes(type)) return res.status(400).json({
            "status": "error",
            "message": "Invalid type: must be enum ContactType"
        });
        if (!Object.values(NameTitle).includes(title)) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum NameTitle"
        });
        if (!Object.values(BusinessType).includes(businessType)) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum businessType"
        });

        // check for duplicated information
        const foundContact = await Contact.findOne({ $or: [{"phone": phone}, {"email": email}]});
        if (foundContact) return res.send(409).json({
            "status": "error",
            "message": "Phone or email is already taken"
        });

        // formatting name
        const formattedFirstName = (validateNameEN(firstName)) ? firstName[0].toUpperCase() + firstName.slice(1).toLowerCase() : firstName;
        const formattedLastName = (validateNameEN(lastName)) ? lastName[0].toUpperCase() + lastName.slice(1).toLowerCase() : lastName;

        // create new contact
        const newContact = new Contact({
            "businessID": req.businessID,
            "contactType": type,
            "contactTitle": title,
            "contactFirstName": formattedFirstName,
            "contactLastName": formattedLastName,
            "contactPhone": phone,
            "businessName": businessName,
            "businessType": businessType,
            "address": address,
            "email": email,
            "taxID": taxID,
            "imgUrl": imgUrl,
        });
        if (!newContact) return res.status(500).json({
            "status": "error",
            "message": "Cannot create new Contact mongoDb document"
        });
        await newContact.save();

        res.status(200).json({
            "status": "success",
            "message": "New contact created"
        });
    }
    catch(err){
        console.error("Unexpected error at create contact endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at create contact endpoint"
        });
    }
};


const getContacts = async (req, res) => {
    try {
        // fetch from specific collection
        const Contact = contactCreator(`contacts::${req.businessID}`);
        
        // query choice: there will be only client and supplier
        const queryOptions = [];
        if (req.query.type instanceof Array) queryOptions.push(...req.query.type);
        else if (req.query.type) queryOptions.push(req.query.type);

        const contactTypes = [];
        if (queryOptions.length !== 0) {
            for (let i = 0; i < queryOptions.length; i++){
                switch (queryOptions[i].toLowerCase()) {
                    case "client":
                        if (contactTypes.indexOf(ContactType.CLIENT) === -1) contactTypes.push(ContactType.CLIENT);
                        break;
                    case "supplier":
                        if (contactTypes.indexOf(ContactType.SUPPLIER) === -1) contactTypes.push(ContactType.SUPPLIER);
                        break;
                    default:
                        break;
                }
            }
        }
        else contactTypes.push(ContactType.CLIENT, ContactType.SUPPLIER);

        const returnData = [];
        await Contact.find({"contactType": {$in: contactTypes}}).then((contacts) => {
            try {
                // found the object, like a list of Contact instances
                // console.log(contacts);
                for (let i = 0; i < contacts.length; i++){
                    const contactData = {
                        "contactID": contacts[i]._id,
                        "firstName": contacts[i].contactFirstName,
                        "lastName": contacts[i].contactLastName,
                        "phone": contacts[i].contactPhone,
                        "email": contacts[i].email,
                        "businessName": contacts[i].businessName,
                        "businessType": contacts[i].businessType,
                        "imgUrl": contacts[i].imgUrl,
                        "type": contacts[i].contactType
                    }
                    returnData.push(contactData);
                }
            }
            catch(err) {
                console.error("Error at get contacts :", err);
                return res.status(500).json({
                    "status": "error",
                    "message": "Can't get contacts"
                });
            }
        })

        res.status(200).json({
            "status": "success",
            "message": "Return list of contacts in the business successfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at get contacts endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get contacts endpoint"
        });
    }
}


const viewContact = async (req, res) => {
    try {
        // there will always include the contactID always. So no sweat
        const contactID = req.params.contactID;

        // get contact collection
        const Contact = contactCreator(`contacts::${req.businessID}`);

        const foundContact = await Contact.findOne({"_id": contactID});
        if (!foundContact) return res.status(404).json({
            "status": "error",
            "message": "No contact found"
        })

        const returnData = {
            "title": foundContact.contactTitle,
            "firstName": foundContact.contactFirstName,
            "lastName": foundContact.contactLastName,
            "phone": foundContact.contactPhone,
            "email": foundContact.email,
            "businessName": foundContact.businessName,
            "businessType": foundContact.businessType,
            "address": foundContact.address,
            "taxID": foundContact.taxID,
            "imgUrl": foundContact.imgUrl,
            "type": foundContact.contactType
        }
        
        res.status(200).json({
            "status": "success",
            "message": "Return contact information successfully",
            "content": returnData
        });
    }
    catch(err){
        console.error("Unexpected error at get contact endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get contact endpoint"
        });
    }
}


const updateContact = async (req, res) => {
    try {
        // check role, better this way for clarity
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        // get specific contact model, there will be many according to business
        const contactID = req.params.contactID;
        const Contact = contactCreator(`contacts::${req.businessID}`);

        // get data passed in through request
        const {
            type,
            title,
            firstName,
            lastName,
            phone,
            address,
            businessType,
            email,
            taxID,
            imgData
        } = req.body;
        
        // check if the input is complete
        if (!firstName ||
            !lastName ||
            !phone ||
            !address ||
            !email ||
            !taxID
        ) return res.status(400).json({
            "status": "error",
            "message": "Incomplete input: firstName, lastName, phone, address, email and taxID are needed"
        });
        const contactBusinessName = (req.contactBusinessName) ? req.contactBusinessName : "-";
        const imgUrl = (!imgData) ? "-" : imgData;
        
        // validate input
        if (!validateName(firstName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validateName(lastName)) return res.status(400).json({
            "status": "error",
            "message": "Invalid firstname: must contain only TH or EN alphabet"
        });
        if (!validatePhone(phone)) return res.status(400).json({
            "status": "error",
            "message": "Invalid phone number: must be number with length of 10"
        });
        if (!validateTaxID(taxID)) return res.status(400).json({
            "status": "error",
            "message": "Invalid tax ID: must be number with length of 13"
        });
        if (!validateEmail(email)) return res.status(400).json({
            "status": "error",
            "message": "Invalid email"
        });
        if (!Object.values(ContactType).includes(type)) return res.status(400).json({
            "status": "error",
            "message": "Invalid type: must be enum ContactType"
        });
        if (!Object.values(NameTitle).includes(title)) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum NameTitle"
        });
        if (!Object.values(BusinessType).includes(businessType)) return res.status(400).json({
            "status": "error",
            "message": "Invalid title: must be enum businessType"
        });

        // check for duplicated information from other contacts
        const foundContact = await Contact.findOne({$and: [{$or: [{"phone": phone}, {"email": email}]}, {"_id": {$ne: contactID}}]});
        if (foundContact) return res.send(409).json({
            "status": "error",
            "message": "Phone or email is already taken"
        });

        // formatting name
        const formattedFirstName = (validateNameEN(firstName)) ? firstName[0].toUpperCase() + firstName.slice(1).toLowerCase() : firstName;
        const formattedLastName = (validateNameEN(lastName)) ? lastName[0].toUpperCase() + lastName.slice(1).toLowerCase() : lastName;

        await Contact.findOneAndUpdate({ "_id": contactID}, {
            "contactType": type,
            "contactTitle": title,
            "contactFirstName": formattedFirstName,
            "contactLastName": formattedLastName,
            "contactPhone": phone,
            "businessName": contactBusinessName,
            "businessType": businessType,
            "address": address,
            "email": email,
            "taxID": taxID,
            "imgUrl": imgUrl,
        }, {"new": true}).then((docs) => {
            try {
                console.log("Updated Contact : ", docs);
            }
            catch(err) {
                return res.status(500).json({
                    "status": "error",
                    "message": "Cannot update the contact"
                });
            }
        });

        res.status(200).json({
            "status": "success",
            "message": "Contact updated",
        });
    }
    catch(err){
        console.error("Unexpected error at update contact endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at update contact endpoint"
        });
    }
}

// Curious point:
// Contact relation with document is that the contact information which is on the document doesn't matter
// a contact can be deleted here and the contact which is already on the paper will continue to exist. No sweat
const deleteContact = async (req, res) => {
    try {
        if (
            req.role !== BusinessRole.BUSINESS_ADMIN && 
            req.role !== BusinessRole.ACCOUNTANT
        ) return res.status(403).json({
            "status": "error",
            "message": "Unauthorized: User is not the admin nor an accountant"
        });

        // get specific contact model, there will be many according to business
        const contactID = req.params.contactID;
        const Contact = contactCreator(`contacts::${req.businessID}`);
        
        const foundContact = await Contact.findOne({"_id": contactID});
        if (foundContact) await Contact.deleteOne({"_id": contactID});

        res.status(200).json({
            "status": "success",
            "message": "Contact deleted",
        });
    }
    catch(err){
        console.error("Unexpected error at delete contact endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at delete contact endpoint"
        });
    }
}


const getContactByNamePrefix = async (req, res) => {
    try {
        // get specific contact model, there will be many according to business
        res.status(200).json({
            "status": "success",
            "message": "Contact deleted",
        });
    }
    catch(err){
        console.error("Unexpected error at get contact by name's prefix endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at get contact by name's prefix endpoint"
        });
    }
}

module.exports = { createContact, getContacts, viewContact, updateContact, deleteContact};