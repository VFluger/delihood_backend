const express = require("express");
const router = express.Router();
// const { login, register } = require("../controllers/");
const {
  passwordGenerateConfirm,
  newPassword,
} = require("../controllers/emailVerification");

router.post("/generate-password-token", passwordGenerateConfirm);
router.post("/new-password", newPassword);

module.exports = router;
