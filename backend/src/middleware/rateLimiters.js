const rateLimit = require('express-rate-limit');

function makeLimiter({ windowMs, max, message, keyGenerator } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: message || 'Too many requests' },
    keyGenerator,
  });
}

const authLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth attempts, try later' });
const refreshLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, max: 60, message: 'Too many refresh requests' });
const emailLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many email requests, try later' });

module.exports = {
  authLimiter,
  refreshLimiter,
  emailLimiter,
};
