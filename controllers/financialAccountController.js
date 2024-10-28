// controllers/financialAccountController.js
const {
  FinancialProvider,
  bankAccountCreator,
  ewalletAccountCreator,
  cashAccountCreator
} = require("../models/transactionModel");
const {
  BusinessRole,
  FinancialChannelProviderType,
  BankAccountType,
  EwalletAccountType
} = require("../enum");
const mongoose = require("mongoose");

const bankCodePrefix = "BNK";
const ewalletCodePrefix = "EWL";
const cashCodePrefix = "CSH";

// Major fix -> add more type
const addFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        "status": "error",
        "message": "Unauthorized: User is not the admin nor an accountant"
      });
    }

    const businessID = req.businessID;
    let { providerID } = req.body; // assuming that frontend will still send back providerID instead of a string
    const { 
      accountName,
      accountType,
      accountNumber,
      bankAccountType, // optional
      ewalletAccountType // optional
    } = req.body;

    providerID = mongoose.Types.ObjectId.createFromHexString(providerID);

    // Validate input
    if (!accountName || !accountType) {
      return res.status(400).json({
        "status": "error",
        "message": "Missing required account details"
      });
    }

    // check account type
    if (Object.values(FinancialChannelProviderType).indexOf(accountType) === -1) return res.status(400).json({
      "status": "error",
      "message": "Invalid title: must be enum NameTitle"
    });

    // check for necessary fields in certain type
    let Account;
    let newAccount;
    const initialMoney = 0;
    const zeroPad = (num, places) => String(num).padStart(places, '0');

    if(accountType === FinancialChannelProviderType.BANK){
      // check for id
      if (
        !accountNumber ||
        !bankAccountType ||
        !providerID
      ) return res.status(400).json({
        "status": "error",
        "message": "Bank account number and type are needed"
      });

      // check if bankAccountType is correct
      if (Object.values(BankAccountType).indexOf(bankAccountType) === -1) return res.status(400).json({
        "status": "error",
        "message": "Invalid title: must be enum BankAccountType"
      });

      // check if bank provider ID is correct
      const foundProvider = await FinancialProvider.findOne({$and: [{"_id": providerID}, {"providerType": FinancialChannelProviderType.BANK}]});
      if (!foundProvider) return res.status(400).json({
        "status": "error",
        "message": "Invalid bank provider ID"
      });

      // assign shortened id by finding the latest account number
      Account = bankAccountCreator(`financial_accounts::${businessID}`);
      
      const codeObjects = await Account.find({"providerType": FinancialChannelProviderType.BANK}).select({
        "_id": 0,
        "shortenedCode": 1
      });
      const codes = codeObjects.map(element => Number(element.shortenedCode.slice(-3)));
      const accountCode = (codes.length !== 0) ? bankCodePrefix + zeroPad(Math.max(...codes) + 1, 3).toString() : bankCodePrefix + "001";

      // create new type of account accordingly
      newAccount = new Account({
        providerID: providerID,
        shortenedCode: accountCode,
        accountName: accountName,
        bankAccountNumber: accountNumber,
        bankAccountType: bankAccountType,
        balance: initialMoney,
        providerType: FinancialChannelProviderType.BANK
      });
    }
    else if(accountType === FinancialChannelProviderType.EWALLET){
      // check for id
      if (
        !accountNumber ||
        !ewalletAccountType ||
        !providerID
      ) return res.status(400).json({
        "status": "error",
        "message": "Ewallet account number and type are needed"
      });

      // check if bankAccountType is correct
      if (Object.values(EwalletAccountType).indexOf(ewalletAccountType) === -1) return res.status(400).json({
        "status": "error",
        "message": "Invalid title: must be enum EwalletAccountType"
      });

      // check ewallet provider
      const foundProvider = await FinancialProvider.findOne({$and: [{"_id": providerID}, {"providerType": FinancialChannelProviderType.EWALLET}]});
      if (!foundProvider) return res.status(400).json({
        "status": "error",
        "message": "Invalid e-wallet provider ID"
      });

      // assign shortened id by finding the latest account number
      Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
      
      const codeObjects = await Account.find({"providerType": FinancialChannelProviderType.EWALLET}).select({
        "_id": 0,
        "shortenedCode": 1
      });
      const codes = codeObjects.map(element => Number(element.shortenedCode.slice(-3)));
      const accountCode = (codes.length !== 0) ? ewalletCodePrefix + zeroPad(Math.max(...codes) + 1, 3).toString() : ewalletCodePrefix + "001";

      // create new type of account accordingly
      newAccount = new Account({
        providerID: providerID,
        shortenedCode: accountCode,
        accountName: accountName,
        ewalletAccountNumber: accountNumber,
        ewalletAccountType: ewalletAccountType,
        balance: initialMoney,
        providerType: FinancialChannelProviderType.EWALLET
      });
    }
    else if(accountType === FinancialChannelProviderType.CASH){
      Account = cashAccountCreator(`financial_accounts::${businessID}`);
      
      const codeObjects = await Account.find({"providerType": FinancialChannelProviderType.CASH}).select({
        "_id": 0,
        "shortenedCode": 1
      });
      const codes = codeObjects.map(element => Number(element.shortenedCode.slice(-3)));
      const accountCode = (codes.length !== 0) ? cashCodePrefix + zeroPad(Math.max(...codes) + 1, 3).toString() : cashCodePrefix + "001";

      newAccount = new Account({
        shortenedCode: accountCode,
        accountName: accountName,
        balance: initialMoney,
        providerType: FinancialChannelProviderType.CASH
      });
    }
    await newAccount.save();

    res.status(201).json({
      "status": "success",
      "message": "Financial account created successfully",
    });
  } catch (err) {
    console.error("Unexpected error at add financial account endpoint :", err);
        return res.status(500).json({
            "status": "error",
            "message": "Unexpected error at add financial account endpoint"
        });
  }
};

