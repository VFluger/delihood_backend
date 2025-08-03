const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");

const sql = require("../db");

const { sendConfirmationEmail } = require("../utils/mailer");

exports.generateConfirm = async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const userId = req.session.user.id;
    const userEmail = req.session.user.email;

    // Delete all tokens that this user has
    await sql`DELETE FROM email_confirmations WHERE user_id=${userId}`;

    // Push to TABLE
    await sql`INSERT INTO email_confirmations(user_id, token) VALUES(${userId}, ${token})`;
    // Send email, reason 1 = new acc confirmation, 2 for forgotten password
    sendConfirmationEmail(userEmail, token, 1);
    res.send({ success: true });
  } catch (error) {
    res
      .status(501)
      .send({ error: "Cannot generate confirm right now, try later" });
  }
};

exports.passwordGenerateConfirm = async (req, res) => {
  try {
    //Sanitization
    await check("email").isEmail().normalizeEmail().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const userEmail = req.query.email;
    // Find user in db
    const result = await sql`SELECT id FROM users WHERE email=${userEmail}`;
    if (result.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }
    const userId = result[0].id;

    // Delete old tokens
    await sql`DELETE FROM pass_email_confirmations WHERE user_id=${userId}`;
    // Insert new token
    await sql`INSERT INTO pass_email_confirmations(user_id, token) VALUES(${userId}, ${token})`;

    sendConfirmationEmail(userEmail, token, 2);
    res.send({ success: true });
  } catch (err) {
    console.error("Failed to generate password confirmation:", err);
    res.status(500).send({ error: "Server error" });
  }
};

exports.confirmMail = async (req, res) => {
  // try {
  await check("token").isString().isLength({ min: 10 }).trim().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.status(400).send({ errors: errors.array() });
  }
  const userGivenToken = req.query.token;
  const userId = req.session.user.id;
  // Search user in db
  const result =
    await sql`SELECT created_at FROM email_confirmations WHERE token=${userGivenToken} AND user_id=${userId}`;
  if (result.length < 1) {
    return res
      .status(401)
      .send({ error: "Token not valid", isInvalidToken: true });
  }
  const createdAt = new Date(result[0].created_at);
  createdAt.setHours(createdAt.getHours() + 2);
  const expiredDate = new Date(new Date(createdAt).getTime() + 15 * 60 * 1000); // 15min after creation
  if (expiredDate < new Date()) {
    // Could check if tokens deleted, but fail, do we just return error?
    await sql`DELETE FROM pass_email_confirmations WHERE token=${userGivenToken}`;
    return res
      .status(401)
      .send({ error: "Token not valid", isInvalidToken: true });
  }
  //Delete token from db
  const deleteTokenResult =
    await sql`DELETE FROM email_confirmations WHERE user_id=${userId}`;

  //Update user in db to isemailconfirmed true
  req.session.user.isemailconfirmed = true;
  const resultOfUser =
    await sql`UPDATE users SET isemailconfirmed = true WHERE id=${userId}`;
  res.send({ success: true });
  // } catch (error) {
  //   res
  //     .status(501)
  //     .send({ error: "Cannot generate confirm right now, try later" });
  // }
};
//Same as above
exports.newPassword = async (req, res) => {
  try {
    await check("token").isString().isLength({ min: 10 }).trim().run(req);
    await check("password").isString().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array() });
    }

    const userGivenToken = req.query.token;
    const { password } = req.query;
    // Search user in db
    const result =
      await sql`SELECT created_at, user_id FROM pass_email_confirmations WHERE token=${userGivenToken}`;
    if (result.length < 1) {
      return res
        .status(401)
        .send({ error: "Token not valid", isInvalidToken: true });
    }
    const createdAt = new Date(result[0].created_at);
    const userId = result[0].user_id;
    createdAt.setHours(createdAt.getHours() + 2);
    const expiredDate = new Date(
      new Date(createdAt).getTime() + 15 * 60 * 1000
    ); // 15min after creation
    if (expiredDate < new Date()) {
      await sql`DELETE FROM pass_email_confirmations WHERE token=${userGivenToken}`;
      return res
        .status(401)
        .send({ error: "Token not valid", isInvalidToken: true });
    }
    //Delete token from db
    await sql`DELETE FROM pass_email_confirmations WHERE token=${userGivenToken}`;

    //SUCCESS
    // change password
    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password=${hashedPassword} WHERE id=${userId}`;
    res.send({ success: true });
  } catch (error) {
    res
      .status(501)
      .send({ error: "Cannot generate confirm right now, try later" });
  }
};
