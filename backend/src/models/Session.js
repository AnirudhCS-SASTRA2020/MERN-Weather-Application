const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    sessionId: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true },

    createdIp: { type: String, default: '' },
    createdUserAgent: { type: String, default: '' },

    lastUsedAt: { type: Date, default: null },

    revokedAt: { type: Date, default: null, index: true },
    revokedReason: { type: String, default: '' },

    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL cleanup (MongoDB TTL is not immediate; runs periodically)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = { Session };
