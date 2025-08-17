const { check, validationResult } = require("express-validator");

const sql = require("../db");

module.exports.changeAcc = async (req, res) => {
  switch (req.params.changeParam) {
    case "name":
      await check("newValue").isString().trim().run(req);
      const nameErrors = validationResult(req);
      if (!nameErrors.isEmpty())
        return res.status(400).send({ error: nameErrors.array() });

      await sql`UPDATE users SET name=${req.body.newValue} WHERE id=${req.user.id}`;
      res.send({ success: true });
      break;

    case "email":
      await check("newValue").isEmail().normalizeEmail().run(req);
      const emailErrors = validationResult(req);
      if (!emailErrors.isEmpty())
        return res.status(400).send({ error: emailErrors.array() });

      await sql`UPDATE users SET email=${req.body.newValue} WHERE id=${req.user.id}`;
      res.send({ success: true });
      break;

    case "phone":
      await check("newValue").isMobilePhone().trim().run(req);
      const phoneErrors = validationResult(req);
      if (!phoneErrors.isEmpty())
        return res.status(400).send({ error: phoneErrors.array() });

      const phone = req.body.newValue.replace(/\s+/g, "");
      await sql`UPDATE users SET phone=${phone} WHERE id=${req.user.id}`;
      res.send({ success: true });
      break;

    default:
      res.status(400).send({ error: "Invalid changeParam" });
  }
};
