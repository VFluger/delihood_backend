const express = require("express");
const router = express.Router();
const {
  confirmMail,
  generateConfirm,
} = require("../controllers/emailVerification");

router.get("/welcome", (req, res) => {
  res.send(`Welcome user`);
});

module.exports = router;
