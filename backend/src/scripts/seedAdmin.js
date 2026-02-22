const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const { connectDb } = require('../config/db');
const { User } = require('../models/User');

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const mongodbUri = required('MONGODB_URI');
  const email = required('ADMIN_EMAIL').toLowerCase();
  const password = required('ADMIN_PASSWORD');
  const username = (process.env.ADMIN_USERNAME || 'Admin').trim();
  const phone = (process.env.ADMIN_PHONE || '').trim();

  await connectDb(mongodbUri);

  const passwordHash = await bcrypt.hash(password, 10);

  const update = {
    username,
    email,
    phone,
    passwordHash,
    role: 'admin',
    emailVerified: true,
    googleId: '',
  };

  const user = await User.findOneAndUpdate({ email }, { $set: update }, { new: true, upsert: true });

  // eslint-disable-next-line no-console
  console.log(`Admin ready: ${user.email} (${user._id})`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
