// controllers/financialProviderController.js
const { FinancialProvider } = require("../models/transactionModel");
const { FinancialChannelProviderType } = require("../enum");

const getBankProviders = async (req, res) => {
  try {
    // Fetch all bank providers
    const bankProviders = await FinancialProvider.find({
      providerType: FinancialChannelProviderType.BANK,
    });

    // You might want to format or filter the data here if needed
    const formattedProviders = bankProviders.map((provider) => ({
      id: provider._id,
      name: provider.name,
      imgUrl: provider.imgUrl,
    }));

    res.status(200).json({
      "status": "success",
      "message": "Return bank providers successfully",
      "content": formattedProviders 
    });
  } catch (err) {
    console.error("Unexpected error at get bank provider endpoint :", err);
    return res.status(500).json({
      "status": "error",
      "message": "Unexpected error at get bank provider endpoint"
    });
  }
};

const getEWalletProviders = async (req, res) => {
  try {
    // Fetch all e-wallet providers
    const ewalletProviders = await FinancialProvider.find({
      providerType: FinancialChannelProviderType.EWALLET,
    });

    // Format the provider data
    const formattedProviders = ewalletProviders.map((provider) => ({
      id: provider._id,
      name: provider.name,
      imgUrl: provider.imgUrl,
    }));

    res.status(200).json({
      "status": "success",
      "message": "Return bank providers successfully",
      "content": formattedProviders 
    });
  } catch (err) {
    console.error("Unexpected error at get ewallet provider endpoint :", err);
    return res.status(500).json({
      "status": "error",
      "message": "Unexpected error at get ewallet provider endpoint"
    });
  }
};

module.exports = {
  getBankProviders,
  getEWalletProviders,
};
