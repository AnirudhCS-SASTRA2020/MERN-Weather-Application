const { Session } = require('../models/Session');
const { User } = require('../models/User');
const { verifyAccessToken } = require('../services/tokenService');
const { AppError } = require('../utils/errors');

function parseBearer(req) {
  const header = req.get('authorization') || '';
  const [kind, token] = header.split(' ');
  if (kind !== 'Bearer' || !token) return '';
  return token.trim();
}

async function requireAuth(req, _res, next) {
  try {
    const token = parseBearer(req);
    if (!token) {
      throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });
    }

    const payload = verifyAccessToken(token);
    const userId = payload?.sub;
    const sessionId = payload?.sid;
    if (!userId || !sessionId) {
      throw new AppError('Invalid access token', { statusCode: 401, code: 'TOKEN_INVALID' });
    }

    const session = await Session.findOne({ sessionId: String(sessionId), userId }).lean();
    if (!session || session.revokedAt) {
      throw new AppError('Session revoked', { statusCode: 401, code: 'SESSION_REVOKED' });
    }

    const user = await User.findById(userId).select('username email phone role emailVerified').lean();
    if (!user) {
      throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });
    }

    req.user = {
      sub: String(user._id),
      sid: String(sessionId),
      role: user.role,
      emailVerified: !!user.emailVerified,
      email: user.email,
    };
    req.userDoc = user;
    req.session = session;

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
