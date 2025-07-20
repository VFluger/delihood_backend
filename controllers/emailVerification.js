const sql = require("../db");
const crypto = require("crypto");
const { sendConfirmationEmail } = require("../utils/mailer");

exports.generateConfirm = async (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  console.log(req.session.user);
  const userId = req.session.user.id;
  const userEmail = req.session.user.email;

  // Delete all tokens that this user has
  const resultOfDelete =
    await sql`DELETE FROM email_confirmations WHERE user_id=${userId}`;

  // Push to DB
  const result =
    await sql`INSERT INTO email_confirmations(user_id, token) VALUES(${userId}, ${token})`;
  // Send email
  sendConfirmationEmail(userEmail, token);
  res.send({ success: true });
};

exports.confirmMail = async (req, res) => {
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
  createdAt.setHours(createdAt.getHours + 2);
  const expiredDate = new Date(new Date(createdAt).getTime() + 15 * 60 * 1000); // 15min after creation
  if (expiredDate < new Date()) {
    console.log("expired");
    return res
      .status(401)
      .send({ error: "Token not valid", isInvalidToken: true });
    //Optionally: Delete token from db
  }
  //Delete token from db
  const deleteTokenResult =
    await sql`DELETE FROM user_confirmations WHERE user_id=${userId}`;

  //Update user in db to be email confirmed
  req.session.user.isEmailConfirmed = true;
  const resultOfUser =
    await sql`UPDATE users SET isemailconfirmed = true WHERE id=${userId}`;
  res.send({ success: true });
};
