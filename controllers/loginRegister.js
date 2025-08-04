const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");

const jwt = require("jsonwebtoken");

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
    return res.status(400).send({
      error: "Incorrect email or password",
      isIncorrectPasswordOrUser: true,
    });
  }

  // Check if password is correct
  if (!(await bcrypt.compare(password, userFromDb[0].password))) {
    // Same fail
    return res.status(400).send({
      error: "Incorrect email or password",
      isIncorrectPasswordOrUser: true,
    });
  }

  //SUCCESS: User logged in

  // Short lived for user
  const jwtForUser = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
      userId: userFromDb[0].id,
    },
    process.env.JWT_SECRET
  );

  // RefreshToken used for getting a new shortlived
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const refreshToken = jwt.sign(
    {
      userId: userFromDb[0].id,
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
  // Push to db
  await sql`INSERT INTO refresh_tokens(token, expires_at) VALUES(${refreshToken}, ${refreshExpiresAt})`;
  res.send({ success: true, jwt: jwtForUser, refreshToken });
};

exports.newTokens = async (req, res) => {
  await check("refreshToken").isString().isLength({ min: 10 }).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array() });
  }
  // Use given refreshToken to get new shortlived
  const { refreshToken } = req.body;
  let decoded;

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    (err, decodedJWT) => {
      if (err) {
        console.log("cannot verify");
        return res
          .status(400)
          .send({ error: "Refresh token cannot be verified" });
      }
      decoded = decodedJWT;
    }
  );

  const result =
    await sql`SELECT expires_at FROM refresh_tokens WHERE token=${refreshToken}`;
  if (result.length < 1) {
    console.log("not in db");
    return res.status(400).send({ error: "Refresh token cannot be verified" });
  }
  // Check if expired
  const tokenFromDb = result[0];
  if (tokenFromDb.expires_at < Date.now()) {
    console.log("expired");
    return res.status(400).send({ error: "Refresh token cannot be verified" });
  }
  // REFRESH TOKEN VALID
  // Delete old refresh token from DB
  await sql`DELETE FROM refresh_tokens WHERE token=${refreshToken}`;

  // Create new short-lived JWT
  const jwtForUser = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      user: {
        id: decoded.userId,
      },
    },
    process.env.JWT_SECRET
  );

  // Create new refresh token
  const newRefreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const newRefreshToken = jwt.sign(
    {
      userId: decoded.userId,
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  // Save new refresh token
  await sql`INSERT INTO refresh_tokens(token, expires_at) VALUES(${newRefreshToken}, ${newRefreshExpiresAt})`;

  res.send({ jwt: jwtForUser, refreshToken: newRefreshToken });
};

exports.register = async (req, res) => {
  try {
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

    await sql`INSERT INTO users(name, password, email, phone) VALUES(${username}, ${hashedPassword}, ${email}, ${phone})`;
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Cannot register at the moment" });
  }
};

exports.logout = async (req, res) => {
  await check("refreshToken").isString().isLength({ min: 10 }).run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array() });
  }

  const { refreshToken } = req.body;
  // Remove from db
  await sql`DELETE FROM refresh_tokens WHERE token=${refreshToken}`;
  res.send({ success: true });
};
