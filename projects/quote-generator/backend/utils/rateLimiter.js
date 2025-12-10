const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for /api/generate endpoint
 * Limits: 5 requests per 15 minutes per IP
 */
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later. (Limit: 5 requests per 15 minutes)'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. You have exceeded the rate limit of 5 requests per 15 minutes. Please try again later.'
    });
  }
});

/**
 * General API rate limiter
 * Limits: 30 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: 'Too many API requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generateLimiter,
  apiLimiter
};
