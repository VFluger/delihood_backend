exports.loginAuth = (req, res, next) => {
  if (req.session.user) {
    // Logged in but email not verified
    if (!req.session.user?.isemailconfirmed) {
      return res
        .status(403)
        .json({ message: "Email not verified.", email_not_verified: true });
    }
    return next();
  }
  res.status(401).send("Not authenticated");
};

exports.loginAuthWithoutEmailVer = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).send("Not authenticated");
};
