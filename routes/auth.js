const express = require("express");

const router = express.Router();
const { login, register } = require("../controllers/loginRegister");

router.post("/login", login);
router.post("/register", register);

const {
  passwordGenerateConfirm,
  newPassword,
} = require("../controllers/emailVerification");

router.get("/generate-password-token", passwordGenerateConfirm);
router.get("/new-password", newPassword);

module.exports = router;
