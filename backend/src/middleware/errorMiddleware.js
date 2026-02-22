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