// We will update only editable fields
// which is just name
const updateFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        "status": "error",
        "message": "Unauthorized: User is not the admin nor an accountant"
      });
    }

    const { accountName } = req.body;
    
    // Validate input
    if (!accountName) {
      return res.status(400).json({
        "status": "error",
        "message": "No accountName provided"
      });
    }
    
    const businessID = req.businessID;
    const financialAccountID = req.params.accountID;
    const codePrefix = financialAccountID.slice(0, 3);

    // First, find the account to determine its type
    let Account;
    if (codePrefix === bankCodePrefix) Account = bankAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === ewalletCodePrefix) Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === cashCodePrefix) Account = cashAccountCreator(`financial_accounts::${businessID}`);
    if (!Account) return res.status(403).json({
      "status": "error",
      "message": "Incorrect account ID"
    });

    // update the account
    await Account.findOneAndUpdate({"shortenedCode": financialAccountID}, {
      "accountName": accountName
  }, {"new": true}).then((docs) => {
      try {
          console.log("Updated Account : ", docs);
      }
      catch(err) {
          console.log(err);
          return res.status(500).json({
              "status": "error",
              "message": "Cannot update the financial account"
          });
      }
  });

    res.status(200).json({ 
      "status": "success", 
      "message": "Financial account updated successfully"
    });
  } catch (err) {
    console.error("Unexpected error at update financial account detail endpoint :", err);
    return res.status(500).json({
        "status": "error",
        "message": "Unexpected error at update financial account detail endpoint"
    });
  }
};

// can be both negative or positive
const updateAccountAmount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        "status": "error",
        "message": "Unauthorized: User is not the admin nor an accountant"
      });
    }

    const { amount } = req.body;

    // Validate input
    if (amount === undefined || isNaN(amount)) {
      return res.status(400).json({
        "status": "error",
        "message": "Invalid or missing amount"
      });
    }

    const businessID = req.businessID;
    const financialAccountID = req.params.accountID;
    const codePrefix = financialAccountID.slice(0, 3);

    // First, find the account to determine its type
    let Account;
    if (codePrefix === bankCodePrefix) Account = bankAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === ewalletCodePrefix) Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === cashCodePrefix) Account = cashAccountCreator(`financial_accounts::${businessID}`);
    if (!Account) return res.status(403).json({
      "status": "error",
      "message": "Incorrect account ID"
    });

    const foundAccount = await Account.findOne({"shortenedCode": financialAccountID});
    if (!foundAccount) return res.status(403).json({
      "status": "error",
      "message": "Account not found"
    });
    
    // Update the account balance
    if (foundAccount.balance + amount < 0) return res.status(400).json({
      "status": "error",
      "message": "Balance subtract amount result in negative number"
    });
    foundAccount.balance += amount; // Assuming there's a 'balance' field in your schema
    console.log(foundAccount.balance);
    await foundAccount.save();

    res.status(200).json({ 
      "status": "success",
      "message": "Account balance updated successfully" 
    });
  } catch (err) {
    console.error("Unexpected error at update financial account amount endpoint :", err);
    return res.status(500).json({
        "status": "error",
        "message": "Unexpected error at update financial account amount endpoint"
    });
  }
};

