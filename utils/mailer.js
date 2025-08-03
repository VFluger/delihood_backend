const nodemailer = require("nodemailer");

const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendConfirmationEmail = (to, token, reason) => {
  let subject;
  let html;
  let confirmUrl;
  switch (reason) {
    case 1:
      //Email confirmation for new accont
      subject = "Delihood: Confirm your email";
      confirmUrl = `http://localhost:8080/confirmations/confirm-mail?token=${token}`;
      const confirmemailHtml = fs.readFileSync(
        path.join(__dirname, "..", "html", "confirm_mail.html"),
        "utf8"
      );
      html = confirmemailHtml.replace("{{confirmUrl}}", confirmUrl);

      break;
    case 2:
      //Forgotten password
      subject = "Delihood: Forgotten password link";
      confirmUrl = `http://localhost:8080/auth/new-password?token=${token}`;
      const emailHtml = fs.readFileSync(
        path.join(__dirname, "..", "html", "confirm_mail.html"),
        "utf8"
      );
      html = emailHtml.replace("{{confirmUrl}}", confirmUrl);
  }
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
