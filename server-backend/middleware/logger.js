const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../log.txt');

function loggerMiddleware(req, res, next) {
  // Logging is now handled in route handlers for specific actions only
  next();
}

module.exports = { loggerMiddleware };
