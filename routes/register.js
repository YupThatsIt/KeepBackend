const express = require("express");
const router = express.Router();
const { registerUser } = require("../controllers/accountController");

router.post("/register", registerUser);

module.exports = router;