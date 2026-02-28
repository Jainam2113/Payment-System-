const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    return errorResponse(
      res,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      errors
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(
      res,
      `${field} already exists`,
      HTTP_STATUS.CONFLICT,
      [{ field, message: `This ${field} is already registered` }]
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(
      res,
      'Invalid ID format',
      HTTP_STATUS.BAD_REQUEST,
      [{ field: err.path, message: 'Invalid identifier' }]
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED,
      [{ message: 'Authentication token is invalid' }]
    );
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      'Token expired',
      HTTP_STATUS.UNAUTHORIZED,
      [{ message: 'Authentication token has expired' }]
    );
  }

  // Custom application errors
  if (err.statusCode) {
    return errorResponse(
      res,
      err.message,
      err.statusCode,
      err.errors || []
    );
  }

  // Default server error
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'production' ? [] : [{ message: err.stack }]
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError
};
