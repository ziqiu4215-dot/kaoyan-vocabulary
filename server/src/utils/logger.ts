/**
 * Structured logger — minimal, zero-dependency.
 *
 * In production, outputs JSON lines with timestamp/level/message.
 * In development, outputs human-readable colored output.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

function formatLine(entry: LogEntry): string {
  if (isProd) return JSON.stringify(entry);

  const color = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  }[entry.level];

  const reset = '\x1b[0m';
  const time = entry.ts.slice(11, 19); // HH:MM:SS
  return `${color}[${entry.level.toUpperCase()}]${reset} ${time} ${entry.msg}`;
}

function log(level: LogLevel, msg: string, extra?: Record<string, unknown>) {
  if (isTest) return; // suppress logs during tests
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, ...extra };
  const line = formatLine(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
};

export default logger;
