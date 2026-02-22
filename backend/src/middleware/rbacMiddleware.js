const { AppError } = require('../utils/errors');

function requireRole(role) {
  return (req, _res, next) => {
    const actual = req.user?.role;
    if (actual !== role) {
      return next(new AppError('Forbidden', { statusCode: 403, code: 'FORBIDDEN' }));
    }
    return next();
  };
}

module.exports = { requireRole };
