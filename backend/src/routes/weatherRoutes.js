const express = require('express');
const { publicDefault, publicCity, cityForecast } = require('../controllers/weatherController');
const { requireAuth } = require('../middleware/authMiddleware');
const { regionToday, countryToday } = require('../controllers/aggregateController');
const { requireVerified } = require('../middleware/verificationMiddleware');


const router = express.Router();

router.get('/public/default', publicDefault);
router.get('/public/city', publicCity);
router.get('/city', requireAuth, requireVerified, cityForecast);
router.get('/region', requireAuth, requireVerified, regionToday);
router.get('/country', requireAuth, requireVerified, countryToday);

module.exports = { weatherRoutes: router };
