const { z } = require('zod');
const { Session } = require('../models/Session');
const { User } = require('../models/User');
const { AppError } = require('../utils/errors');

const revokeBySessionSchema = z.object({
  userId: z.string().min(10).max(64),
  sessionId: z.string().min(8).max(200),
  reason: z.string().min(1).max(200).optional(),
});

const revokeByUserSchema = z.object({
  userId: z.string().min(10).max(64),
  reason: z.string().min(1).max(200).optional(),
});

async function revokeSession(req, res, next) {
  try {
    const { userId, sessionId, reason } = revokeBySessionSchema.parse(req.body);

    const exists = await User.exists({ _id: userId });
    if (!exists) throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

    const result = await Session.updateOne(
      { userId, sessionId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: reason || 'admin_revoke_session' } }
    );

    if (result.matchedCount === 0) {
      throw new AppError('Session not found', { statusCode: 404, code: 'SESSION_NOT_FOUND' });
    }

    res.json({ message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
}

async function revokeAllSessionsForUser(req, res, next) {
  try {
    const { userId, reason } = revokeByUserSchema.parse(req.body);

    const exists = await User.exists({ _id: userId });
    if (!exists) throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

    await Session.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: reason || 'admin_revoke_all_sessions' } }
    );

    res.json({ message: 'User sessions revoked' });
  } catch (err) {
    next(err);
  }
}

module.exports = { revokeSession, revokeAllSessionsForUser };
