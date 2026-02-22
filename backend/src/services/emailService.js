const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { AppError } = require('../utils/errors');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp2goHost || !env.smtp2goUser || !env.smtp2goPass || !env.smtpFrom) {
    throw new AppError('Email is not configured (SMTP2GO env vars missing)', {
      statusCode: 500,
      code: 'EMAIL_NOT_CONFIGURED',
    });
  }

  transporter = nodemailer.createTransport({
    host: env.smtp2goHost,
    port: env.smtp2goPort,
    secure: false,
    auth: {
      user: env.smtp2goUser,
      pass: env.smtp2goPass,
    },
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  await tx.sendMail({ from: env.smtpFrom, to, subject, text, html });
}

async function sendVerifyEmail({ to, token }) {
  const url = `${env.frontendBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your email';
  const text = `Verify your email by opening this link: ${url}`;
  const html = `<p>Verify your email:</p><p><a href="${url}">${url}</a></p>`;
  return sendMail({ to, subject, text, html });
}

async function sendPasswordResetEmail({ to, token }) {
  const url = `${env.frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your password';
  const text = `Reset your password using this link: ${url}`;
  const html = `<p>Reset your password:</p><p><a href="${url}">${url}</a></p>`;
  return sendMail({ to, subject, text, html });
}

module.exports = {
  sendVerifyEmail,
  sendPasswordResetEmail,
};
