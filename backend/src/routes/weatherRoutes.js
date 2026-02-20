const express = require('express');
const { publicDefault, cityForecast } = require('../controllers/weatherController');
const { requireAuth } = require('../middleware/authMiddleware');
const { regionToday, countryToday } = require('../controllers/aggregateController');

const router = express.Router();

router.get('/public/default', publicDefault);
router.get('/city', requireAuth, cityForecast);
router.get('/region', requireAuth, regionToday);
router.get('/country', requireAuth, countryToday);

module.exports = { weatherRoutes: router };
