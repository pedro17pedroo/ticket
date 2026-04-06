/**
 * Debug Logger Utility
 * 
 * Substitui console.log/console.error por logger do Winston
 * que respeita NODE_ENV e LOG_LEVEL
 * 
 * Em produção (NODE_ENV=production):
 * - debug() não faz nada (silencioso)
 * - info() loga apenas em arquivo
 * - warn() loga em arquivo
 * - error() loga em arquivo
 * 
 * Em desenvolvimento:
 * - Todos os níveis logam no console e arquivo
 */

import logger from '../config/logger.js';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isDebugEnabled = process.env.DEBUG === 'true' || isDevelopment;

/**
 * Logger de debug - apenas em desenvolvimento ou se DEBUG=true
 */
export const debug = (...args) => {
  if (isDebugEnabled) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    logger.debug(message);
  }
};

/**
 * Logger de info - sempre loga (arquivo em prod, console+arquivo em dev)
 */
export const info = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  logger.info(message);
};

/**
 * Logger de warning
 */
export const warn = (...args) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  logger.warn(message);
};

/**
 * Logger de erro - sempre loga
 */
export const error = (...args) => {
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`;
    }
    return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg;
  }).join(' ');
  logger.error(message);
};

/**
 * Wrapper para substituir console.log em código legado
 * Usa debug() para não poluir logs de produção
 */
export const log = debug;

// Export default com todos os métodos
export default {
  debug,
  info,
  warn,
  error,
  log
};
