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
    //Email confirmation for new accont
    case 1:
      subject = "Delihood: Confirm your email";
      confirmUrl = `http://localhost:8080/confirmations/confirm-mail?token=${token}`;
      // Import html from file
      const confirmemailHtml = fs.readFileSync(
        path.join(__dirname, "..", "html", "confirm_mail.html"),
        "utf8"
      );
      // Replace placeholders
      html = confirmemailHtml.replace("{{confirmUrl}}", confirmUrl);

      break;
    //Forgotten password
    case 2:
      subject = "Delihood: Forgotten password link";
      confirmUrl = `http://localhost:8080/auth/new-password?token=${token}`;
      // Import from file
      const emailHtml = fs.readFileSync(
        path.join(__dirname, "..", "html", "confirm_mail.html"),
        "utf8"
      );
      // Replace placeholders
      html = emailHtml.replace("{{confirmUrl}}", confirmUrl);
  }
  // Send mail
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
