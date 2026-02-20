const mongoose = require('mongoose');

const weatherSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    city: { type: String, required: true },
    country_code: { type: String },
    admin1: { type: String },
    date: { type: Date, required: true, index: true },
    summary: {
      temp_max_c: { type: Number },
      temp_min_c: { type: Number },
      precip_mm: { type: Number },
      wind_max_ms: { type: Number },
    },
    source: { type: String, default: 'open-meteo' },
  },
  { timestamps: true }
);

weatherSnapshotSchema.index({ userId: 1, latitude: 1, longitude: 1, date: 1 }, { unique: true });

const WeatherSnapshot = mongoose.model('WeatherSnapshot', weatherSnapshotSchema);

module.exports = { WeatherSnapshot };
