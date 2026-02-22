const { AppError } = require('../utils/errors');

function requireVerified(req, _res, next) {
  if (req.user?.role === 'admin') return next();
  if (req.user?.emailVerified) return next();
  return next(new AppError('Email not verified', { statusCode: 403, code: 'EMAIL_NOT_VERIFIED' }));
}

module.exports = { requireVerified };
