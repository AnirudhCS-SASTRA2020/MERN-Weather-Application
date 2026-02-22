const express = require('express');

const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { revokeSession, revokeAllSessionsForUser } = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.post('/sessions/revoke', revokeSession);
router.post('/users/revoke-sessions', revokeAllSessionsForUser);

module.exports = { adminRoutes: router };
