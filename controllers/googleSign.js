const { OAuth2Client } = require("google-auth-library");
const { check, validationResult } = require("express-validator");
const sql = require("../db");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const oAuth2Client = new OAuth2Client({ client_id: CLIENT_ID });

module.exports.googleSign = async (req, res) => {
  await check("token").isString().isLength({ min: 10 }).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array() });
  }

  const token = req.body.token;

  const ticket = await oAuth2Client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();

  console.log(payload);

  // Check if user in db, decide if register or log in
};
