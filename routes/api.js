const express = require("express");
const router = express.Router();
// const { login, register } = require("../controllers/");
const {
  confirmMail,
  generateConfirm,
  passwordGenerateConfirm,
  newPassword,
} = require("../controllers/emailVerification");

router.get("/welcome", (req, res) => {
  console.log(req.session.user);
  res.send(`Welcome ${req.session.user.name}`);
});

router.get("/confirm-mail", confirmMail);
router.get("/generate-confirm", generateConfirm);

router.get("/password-generate-confirm", passwordGenerateConfirm);
router.post("/new-password", newPassword);

module.exports = router;
