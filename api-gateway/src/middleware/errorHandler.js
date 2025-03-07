const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.warn(err.stack);

  res.status(err.status).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
