// core/logger.js — Structured logger for the Taste CLI.
//
// Supports debug, info, warn, and error levels. The level is resolved from
// the --verbose flag or the TASTE_VERBOSE environment variable. All output is
// written to stderr so it never pollutes stdout (e.g. --help, --version).

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export function createLogger(level = 'info') {
  const threshold = LEVELS[level] ?? 1;
  return {
    debug: (...args) => threshold <= 0 && console.error('[taste:debug]', ...args),
    info: (...args) => threshold <= 1 && console.error('[taste:info]', ...args),
    warn: (...args) => threshold <= 2 && console.error('[taste:warn]', ...args),
    error: (...args) => threshold <= 3 && console.error('[taste:error]', ...args),
  };
}
