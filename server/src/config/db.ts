import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../../data/kaoyan.db');

// Ensure the directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL,
    phonetic_us TEXT,
    phonetic_uk TEXT,
    meanings TEXT NOT NULL,         -- JSON array
    root_affix TEXT,                -- JSON object
    derivatives TEXT,               -- JSON array
    frequency_rank INTEGER,
    collocations TEXT,              -- JSON array
    level TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id),
    sentence TEXT NOT NULL,
    translation TEXT NOT NULL,
    source TEXT,
    audio_url TEXT,
    difficulty INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'demo-user',
    word_id INTEGER NOT NULL REFERENCES words(id),
    status TEXT NOT NULL DEFAULT 'new',
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    last_review_at TEXT,
    next_review_at TEXT,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, word_id)
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'demo-user',
    date TEXT NOT NULL,
    new_words_count INTEGER DEFAULT 0,
    review_words_count INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS wordbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'demo-user',
    word_id INTEGER NOT NULL REFERENCES words(id),
    type TEXT NOT NULL DEFAULT 'wrong',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, word_id, type)
  );
`);

// Run migrations (safe to run multiple times)
for (const sql of [
  `ALTER TABLE users ADD COLUMN phone TEXT`,
  `ALTER TABLE users ADD COLUMN oauth_provider TEXT`,
  `ALTER TABLE users ADD COLUMN oauth_id TEXT`,
  `ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN last_study_date TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id)`,
]) {
  try { db.exec(sql); } catch { /* column/index already exists */ }
}

// Create achievements table
db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_key TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, badge_key)
  );
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_words_level ON words(level);
  CREATE INDEX IF NOT EXISTS idx_words_freq ON words(frequency_rank);
  CREATE INDEX IF NOT EXISTS idx_examples_word ON examples(word_id);
  CREATE INDEX IF NOT EXISTS idx_learning_records_user ON learning_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_learning_records_next ON learning_records(next_review_at);
`);

export default db;
