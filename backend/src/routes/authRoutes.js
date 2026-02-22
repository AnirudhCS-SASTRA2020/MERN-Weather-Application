const express = require('express');
const {
	register,
	login,
	refresh,
	logout,
	logoutAll,
	me,
	csrf,
	verifyEmailRequest,
	verifyEmailConfirm,
	forgotPassword,
	resetPassword,
	googleStart,
	googleCallback,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireCsrf } = require('../middleware/csrfMiddleware');
const { authLimiter, refreshLimiter, emailLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/csrf', csrf);

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.post('/refresh', refreshLimiter, requireCsrf, refresh);

router.post('/logout', requireAuth, requireCsrf, logout);
router.post('/logout-all', requireAuth, requireCsrf, logoutAll);

router.get('/me', requireAuth, me);

router.post('/verify-email/request', requireAuth, emailLimiter, verifyEmailRequest);
router.post('/verify-email/confirm', emailLimiter, verifyEmailConfirm);

router.post('/password/forgot', emailLimiter, forgotPassword);
router.post('/password/reset', resetPassword);

router.get('/google', googleStart);
router.get('/google/callback', googleCallback);

module.exports = { authRoutes: router };
