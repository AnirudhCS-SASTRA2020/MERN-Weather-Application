const axios = require('axios');

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';

async function geocodeCity(query) {
  const { data } = await axios.get(GEO_BASE, {
    params: {
      name: query,
      count: 5,
      language: 'en',
      format: 'json',
    },
    timeout: 10000,
  });

  const results = data?.results || [];
  return results;
}

async function forecastByCoords({ lat, lon }) {
  const current = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation',
    'pressure_msl',
    'visibility',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
  ];

  const hourly = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'precipitation',
    'rain',
    'snowfall',
    'cloud_cover',
    'pressure_msl',
    'visibility',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
  ];

  const daily = [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'rain_sum',
    'snowfall_sum',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
  ];

  const { data } = await axios.get(FORECAST_BASE, {
    params: {
      latitude: lat,
      longitude: lon,
      timezone: 'auto',
      wind_speed_unit: 'ms',
      current: current.join(','),
      hourly: hourly.join(','),
      daily: daily.join(','),
    },
    timeout: 10000,
  });

  return data;
}

async function currentByCoords({ lat, lon }) {
  const current = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation',
    'pressure_msl',
    'visibility',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
  ];

  const { data } = await axios.get(FORECAST_BASE, {
    params: {
      latitude: lat,
      longitude: lon,
      timezone: 'auto',
      wind_speed_unit: 'ms',
      current: current.join(','),
    },
    timeout: 10000,
  });

  return data;
}

module.exports = { geocodeCity, forecastByCoords, currentByCoords };
