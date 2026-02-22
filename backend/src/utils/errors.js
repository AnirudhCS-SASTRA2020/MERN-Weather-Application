const { ZodError } = require('zod');

class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'SERVER_ERROR', details = undefined } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function isZodError(err) {
  return err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues);
}

function zodToDetails(err) {
  const issues = err?.issues || [];
  return issues.map((i) => ({
    path: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''),
    message: i.message,
  }));
}

module.exports = { AppError, isZodError, zodToDetails };
