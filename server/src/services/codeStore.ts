/**
 * Verification code store — pluggable backend.
 *
 * MemoryStore (default): fast, lost on restart.
 * FileStore: persists to SQLite, survives restart. Used in production.
 *
 * Swap to Redis by implementing the same CodeStore interface.
 */

import db from '../config/db';
import logger from '../utils/logger';

export interface CodeStore {
  set(phone: string, code: string, ttlMinutes: number): void;
  verify(phone: string, code: string): boolean;
}

// ─── Memory store (dev default) ───

const memoryStore = (): CodeStore => {
  const map = new Map<string, { code: string; expires: number }>();

  return {
    set(phone, code, ttlMinutes) {
      map.set(phone, { code, expires: Date.now() + ttlMinutes * 60 * 1000 });
    },
    verify(phone, code) {
      const record = map.get(phone);
      if (!record) return false;
      if (Date.now() > record.expires) { map.delete(phone); return false; }
      if (record.code !== code) return false;
      map.delete(phone); // one-time use
      return true;
    },
  };
};

// ─── SQLite store (production) ───

const sqliteStore = (): CodeStore => {
  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires INTEGER NOT NULL
    )
  `);

  // Clean expired codes periodically
  const cleanInterval = setInterval(() => {
    db.prepare('DELETE FROM sms_codes WHERE expires < ?').run(Date.now());
  }, 60_000);
  // Allow process to exit
  if (cleanInterval.unref) cleanInterval.unref();

  return {
    set(phone, code, ttlMinutes) {
      const expires = Date.now() + ttlMinutes * 60 * 1000;
      db.prepare('INSERT OR REPLACE INTO sms_codes (phone, code, expires) VALUES (?, ?, ?)').run(phone, code, expires);
    },
    verify(phone, code) {
      const row = db.prepare('SELECT code, expires FROM sms_codes WHERE phone = ?').get(phone) as { code: string; expires: number } | undefined;
      if (!row) return false;
      if (Date.now() > row.expires) {
        db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone);
        return false;
      }
      if (row.code !== code) return false;
      db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone); // one-time use
      return true;
    },
  };
};

// ─── Factory ───

let store: CodeStore | null = null;

export function getCodeStore(): CodeStore {
  if (!store) {
    const isProd = process.env.NODE_ENV === 'production';
    store = isProd ? sqliteStore() : memoryStore();
    logger.info(`Code store: ${isProd ? 'SQLite (persistent)' : 'Memory (ephemeral)'}`);
  }
  return store;
}
