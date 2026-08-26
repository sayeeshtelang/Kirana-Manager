const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST) {
    // In dev without SMTP configured, don't crash the request flow -
    // log instead so password reset / invite links are still visible.
    console.log(`[email disabled] To: ${to} | Subject: ${subject}\n${text || html}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
    text,
  });
}

module.exports = sendEmail;
