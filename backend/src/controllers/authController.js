const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const { env } = require('../config/env');
const { User } = require('../models/User');
const { Session } = require('../models/Session');
const {
  registerSchema,
  loginSchema,
  verifyEmailConfirmSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../utils/validators');
const { AppError } = require('../utils/errors');
const {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../services/tokenService');
const { issueCsrfToken } = require('../middleware/csrfMiddleware');
const { sendVerifyEmail, sendPasswordResetEmail } = require('../services/emailService');

function deriveUsername({ name, email, googleId }) {
  const trimmedName = String(name || '').trim();
  if (trimmedName.length >= 2) return trimmedName;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const localPart = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0].trim() : '';
  if (localPart.length >= 2) return localPart;

  const suffix = String(googleId || '').slice(-6) || randomToken(3);
  return `user_${suffix}`;
}

function refreshCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30d (matches default)
  };
}

function oauthStateCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth/google/callback',
    maxAge: 1000 * 60 * 10,
  };
}

function clearRefreshCookie(res) {
  res.clearCookie(env.refreshCookieName, { path: '/api/auth/refresh' });
}

function userJson(u) {
  return {
    id: String(u._id),
    username: u.username,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    emailVerified: !!u.emailVerified,
  };
}

async function createSessionAndTokens({ user, req, res }) {
  const sessionId = crypto.randomUUID();

  const refreshToken = signRefreshToken({ userId: user._id, sessionId });
  const refreshTokenHash = hashToken(refreshToken);
  const decoded = require('jsonwebtoken').decode(refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await Session.create({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    createdIp: req.ip || '',
    createdUserAgent: req.get('user-agent') || '',
    expiresAt,
    lastUsedAt: new Date(),
  });

  res.cookie(env.refreshCookieName, refreshToken, refreshCookieOptions());

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    sessionId,
    emailVerified: user.emailVerified,
  });

  return { accessToken, sessionId };
}

async function register(req, res, next) {
  try {
    const { username, email, phone, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError('Email already registered', { statusCode: 409, code: 'EMAIL_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: 'user',
      emailVerified: false,
    });

    // Issue verification token
    const verifyToken = randomToken(24);
    user.emailVerifyTokenHash = hashToken(verifyToken);
    user.emailVerifyExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();
    await sendVerifyEmail({ to: user.email, token: verifyToken });

    const { accessToken } = await createSessionAndTokens({ user, req, res });
    res.status(201).json({ user: userJson(user), accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError('Invalid credentials', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    const { accessToken } = await createSessionAndTokens({ user, req, res });
    res.json({ user: userJson(user), accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.[env.refreshCookieName];
    if (!raw) {
      throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });
    }

    const payload = verifyRefreshToken(raw);
    const userId = payload?.sub;
    const sessionId = payload?.sid;
    if (!userId || !sessionId) {
      throw new AppError('Invalid refresh token', { statusCode: 401, code: 'TOKEN_INVALID' });
    }

    const session = await Session.findOne({ userId, sessionId });
    if (!session || session.revokedAt) {
      throw new AppError('Session revoked', { statusCode: 401, code: 'SESSION_REVOKED' });
    }

    const incomingHash = hashToken(raw);
    if (incomingHash !== session.refreshTokenHash) {
      session.revokedAt = new Date();
      session.revokedReason = 'refresh_reuse_detected';
      await session.save();
      throw new AppError('Session revoked', { statusCode: 401, code: 'SESSION_REVOKED' });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });
    }

    // Rotate refresh token
    const newRefresh = signRefreshToken({ userId: user._id, sessionId: session.sessionId });
    session.refreshTokenHash = hashToken(newRefresh);
    session.lastUsedAt = new Date();
    const decoded = require('jsonwebtoken').decode(newRefresh);
    session.expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : session.expiresAt;
    await session.save();
    res.cookie(env.refreshCookieName, newRefresh, refreshCookieOptions());

    const accessToken = signAccessToken({
      userId: user._id,
      role: user.role,
      sessionId: session.sessionId,
      emailVerified: user.emailVerified,
    });

    res.json({ user: userJson(user), accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const userId = req.user?.sub;
    const sessionId = req.user?.sid;
    if (!userId || !sessionId) {
      clearRefreshCookie(res);
      return res.json({ message: 'Logged out' });
    }

    await Session.updateOne(
      { userId, sessionId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'logout' } }
    );
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });

    await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: 'logout_all' } });
    clearRefreshCookie(res);
    res.json({ message: 'Logged out (all sessions)' });
  } catch (err) {
    next(err);
  }
}

