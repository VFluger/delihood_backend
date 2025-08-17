const express = require("express");

const router = express.Router();
const { login, register, newTokens } = require("../controllers/loginRegister");

router.post("/login", login);
router.post("/register", register);
router.post("/refresh", newTokens);

const { googleSign } = require("../controllers/googleSign");
router.post("/google-sign", googleSign);

const {
  passwordGenerateConfirm,
  newPassword,
} = require("../controllers/emailVerification");

router.post("/generate-password-token", passwordGenerateConfirm);
router.post("/new-password", newPassword);

module.exports = router;
