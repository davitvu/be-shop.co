// src/middlewares/errorHandler.js
const createError = require('http-errors');

const notFound = (req, res, next) =>
  next(createError(404, 'Endpoint not found'));

function normalizeKnownErrors(err) {
  // Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    err.status = 409;
    err.code = 'DUPLICATE';
    err.message ||= 'Duplicate value';
    err.details = err.errors?.map(e => ({ path: e.path, message: e.message }));
    err.expose = true;
  }
  if (err.name === 'SequelizeValidationError') {
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    err.message ||= 'Validation failed';
    err.details = err.errors?.map(e => ({ path: e.path, message: e.message }));
    err.expose = true;
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    err.status = 409;
    err.code = 'FK_CONSTRAINT';
    err.message ||= 'Foreign key constraint failed';
    err.expose = true;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    err.status = 401;
    err.code = 'INVALID_TOKEN';
    err.message = 'Invalid token';
    err.expose = true;
  }
  if (err.name === 'TokenExpiredError') {
    err.status = 401;
    err.code = 'TOKEN_EXPIRED';
    err.message = 'Token expired';
    err.expose = true;
  }

  return err;
}

const httpCodeToKey = s => ({
  400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
  409: 'CONFLICT', 422: 'UNPROCESSABLE_ENTITY', 429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR', 503: 'SERVICE_UNAVAILABLE'
}[s] || 'ERROR');

/** Error handler trả JSON (không meta, không check env) */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  normalizeKnownErrors(err);

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || httpCodeToKey(status),
      message: err.expose ? err.message : 'Internal Server Error',
      statusCode: status,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = { notFound, errorHandler }