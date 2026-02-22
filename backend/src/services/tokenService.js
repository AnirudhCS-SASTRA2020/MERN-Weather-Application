const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/errors');

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function signAccessToken({ userId, role, sessionId, emailVerified }) {
  return jwt.sign(
    { sub: String(userId), role, sid: String(sessionId), emailVerified: !!emailVerified },
    env.accessJwtSecret,
    { expiresIn: env.accessJwtExpiresIn }
  );
}

function signRefreshToken({ userId, sessionId }) {
  return jwt.sign({ sub: String(userId), sid: String(sessionId) }, env.refreshJwtSecret, {
    expiresIn: env.refreshJwtExpiresIn,
  });
}

function verifyJwt({ token, secret, kind }) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    const msg = err?.name === 'TokenExpiredError' ? `${kind} token expired` : `Invalid ${kind} token`;
    const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    throw new AppError(msg, { statusCode: 401, code });
  }
}

function verifyAccessToken(token) {
  return verifyJwt({ token, secret: env.accessJwtSecret, kind: 'access' });
}

function verifyRefreshToken(token) {
  return verifyJwt({ token, secret: env.refreshJwtSecret, kind: 'refresh' });
}

module.exports = {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
