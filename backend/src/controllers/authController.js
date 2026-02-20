const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { env } = require('../config/env');
const { isGmail, registerSchema, loginSchema } = require('../utils/validators');

function buildCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60, // 1 hour
  };
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id), email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register(req, res, next) {
  try {
    const { email, password } = registerSchema.parse(req.body);

    if (!isGmail(email)) {
      res.status(400);
      throw new Error('Only gmail.com accounts are allowed');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409);
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });

    const token = signToken(user);
    res.cookie(env.cookieName, token, buildCookieOptions());

    res.status(201).json({
      user: { id: String(user._id), email: user.email },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const token = signToken(user);
    res.cookie(env.cookieName, token, buildCookieOptions());

    res.json({ user: { id: String(user._id), email: user.email } });
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  res.clearCookie(env.cookieName, { path: '/' });
  res.json({ message: 'Logged out' });
}

function me(req, res) {
  res.json({ user: { id: req.user.sub, email: req.user.email } });
}

module.exports = { register, login, logout, me };
