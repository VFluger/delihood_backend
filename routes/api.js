const express = require("express");
const router = express.Router();
// const { login, register } = require("../controllers/");
const {
  confirmMail,
  generateConfirm,
} = require("../controllers/emailVerification");

router.get("/welcome", (req, res) => {
  console.log(req.session.user);
  res.send(`Welcome ${req.session.user.name}`);
});

router.get("/confirm-mail", confirmMail);
router.get("/generate-confirm", generateConfirm);

module.exports = router;
