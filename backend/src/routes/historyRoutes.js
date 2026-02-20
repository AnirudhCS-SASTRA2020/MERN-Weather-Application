const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { monthly } = require('../controllers/historyController');

const router = express.Router();

router.get('/monthly', requireAuth, monthly);

module.exports = { historyRoutes: router };
