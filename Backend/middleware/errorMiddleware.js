const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Authentication required.', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Access denied.', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found.', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Internal server error.', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code);
  }
}

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
    code = 'INVALID_JSON';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this information already exists.';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist.';
    code = 'INVALID_REFERENCE';
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode}`, {
      message: err.message,
      stack: err.stack,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = { errorHandler, ApiError };
