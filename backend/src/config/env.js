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
  // Back-compat: existing JWT_SECRET is reused if new secrets aren't provided.
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  accessJwtSecret: process.env.ACCESS_JWT_SECRET || required('JWT_SECRET'),
  refreshJwtSecret: process.env.REFRESH_JWT_SECRET || required('JWT_SECRET'),
  accessJwtExpiresIn: process.env.ACCESS_JWT_EXPIRES_IN || '15m',
  refreshJwtExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '30d',

  // Cookies
  cookieName: process.env.COOKIE_NAME || 'wm_auth', // legacy cookie name (pre-refresh)
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'wm_refresh',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'wm_csrf',
  oauthStateCookieName: process.env.OAUTH_STATE_COOKIE_NAME || 'wm_oauth_state',

  // Frontend base URL (for email links + OAuth redirects)
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',

  // SMTP2GO
  smtp2goHost: process.env.SMTP2GO_HOST || '',
  smtp2goPort: Number(process.env.SMTP2GO_PORT || 2525),
  smtp2goUser: process.env.SMTP2GO_USER || '',
  smtp2goPass: process.env.SMTP2GO_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || '',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = { env };
