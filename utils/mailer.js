const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendConfirmationEmail = (to, token) => {
  const confirmUrl = `http://localhost:3000/api/confirm-mail?token=${token}`;
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Delihood: Confirm your email",
    html: `<h2>Welcome!</h2><p>Please <a href="${confirmUrl}">confirm your email</a></p>`,
  });
};
