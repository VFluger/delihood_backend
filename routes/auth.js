const express = require("express");

const router = express.Router();
const { login, register, newTokens } = require("../controllers/loginRegister");

router.post("/login", login);
router.post("/register", register);
router.post("/refresh", newTokens);

const {
  passwordGenerateConfirm,
  newPassword,
} = require("../controllers/emailVerification");

router.get("/generate-password-token", passwordGenerateConfirm);
router.get("/new-password", newPassword);

module.exports = router;
