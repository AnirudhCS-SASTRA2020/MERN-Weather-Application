function notFound(req, res, next) {
  res.status(404);
  res.json({ message: 'Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusFromRes = res.statusCode && res.statusCode !== 200 ? res.statusCode : 0;
  const statusFromErr = Number(err?.statusCode || err?.status || 0);
  const status = statusFromRes || statusFromErr || 500;
  res.status(status);
  res.json({
    message: err?.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err?.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
