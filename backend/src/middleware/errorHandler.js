const logger = require('../utils/logger');

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds the allowed limit (10MB)' });
  }
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Supabase / database errors
  if (err.code && err.code.startsWith('PG')) {
    return res.status(500).json({ error: 'Database error occurred' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred'
    : err.message || 'An error occurred';

  res.status(statusCode).json({ error: message });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFoundHandler };
