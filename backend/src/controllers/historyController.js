const { z } = require('zod');
const { getForecastForCity } = require('../services/weatherService');
const { getSnapshots, ensureTodaySnapshot } = require('../services/snapshotService');

const monthlySchema = z.object({
  query: z.string().min(1).max(120),
  months: z.coerce.number().int().min(1).max(4).default(1),
});

async function monthly(req, res, next) {
  try {
    const { query, months } = monthlySchema.parse(req.query);
    const forecast = await getForecastForCity(query);

    await ensureTodaySnapshot({ userId: req.user.sub, forecast });

    const lat = forecast.location.latitude;
    const lon = forecast.location.longitude;

    const snapshots = await getSnapshots({
      userId: req.user.sub,
      latitude: lat,
      longitude: lon,
      months,
    });

    res.json({
      location: forecast.location,
      months,
      snapshots,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { monthly };
