const logger = require('../utils/logger');

/**
 * Standard API Error Handler
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Log the error
  logger.error(`${req.method} ${req.url} - ${statusCode} - ${message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    user: req.user ? req.user.id : 'anonymous'
  });

  res.status(statusCode).json({
    success: false,
    message,
    code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Custom Error Class
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = {
  errorHandler,
  ApiError
};
