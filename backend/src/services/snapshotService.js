const { WeatherSnapshot } = require('../models/WeatherSnapshot');

function toDateUtc(dateString) {
  // dateString is expected 'YYYY-MM-DD'
  return new Date(`${dateString}T00:00:00.000Z`);
}

async function ensureTodaySnapshot({ userId, forecast }) {
  const loc = forecast?.location;
  const daily = forecast?.daily;
  if (!loc?.latitude || !loc?.longitude || !daily?.time?.length) return;

  const dayIndex = 0;
  const dateString = daily.time[dayIndex];
  if (!dateString) return;

  const doc = {
    userId,
    latitude: loc.latitude,
    longitude: loc.longitude,
    city: loc.name,
    country_code: loc.country_code,
    admin1: loc.admin1,
    date: toDateUtc(dateString),
    summary: {
      temp_max_c: daily.temperature_2m_max?.[dayIndex] ?? null,
      temp_min_c: daily.temperature_2m_min?.[dayIndex] ?? null,
      precip_mm: daily.precipitation_sum?.[dayIndex] ?? null,
      wind_max_ms: daily.wind_speed_10m_max?.[dayIndex] ?? null,
    },
    source: forecast?.source || 'open-meteo',
  };

  await WeatherSnapshot.updateOne(
    { userId, latitude: doc.latitude, longitude: doc.longitude, date: doc.date },
    { $setOnInsert: doc },
    { upsert: true }
  );
}

async function getSnapshots({ userId, latitude, longitude, months }) {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMonth(start.getUTCMonth() - months);

  return WeatherSnapshot.find({
    userId,
    latitude,
    longitude,
    date: { $gte: start, $lte: now },
  })
    .sort({ date: 1 })
    .lean();
}

module.exports = { ensureTodaySnapshot, getSnapshots };
