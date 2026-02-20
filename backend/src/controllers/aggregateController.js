const { cityQuerySchema } = require('../utils/validators');
const allCities = require('all-the-cities');
const { getForecastForCity, getCurrentForCoords } = require('../services/weatherService');

let citiesByCountry = null;

function getCitiesByCountry() {
  if (citiesByCountry) return citiesByCountry;

  citiesByCountry = new Map();
  for (const city of allCities) {
    if (!city?.country) continue;
    const cc = String(city.country).toUpperCase();
    const list = citiesByCountry.get(cc);
    if (list) list.push(city);
    else citiesByCountry.set(cc, [city]);
  }
  return citiesByCountry;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickTopUniqueByPopulation(items, count) {
  const seen = new Set();
  const sorted = items
    .filter((c) => c && c.loc && Array.isArray(c.loc.coordinates) && c.loc.coordinates.length === 2)
    .filter((c) => (c.featureCode ? String(c.featureCode).startsWith('PPL') : true))
    .sort((a, b) => (b.population || 0) - (a.population || 0));

  const out = [];
  for (const c of sorted) {
    const key = `${c.name}|${c.adminCode || ''}|${c.loc.coordinates[0]}|${c.loc.coordinates[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= count) break;
  }

  return out;
}

function mapWithConcurrency(items, limit, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  return Promise.all(workers).then(() => results);
}

async function regionToday(req, res, next) {
  try {
    const { query } = cityQuerySchema.parse(req.query);
    const base = await getForecastForCity(query);

    const cc = base.location.country_code;
    const admin1 = base.location.admin1;

    const baseLat = base.location.latitude;
    const baseLon = base.location.longitude;

    const byCountry = getCitiesByCountry();
    const countryCities = byCountry.get(String(cc || '').toUpperCase()) || [];

    function withinRadius(radiusKm) {
      const nearby = [];
      for (const c of countryCities) {
        if (!c?.loc?.coordinates) continue;
        const [lon, lat] = c.loc.coordinates;
        if (typeof lat !== 'number' || typeof lon !== 'number') continue;
        const d = haversineKm(baseLat, baseLon, lat, lon);
        if (d <= radiusKm) nearby.push(c);
      }
      return nearby;
    }

    let candidates = withinRadius(200);
    if (candidates.length < 8) candidates = withinRadius(400);
    if (candidates.length < 8) candidates = countryCities;

    const top = pickTopUniqueByPopulation(candidates, 8);

    const items = await mapWithConcurrency(top, 4, async (c) => {
      const [lon, lat] = c.loc.coordinates;
      const cur = await getCurrentForCoords({
        name: c.name,
        latitude: lat,
        longitude: lon,
        country_code: cc,
        country: base.location.country,
        admin1,
      });

      return {
        location: cur.location,
        current: cur.current,
        units: cur.units,
      };
    });

    res.json({
      kind: 'region',
      base: base.location,
      scope: { country_code: cc, admin1 },
      cities: items,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function countryToday(req, res, next) {
  try {
    const { query } = cityQuerySchema.parse(req.query);
    const base = await getForecastForCity(query);

    const cc = base.location.country_code;

    const byCountry = getCitiesByCountry();
    const countryCities = byCountry.get(String(cc || '').toUpperCase()) || [];
    const candidates = pickTopUniqueByPopulation(countryCities, 8);

    const items = await mapWithConcurrency(candidates, 4, async (c) => {
      const [lon, lat] = c.loc.coordinates;
      const cur = await getCurrentForCoords({
        name: c.name,
        latitude: lat,
        longitude: lon,
        country_code: cc,
        country: base.location.country,
        admin1: '',
      });

      return {
        location: cur.location,
        current: cur.current,
        units: cur.units,
      };
    });

    res.json({
      kind: 'country',
      base: base.location,
      scope: { country_code: cc },
      cities: items,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { regionToday, countryToday };
