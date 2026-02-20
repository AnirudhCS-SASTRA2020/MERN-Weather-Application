const dotenv = require('dotenv');

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  cookieName: process.env.COOKIE_NAME || 'wm_auth',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = { env };
