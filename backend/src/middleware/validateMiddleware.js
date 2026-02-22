const { isZodError, zodToDetails, AppError } = require('../utils/errors');

function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      return next();
    } catch (err) {
      if (isZodError(err)) {
        return next(new AppError('Validation error', { statusCode: 400, code: 'VALIDATION_ERROR', details: zodToDetails(err) }));
      }
      return next(err);
    }
  };
}

module.exports = { validate };
