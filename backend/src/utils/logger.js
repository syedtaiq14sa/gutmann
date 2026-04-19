const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function writeLog(level, message, meta) {
  if (!shouldLog(level)) return;
  const formatted = formatMessage(level, message, meta);
  if (level === 'error' || level === 'warn') {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

const logger = {
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),

  httpLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      writeLog(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
        duration: `${duration}ms`,
        ip: req.ip
      });
    });
    next();
  }
};

module.exports = logger;
