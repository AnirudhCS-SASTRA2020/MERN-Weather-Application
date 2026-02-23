const dotenv = require('dotenv');

const { sendPasswordResetEmail } = require('../services/emailService');

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const to = required('TEST_EMAIL_TO');

  // Sends a password-reset style email so you can confirm SMTP2GO is working.
  await sendPasswordResetEmail({ to, token: 'test-token-do-not-use' });

  // eslint-disable-next-line no-console
  console.log(`Test email sent to ${to}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
