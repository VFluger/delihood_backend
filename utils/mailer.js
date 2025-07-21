const nodemailer = require("nodemailer");

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
      // TODO: prolly load html from file
      confirmUrl = `http://localhost:8080/api/confirm-mail?token=${token}`;
      html = `<h2>Welcome!</h2><p>Please <a href="${confirmUrl}">confirm your email</a></p>`;

      break;
    case 2:
      //Forgotten password
      subject = "Delihood: Forgotten password link";
      confirmUrl = `http://localhost:8080/api/new-password?token=${token}`;
      html = `<h2>You requested for a new password.</h2><p>Please <a href="${confirmUrl}">confirm your email</a></p>`;
  }
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
