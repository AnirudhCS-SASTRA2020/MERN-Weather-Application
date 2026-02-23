const { AppError, isZodError, zodToDetails } = require('../utils/errors');

function notFound(req, res, next) {
  res.status(404);
  res.json({
    requestId: req.requestId,
    code: 'NOT_FOUND',
    message: 'Not Found',
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  try {
    if (req?.log?.error) {
      const meta = err instanceof AppError ? { code: err.code, statusCode: err.statusCode, details: err.details } : undefined;
      req.log.error({ err, ...(meta ? { appError: meta } : {}) }, 'request failed');
    }
  } catch {
    // ignore logging failures
  }

  const statusFromRes = res.statusCode && res.statusCode !== 200 ? res.statusCode : 0;
  const statusFromErr = Number(err?.statusCode || err?.status || 0);
  const status = statusFromRes || statusFromErr || (err instanceof AppError ? err.statusCode : 0) || 500;
  res.status(status);

  if (isZodError(err)) {
    return res.json({
      requestId: req.requestId,
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      details: zodToDetails(err),
      ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {}),
    });
  }

  if (err?.name === 'ValidationError' && err?.errors) {
    const details = Object.entries(err.errors).map(([path, e]) => ({
      path,
      message: e?.message || 'Invalid value',
    }));
    return res.status(400).json({
      requestId: req.requestId,
      code: 'MONGOOSE_VALIDATION_ERROR',
      message: 'Validation error',
      details,
      ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {}),
    });
  }

  const code = err instanceof AppError ? err.code : 'SERVER_ERROR';
  const details = err instanceof AppError ? err.details : undefined;
  res.json({
    requestId: req.requestId,
    code,
    message: err?.message || 'Server error',
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
