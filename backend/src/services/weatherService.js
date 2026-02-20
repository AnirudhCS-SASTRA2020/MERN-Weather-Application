const NodeCache = require('node-cache');
const { geocodeCity, forecastByCoords, currentByCoords } = require('./openMeteo');

const cache = new NodeCache({ stdTTL: 60 * 5, checkperiod: 60 }); // 5 minutes

function normalizeForecast(raw, location) {
  return {
    location,
    timezone: raw?.timezone,
    timezone_abbreviation: raw?.timezone_abbreviation,
    current: raw?.current || null,
    hourly: raw?.hourly || null,
    daily: raw?.daily || null,
    units: {
      current_units: raw?.current_units || null,
      hourly_units: raw?.hourly_units || null,
      daily_units: raw?.daily_units || null,
    },
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeCurrent(raw, location) {
  return {
    location,
    timezone: raw?.timezone,
    timezone_abbreviation: raw?.timezone_abbreviation,
    current: raw?.current || null,
    units: {
      current_units: raw?.current_units || null,
    },
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}

async function getForecastForCity(query) {
  const geoKey = `geo:${query.toLowerCase()}`;
  const cachedGeo = cache.get(geoKey);
  const geoResults = cachedGeo || (await geocodeCity(query));
  if (!cachedGeo) cache.set(geoKey, geoResults, 60 * 60);

  const best = geoResults?.[0];
  if (!best) {
    const err = new Error('City not found');
    err.statusCode = 404;
    throw err;
  }

  const location = {
    name: best.name,
    latitude: best.latitude,
    longitude: best.longitude,
    country: best.country,
    country_code: best.country_code,
    admin1: best.admin1,
  };

  const fcKey = `fc:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
  const cached = cache.get(fcKey);
  const raw = cached || (await forecastByCoords({ lat: location.latitude, lon: location.longitude }));
  if (!cached) cache.set(fcKey, raw);

  return normalizeForecast(raw, location);
}

async function getForecastForCoords({ latitude, longitude, name = 'Selected location' }) {
  const location = { name, latitude, longitude };
  const fcKey = `fc:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = cache.get(fcKey);
  const raw = cached || (await forecastByCoords({ lat: latitude, lon: longitude }));
  if (!cached) cache.set(fcKey, raw);
  return normalizeForecast(raw, location);
}

async function getCurrentForCoords({ latitude, longitude, name = 'Selected location', country_code, country, admin1 }) {
  const location = { name, latitude, longitude, country_code, country, admin1 };
  const key = `cur:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = cache.get(key);
  const raw = cached || (await currentByCoords({ lat: latitude, lon: longitude }));
  if (!cached) cache.set(key, raw, 60 * 2);
  return normalizeCurrent(raw, location);
}

module.exports = { getForecastForCity, getForecastForCoords, getCurrentForCoords };
