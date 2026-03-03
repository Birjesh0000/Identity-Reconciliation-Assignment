/**
 * Global error handling middleware
 */

const { AppError, ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Async error wrapper - wraps route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * Should be registered LAST in middleware chain
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let error = err;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
  // Handle Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }
  // Handle Mongoose cast error
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // Handle JSON parse error
  else if (err instanceof SyntaxError && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Log error with details
  logger.error(`${err.name || 'Error'}`, {
    message: err.message,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = {
  asyncHandler,
  errorHandler,
};
