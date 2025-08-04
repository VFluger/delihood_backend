const express = require("express");
const router = express.Router();
const {
  confirmMail,
  generateConfirm,
} = require("../controllers/emailVerification");
const { loginAuthWithoutEmailVer } = require("../middleware/jwtAuth");

router.get("/confirm-mail", loginAuthWithoutEmailVer, confirmMail);
router.get("/generate-confirm", loginAuthWithoutEmailVer, generateConfirm);

module.exports = router;
