const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || err.response?.status || 500;
  const providerError = err.response?.data;
  const message = err.message || 'Internal server error';

  logger.error(`${req.method} ${req.originalUrl}`, message, providerError || err.details || '');

  res.status(status).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(providerError && { providerError })
  });
};
