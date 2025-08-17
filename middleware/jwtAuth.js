const jwt = require("jsonwebtoken");
const sql = require("../db");

exports.loginAuth = async (req, res, next) => {
  // Token in authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1]; // iOS stuff
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check if email is verified
    const result = await sql`SELECT * FROM users WHERE id=${decoded.userId}`;
    if (!result[0].isemailconfirmed) {
      return res
        .status(403)
        .json({ error: "Email not verified.", email_not_verified: true });
    }

    req.user = result[0]; // Setting user info to global variable
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).send({ error: "Invalid or expired token" });
  }
};

exports.loginAuthWithoutEmailVer = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Not authenticated" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await sql`SELECT * FROM users WHERE id=${decoded.userId}`;
    req.user = result[0];
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).send({ error: "Invalid or expired token" });
  }
};
