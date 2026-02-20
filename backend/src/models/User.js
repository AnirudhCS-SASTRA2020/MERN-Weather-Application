const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
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
