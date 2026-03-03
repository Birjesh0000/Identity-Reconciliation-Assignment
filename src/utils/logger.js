/**
 * Logging utilities
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format log message with timestamp and level
 * @param {String} level - Log level
 * @param {String} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {String} - Formatted log message
 */
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] ${level}: ${message} ${metaStr}`.trim();
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log error
   * @param {String} message - Error message
   * @param {Object} meta - Metadata (error object, context, etc.)
   */
  error: (message, meta = {}) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, meta));
  },

  /**
   * Log warning
   * @param {String} message - Warning message
   * @param {Object} meta - Metadata
   */
  warn: (message, meta = {}) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, meta));
  },

  /**
   * Log info
   * @param {String} message - Info message
   * @param {Object} meta - Metadata
   */
  info: (message, meta = {}) => {
    console.log(formatLog(LOG_LEVELS.INFO, message, meta));
  },

  /**
   * Log debug (only in development)
   * @param {String} message - Debug message
   * @param {Object} meta - Metadata
   */
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, meta));
    }
  },
};

module.exports = {
  logger,
  LOG_LEVELS,
};