const deleteFinancialAccount = async (req, res) => {
  try {
    // Check if user has proper role (Admin or Accountant)
    if (
      req.role !== BusinessRole.BUSINESS_ADMIN &&
      req.role !== BusinessRole.ACCOUNTANT
    ) {
      return res.status(403).json({
        "status": "error",
        "message": "Unauthorized: User is not the admin nor an accountant"
      });
    }

    const businessID = req.businessID;
    const financialAccountID = req.params.accountID;
    const codePrefix = financialAccountID.slice(0, 3);

    // First, find the account to determine its type
    let Account;
    if (codePrefix === bankCodePrefix) Account = bankAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === ewalletCodePrefix) Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === cashCodePrefix) Account = cashAccountCreator(`financial_accounts::${businessID}`);
    if (!Account) return res.status(403).json({
      "status": "error",
      "message": "Incorrect account ID"
    });

    const foundAccount = await Account.findOne({"shortenedCode": financialAccountID});
    if (foundAccount) await Account.deleteOne({"shortenedCode": financialAccountID});

    // You might want to add additional logic here, such as:
    // - Checking if there are any transactions associated with this account
    // - Updating any related records or totals

    res.status(200).json({ 
      "status": "success",
      "message": "Financial account deleted successfully" 
    });
  } catch (err) {
    console.error("Unexpected error at delete financial account endpoint :", err);
    return res.status(500).json({
        "status": "error",
        "message": "Unexpected error at delete financial account endpoint"
    });
  }
};

// add query
const listFinancialAccounts = async (req, res) => {
  try {
    const queryOptions = [];
    if (req.query.type instanceof Array) queryOptions.push(...req.query.type);
    else if (req.query.type) queryOptions.push(req.query.type);

    const accountTypes = [];
    if (queryOptions.length !== 0) {
        for (let i = 0; i < queryOptions.length; i++){
            switch (queryOptions[i].toLowerCase()) {
                case "bank":
                    if (accountTypes.indexOf(FinancialChannelProviderType.BANK) === -1) accountTypes.push(FinancialChannelProviderType.BANK);
                    break;
                case "ewallet":
                    if (accountTypes.indexOf(FinancialChannelProviderType.EWALLET) === -1) accountTypes.push(FinancialChannelProviderType.EWALLET);
                    break;
                case "cash":
                    if (accountTypes.indexOf(FinancialChannelProviderType.CASH) === -1) accountTypes.push(FinancialChannelProviderType.CASH);
                    break;
                default:
                    break;
            }
        }
    }
    else accountTypes.push(...Object.values(FinancialChannelProviderType));

    const businessID = req.businessID;

    // push accounts according to type
    const returnData = [];
    if (accountTypes.includes(FinancialChannelProviderType.CASH)) {
      const Account = cashAccountCreator(`financial_accounts::${businessID}`);
      const cashAccounts = await Account.find({"providerType": FinancialChannelProviderType.CASH}).select({
        "_id": 0,
        "__v": 0,
      });
      returnData.push(...cashAccounts);
    }

    if (accountTypes.includes(FinancialChannelProviderType.BANK)) {
      const Account = bankAccountCreator(`financial_accounts::${businessID}`);
      const bankAccounts = await Account.find({"providerType": FinancialChannelProviderType.BANK}).select({
        "_id": 0,
        "__v": 0,
      });
      returnData.push(...bankAccounts);
    }

    if (accountTypes.includes(FinancialChannelProviderType.EWALLET)) {
      const Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
      const ewalletAccounts = await Account.find({"providerType": FinancialChannelProviderType.EWALLET}).select({
        "_id": 0,
        "__v": 0,
      });
      returnData.push(...ewalletAccounts);
    }

    res.status(200).json({
      "status": "sucess",
      "message": "Return list of financial accounts successfully",
      "content": returnData
    });
  } catch (err) {
    console.error("Unexpected error at list financial accounts endpoint :", err);
    return res.status(500).json({
        "status": "error",
        "message": "Unexpected error at list financial accounts endpoint"
    });
  }
};


const getFinancialAccount = async (req, res) => {
  try {
    const businessID = req.businessID;
    const financialAccountID = req.params.accountID;
    const codePrefix = financialAccountID.slice(0, 3);

    // First, find the account to determine its type
    let Account;
    if (codePrefix === bankCodePrefix) Account = bankAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === ewalletCodePrefix) Account = ewalletAccountCreator(`financial_accounts::${businessID}`);
    else if (codePrefix === cashCodePrefix) Account = cashAccountCreator(`financial_accounts::${businessID}`);
    if (!Account) return res.status(403).json({
      "status": "error",
      "message": "Incorrect account ID"
    });

    const foundAccount = await Account.findOne({"shortenedCode": financialAccountID}).select({
      "_id": 0,
      "__v": 0
    });
    if (!foundAccount) return res.status(404).json({
      "status": "error",
      "message": "No financial account found"
    });

    console.log(foundAccount);

    const returnData = foundAccount;

    res.status(200).json({ 
      "status": "success",
      "message": "Return financial channel successfully",
      "content": returnData 
    });
  } catch (err) {
    console.error("Unexpected error at get financial account endpoint :", err);
    return res.status(500).json({
        "status": "error",
        "message": "Unexpected error at get financial account endpoint"
    });
  }
};

module.exports = {
  addFinancialAccount,
  updateFinancialAccount,
  updateAccountAmount,
  deleteFinancialAccount,
  listFinancialAccounts,
  getFinancialAccount
};
