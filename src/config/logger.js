/**
 * Configuração centralizada do logger
 * Evita duplicação de código e padroniza logs
 */
const pino = require('pino');

const logger = pino({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { 
      colorize: true, 
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;
