const express = require("express");
const router = express.Router();
const { updateAccount, deleteAccount, viewAccount }  = require("../controllers/userController");
const verifyJWT = require("../middlewares/verifyJWT");


router.get("/user", verifyJWT, viewAccount);
router.put("/user", verifyJWT, updateAccount);
router.delete("/user", verifyJWT, deleteAccount);

module.exports = router;