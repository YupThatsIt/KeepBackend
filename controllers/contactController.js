const { contactCreator } = require("../models/contactModel");
const { BusinessRole } = require("../enum");
const { validatePhone, validateTaxID, validateNameEN, validateName} = require("../utils/stringValidation"); 

const createContact = async(req, res) =>{
    try {
        // check role
        if (req.role !== BusinessRole.BUSINESS_ADMIN && req.role !== BusinessRole.ACCOUNTANT) return res.sendStatus(403);

        // get specific contact model, there will be many according to business
        const Contact = contactCreator(`contactors::ID:${req.businessID}`);

        // get data passed in through request
        const { type, title, firstName, lastName, phone, address, taxID, imgData} = req.body;
        let { contactorBusinessName, contactorBusinessPhone } = req.body;
        let imgUrl;

        // check if the input is complete
        if (!firstName || !lastName || !phone || !address || !taxID) return res.status(400).send("Input is incomplete");
        if (!contactorBusinessName) contactorBusinessName = "-";
        if (!contactorBusinessPhone) contactorBusinessPhone = "-";

        // change if imgData is anything other than a simple string
        if (!imgData) imgUrl = "-";
        else imgUrl = imgData;

        // validate input
        if (!validateName(firstName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validateName(lastName)) return res.status(400).send("Invalid firstname: must contain only TH or EN alphabet");
        if (!validatePhone(phone)) return res.status(400).send("Invalid phone number: must be number with length of 10");
        if (!validateTaxID(taxID)) return res.status(400).send("Invalid tax ID: must be number with length of 13");
        if (isNaN(type)) return res.status(400).send("Invalid title: must be enum of 0-1");
        if (isNaN(title)) return res.status(400).send("Invalid title: must be enum of 0-3");

        // check for duplicated information
        const foundContact = await Contact.findOne({"phone": phone}).exec();
        if (foundContact) return res.send(400).send("Contact's personal phone is already taken");

        let formattedFirstName;
        let formattedLastName; 
        if (validateNameEN(firstName)) formattedFirstName = firstName[0].toUpperCase() + firstName.slice(1).toLowerCase();
        else formattedFirstName = firstName;
        if (validateNameEN(lastName)) formattedLastName = lastName[0].toUpperCase() + lastName.slice(1).toLowerCase();
        else formattedLastName = lastName;

        // create new contact
        const newContact = new Contact({
            "businessID": req.businessID,
            "contactorType": type,
            "contactTitle": title,
            "contactFirstName": formattedFirstName,
            "contactLastName": formattedLastName,
            "contactPhone": phone,
            "businessName": contactorBusinessName,
            "businessPhone": contactorBusinessPhone,
            "address": address,
            "taxID": taxID,
            "imgUrl": imgUrl,
        });
        if (!newContact) return res.status(500).send("Cannot create new Contact mongoDb document");
        await newContact.save();

        res.status(200).send("New contact created!");
    }
    catch(err){
        res.status(500).send("Error at create contact endpoint" + err)
    }
};

module.exports = { createContact };