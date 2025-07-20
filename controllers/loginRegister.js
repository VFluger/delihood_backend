const sql = require("../db");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  //Look if in db for user
  const passwordFromDB = await sql`SELECT * FROM users WHERE email=${email}`;
  //If incorrect password
  if (!(await bcrypt.compare(password, passwordFromDB[0].password))) {
    return res.status(401).send({
      error: "Incorrect email or password",
      isIncorrectPasswordOrUser: true,
    });
  }
  //User logged in
  console.log(passwordFromDB[0]);
  req.session.user = passwordFromDB[0];
  res.send({ success: true });
};

exports.register = async (req, res) => {
  const { password, email, phone, username } = req.body;
  //sanitization
  const hashedPassword = await bcrypt.hash(password, 10);
  const result =
    await sql`INSERT INTO users(name, password, email, phone) VALUES(${username}, ${hashedPassword}, ${email}, ${phone})`;
  console.log(result[0]);
  res.send({ success: true });
};

exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.send({ success: true });
  });
};