function csrf(req, res) {
  const token = issueCsrfToken(res);
  res.json({ csrfToken: token });
}

async function me(req, res) {
  const u = req.userDoc;
  res.json({ user: userJson(u) });
}

async function verifyEmailRequest(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) throw new AppError('Not authenticated', { statusCode: 401, code: 'NOT_AUTHENTICATED' });

    const verifyToken = randomToken(24);
    user.emailVerifyTokenHash = hashToken(verifyToken);
    user.emailVerifyExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();
    await sendVerifyEmail({ to: user.email, token: verifyToken });

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}

async function verifyEmailConfirm(req, res, next) {
  try {
    const { token } = verifyEmailConfirmSchema.parse(req.body);
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', { statusCode: 400, code: 'TOKEN_INVALID' });
    }

    user.emailVerified = true;
    user.emailVerifyTokenHash = '';
    user.emailVerifyExpiresAt = null;
    await user.save();

    res.json({ message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always 200 to avoid account enumeration.
    if (!user) return res.json({ message: 'If the account exists, an email was sent' });

    const token = randomToken(24);
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();
    await sendPasswordResetEmail({ to: user.email, token });

    res.json({ message: 'If the account exists, an email was sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', { statusCode: 400, code: 'TOKEN_INVALID' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = null;
    await user.save();

    await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: 'password_reset' } });

    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

function buildGoogleClient() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new AppError('Google OAuth is not configured', { statusCode: 500, code: 'OAUTH_NOT_CONFIGURED' });
  }
  return new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
}

function googleStart(req, res, next) {
  try {
    const client = buildGoogleClient();
    const state = randomToken(12);
    res.cookie(env.oauthStateCookieName, state, oauthStateCookieOptions());

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
      state,
    });
    res.redirect(url);
  } catch (err) {
    next(err);
  }
}

async function googleCallback(req, res, next) {
  try {
    const { code, state } = req.query;
    const expectedState = req.cookies?.[env.oauthStateCookieName];
    res.clearCookie(env.oauthStateCookieName, { path: '/api/auth/google/callback' });

    if (!code || !state || !expectedState || String(state) !== String(expectedState)) {
      throw new AppError('Invalid OAuth state', { statusCode: 400, code: 'OAUTH_STATE_INVALID' });
    }

    const client = buildGoogleClient();
    const { tokens } = await client.getToken(String(code));
    const idToken = tokens?.id_token;
    if (!idToken) throw new AppError('OAuth failed', { statusCode: 400, code: 'OAUTH_FAILED' });

    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;
    const name = payload?.name || '';
    if (!email || !googleId) throw new AppError('OAuth failed', { statusCode: 400, code: 'OAUTH_FAILED' });

    const normalizedEmail = String(email).toLowerCase();
    const derivedUsername = deriveUsername({ name, email: normalizedEmail, googleId });

    // Auto-link by email.
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new AppError('OAuth account conflict', { statusCode: 409, code: 'OAUTH_ACCOUNT_CONFLICT' });
      }
      user.googleId = googleId;
      user.emailVerified = true;
      if (!user.username || String(user.username).trim().length < 2) {
        user.username = derivedUsername;
      }
      await user.save();
    } else {
      const username = derivedUsername;
      user = await User.create({
        username,
        email: normalizedEmail,
        phone: '',
        passwordHash: '',
        role: 'user',
        emailVerified: true,
        googleId,
      });
    }

    await createSessionAndTokens({ user, req, res });

    // No tokens in URL; frontend will call /api/auth/refresh.
    res.redirect(`${env.frontendBaseUrl}/oauth/callback`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
