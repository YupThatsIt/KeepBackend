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

    res.status(200).json({ bankProviders: formattedProviders });
  } catch (err) {
    console.error("Error in getBankProviders:", err);
    res.status(500).send("Error retrieving bank providers: " + err.message);
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

    res.status(200).json({ ewalletProviders: formattedProviders });
  } catch (err) {
    console.error("Error in getEWalletProviders:", err);
    res.status(500).send("Error retrieving e-wallet providers: " + err.message);
  }
};

module.exports = {
  getBankProviders,
  getEWalletProviders,
};
