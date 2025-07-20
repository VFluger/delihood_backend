const express = require("express");
const router = express.Router();
// const { login, register } = require("../controllers/");

router.get("/welcome", (req, res) => {
  console.log(req.session.user);
  res.send(`Welcome ${req.session.user.name}`);
});

module.exports = router;
