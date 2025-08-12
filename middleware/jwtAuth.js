const jwt = require("jsonwebtoken");
const sql = require("../db");

exports.loginAuth = async (req, res, next) => {
  // Token in authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No header found");
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1]; // iOS stuff
  console.log(token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // Check if email is verified
    const result = await sql`SELECT * FROM users WHERE id=${decoded.userId}`;
    if (!result[0].isemailconfirmed) {
      console.log("email not verified");
      return res
        .status(403)
        .json({ message: "Email not verified.", email_not_verified: true });
    }

    req.user = result[0]; // Setting user info to global variable
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).send("Invalid or expired token");
  }
};

exports.loginAuthWithoutEmailVer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).send("Invalid or expired token");
  }
};
