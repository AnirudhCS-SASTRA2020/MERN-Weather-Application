const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    passwordHash: { type: String, default: '' },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    emailVerified: { type: Boolean, default: false, index: true },

    googleId: { type: String, default: '', index: true },

    emailVerifyTokenHash: { type: String, default: '' },
    emailVerifyExpiresAt: { type: Date, default: null },

    passwordResetTokenHash: { type: String, default: '' },
    passwordResetExpiresAt: { type: Date, default: null },

    preferences: {
      defaultCity: { type: String, default: 'New York' },
      defaultLat: { type: Number, default: 40.7128 },
      defaultLon: { type: Number, default: -74.006 },
      defaultPollingMinutes: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = { User };
