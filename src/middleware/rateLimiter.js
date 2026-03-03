const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for /api/identify endpoint
 * Prevents abuse by limiting requests per IP address
 * 
 * Production: 100 requests per 15 minutes per IP
 * Development: 1000 requests per 15 minutes per IP
 */
const identifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production, 1000 in dev
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check in development
    if (process.env.NODE_ENV === 'development' && req.path === '/health') {
      return true;
    }
    return false;
  },
});

module.exports = {
  identifyLimiter,
};
