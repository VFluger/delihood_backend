const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");

const sql = require("../db");

exports.login = async (req, res) => {
  await check("email").isEmail().normalizeEmail().run(req);
  await check("password").isLength({ min: 8 }).escape().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  //Look for user in db
  const userFromDb = await sql`SELECT * FROM users WHERE email=${email}`;
  //If user is NOT in db, fail
  if (userFromDb.length < 1) {
    return res.status(401).send({
      error: "Incorrect email or password",
      isIncorrectPasswordOrUser: true,
    });
  }

  // Check if password is correct
  if (!(await bcrypt.compare(password, userFromDb[0].password))) {
    return res.status(401).send({
      error: "Incorrect email or password",
      isIncorrectPasswordOrUser: true,
    });
  }

  //SUCCESS: User logged in
  req.session.user = userFromDb[0]; // set session cookie
  res.send({ success: true });
};

exports.register = async (req, res) => {
  await check("username").trim().notEmpty().escape().run(req);
  await check("email").isEmail().normalizeEmail().run(req);
  await check("phone").isMobilePhone().run(req);
  await check("password").isLength({ min: 8 }).escape().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { password, email, phone, username } = req.body; // Import from request
  phone = phone.replace(/\s+/g, ""); // Remove all spaces from phone number
  const hashedPassword = await bcrypt.hash(password, 10); // Hashing password with bcrypt
  const result =
    await sql`INSERT INTO users(name, password, email, phone) VALUES(${username}, ${hashedPassword}, ${email}, ${phone})`;
  res.send({ success: true });
};

exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.send({ success: true });
  });
};
