const { cityQuerySchema } = require('../utils/validators');
const { getForecastForCity, getForecastForCoords } = require('../services/weatherService');
const { ensureTodaySnapshot } = require('../services/snapshotService');

async function publicDefault(req, res, next) {
  try {
    // NYC default
    const data = await getForecastForCoords({
      latitude: 40.7128,
      longitude: -74.006,
      name: 'New York',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function publicCity(req, res, next) {
  try {
    const { query } = cityQuerySchema.parse(req.query);
    const data = await getForecastForCity(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function cityForecast(req, res, next) {
  try {
    const { query } = cityQuerySchema.parse(req.query);
    const data = await getForecastForCity(query);

    // Store one snapshot/day/location for monthly charts.
    await ensureTodaySnapshot({ userId: req.user.sub, forecast: data });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { publicDefault, publicCity, cityForecast };
