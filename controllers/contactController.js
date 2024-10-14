const { contactCreator } = require("../models/contactModel");
const { BusinessRole, ContactType } = require("../enum");
const { validateEmail, validatePhone, validateTaxID, validateNameEN, validateName} = require("../utils/stringValidation"); 

const createContact = async(req, res) =>{
    try {
        // check role
        if (req.role !== BusinessRole.BUSINESS_ADMIN && req.role !== BusinessRole.ACCOUNTANT) return res.sendStatus(403);

        // get specific contact model, there will be many according to business
        const Contact = contactCreator(`contacts::${req.businessID}`);

        // get data passed in through request
        const { type, title, firstName, lastName, phone, address, email, taxID, imgData} = req.body;
        let { contactBusinessName } = req.body;
        let imgUrl;

        // check if the input is complete
        if (!firstName || !lastName || !phone || !address || !email || !taxID) return res.status(400).send("Input is incomplete");
        if (!contactBusinessName) contactBusinessName = "-";
        
        // change if imgData is anything other than a simple string
        if (!imgData) imgUrl = "-";
        else imgUrl = imgData;
        
        // validate input
        if (!validateName(firstName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validateName(lastName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");
        if (!validateTaxID(taxID)) return res.status(400).send("Invalid tax ID: must be number with length of 13");
        if (!validateEmail(email)) return res.status(400).send("Invalid email");
        if (isNaN(type)) return res.status(400).send("Invalid title: must be enum of 0-1");
        if (isNaN(title)) return res.status(400).send("Invalid title: must be enum of 0-3");

        // check for duplicated information
        const foundContact = await Contact.findOne({ $or: [{"phone": phone}, {"email": email}]});
        if (foundContact) return res.send(403).send("Phone or email is already taken");

        let formattedFirstName;
        let formattedLastName; 
        if (validateNameEN(firstName)) formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        else formattedFirstName = firstName;
        if (validateNameEN(lastName)) formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        else formattedLastName = lastName;

        // create new contact
        const newContact = new Contact({
            "businessID": req.businessID,
            "contactType": type,
            "contactTitle": title,
            "contactFirstName": formattedFirstName,
            "contactLastName": formattedLastName,
            "contactPhone": phone,
            "businessName": contactBusinessName,
            "address": address,
            "email": email,
            "taxID": taxID,
            "imgUrl": imgUrl,
        });
        if (!newContact) return res.status(500).send("Cannot create new Contact mongoDb document");
        await newContact.save();

        res.status(200).send("New contact created!");
    }
    catch(err){
        res.status(500).send("Error at create contact endpoint : " + err);
    }
};


const getContacts = async (req, res) => {
    try {
        // fetch from specific collection
        const Contact = contactCreator(`contacts::${req.businessID}`);
        
        // query choice
        // there will be client and supplier
        // { type: [ 'client', 'supplier' ] }
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
        let getErr = false;
        await Contact.find({"contactType": {$in: contactTypes}}).then((contacts) => {
            try {
                // found the object, like a list of Contact instances
                // console.log(contacts);
                for (let i = 0; i < contacts.length; i++){
                    const contactData = {
                        "firstName": contacts[i].contactFirstName,
                        "lastName": contacts[i].contactLastName,
                        "phone": contacts[i].contactPhone,
                        "email": contacts[i].email,
                        "businessName": contacts[i].businessName,
                        "imgUrl": contacts[i].imgUrl,
                        "type": contacts[i].contactType
                    }
                    returnData.push(contactData);
                }
            }
            catch(err) {
                getErr = true;
                return;
            }
        })
        if (getErr) return res.status(500).send("Can't get contacts");

        res.json(returnData);
    }
    catch(err){
        res.status(500).send("Error at get contacts endpoint : " + err);
    }
}

module.exports = { createContact, getContacts };