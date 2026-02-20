const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { authRoutes } = require('./routes/authRoutes');
const { historyRoutes } = require('./routes/historyRoutes');
const { weatherRoutes } = require('./routes/weatherRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/weather', weatherRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
