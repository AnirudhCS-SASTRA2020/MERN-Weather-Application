const crypto = require('crypto');
const { env } = require('../config/env');
const { AppError } = require('../utils/errors');

function csrfCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 12, // 12h
  };
}

function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(env.csrfCookieName, token, csrfCookieOptions());
  return token;
}

function requireCsrf(req, _res, next) {
  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('CSRF validation failed', { statusCode: 403, code: 'CSRF_FAILED' }));
  }

  return next();
}

module.exports = { issueCsrfToken, requireCsrf };
