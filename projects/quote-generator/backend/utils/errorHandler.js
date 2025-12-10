/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;

  // Log error for debugging
  console.error('Error occurred:');
  console.error('Status:', statusCode);
  console.error('Message:', message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Determine error type and adjust response
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};
