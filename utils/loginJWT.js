const sql = require("../db");

module.exports.loginJWT = async (res, userId) => {
  // Short JWT lived for user
  const jwtForUser = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
      userId: userId,
    },
    process.env.JWT_SECRET
  );

  // RefreshToken used for getting a new shortlived
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const refreshToken = jwt.sign(
    {
      userId: userId,
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
  // Delete all old refresh tokens
  await sql`DELETE FROM refresh_tokens WHERE user_id=${userId}`;
  // Push to db
  await sql`INSERT INTO refresh_tokens(token, expires_at, user_id) VALUES(${refreshToken}, ${refreshExpiresAt}, ${userId})`;
  res.send({ success: true, accessToken: jwtForUser, refreshToken });
};
