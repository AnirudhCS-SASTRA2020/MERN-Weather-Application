const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    res.status(401);
    return next(new Error('Invalid or expired token'));
  }
}

module.exports = { requireAuth };
