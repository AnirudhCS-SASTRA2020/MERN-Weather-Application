const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireVerified } = require('../middleware/verificationMiddleware');
const { monthly } = require('../controllers/historyController');

const router = express.Router();

router.get('/monthly', requireAuth, requireVerified, monthly);

module.exports = { historyRoutes: router };
