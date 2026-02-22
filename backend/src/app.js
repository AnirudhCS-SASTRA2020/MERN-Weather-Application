const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const { env } = require('./config/env');
const { authRoutes } = require('./routes/authRoutes');
const { historyRoutes } = require('./routes/historyRoutes');
const { weatherRoutes } = require('./routes/weatherRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { requestId } = require('./middleware/requestIdMiddleware');
const { adminRoutes } = require('./routes/adminRoutes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);

  // Structured request logging
  app.use(
    pinoHttp({
      genReqId: (req) => req.requestId,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.remoteAddress,
          };
        },
      },
      redact: {
        paths: ['req.headers.cookie', 'req.headers.authorization'],
        remove: true,
      },
    })
  );

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  // Parse incoming JSON requests
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  // Rate Limiting Middleware
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/weather', weatherRoutes);

  // Error Handling Middleware
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
