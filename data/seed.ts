import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kaoyan.db');

console.log('Seeding database:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL,
    phonetic_us TEXT,
    phonetic_uk TEXT,
    meanings TEXT NOT NULL,
    root_affix TEXT,
    derivatives TEXT,
    frequency_rank INTEGER,
    collocations TEXT,
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
`);

// Clear existing data
db.exec('DELETE FROM examples');
db.exec('DELETE FROM words');

interface WordData {
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; defEn?: string; examWeight?: number }[];
  rootAffix?: any;
  derivatives?: { word: string; pos: string; defCn: string }[];
  frequencyRank?: number;
  collocations?: { phrase: string; meaning: string }[];
  level: string;
  examples?: { sentence: string; translation: string; source?: string; difficulty?: number }[];
}

const insertWord = db.prepare(`
  INSERT INTO words (word, phonetic_us, phonetic_uk, meanings, root_affix, derivatives, frequency_rank, collocations, level)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertExample = db.prepare(`
  INSERT INTO examples (word_id, sentence, translation, source, difficulty)
  VALUES (?, ?, ?, ?, ?)
`);

const wordsDir = path.join(__dirname, 'words');
const files = fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'));

const insertAll = db.transaction(() => {
  let totalWords = 0;
  let totalExamples = 0;

  for (const file of files) {
    const data: WordData[] = JSON.parse(fs.readFileSync(path.join(wordsDir, file), 'utf-8'));
    console.log(`Processing ${file}: ${data.length} words`);

    for (const item of data) {
      const { examples: exData, ...rest } = item;
      const result = insertWord.run(
        item.word,
        item.phoneticUs || null,
        item.phoneticUk || null,
        JSON.stringify(item.meanings),
        item.rootAffix ? JSON.stringify(item.rootAffix) : null,
        item.derivatives ? JSON.stringify(item.derivatives) : null,
        item.frequencyRank || null,
        item.collocations ? JSON.stringify(item.collocations) : null,
        item.level
      );
      totalWords++;

      if (exData && exData.length > 0) {
        for (const ex of exData) {
          insertExample.run(
            result.lastInsertRowid,
            ex.sentence,
            ex.translation,
            ex.source || null,
            ex.difficulty || 1
          );
          totalExamples++;
        }
      }
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Words: ${totalWords}`);
  console.log(`  Examples: ${totalExamples}`);
});

insertAll();

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_words_level ON words(level);
  CREATE INDEX IF NOT EXISTS idx_words_freq ON words(frequency_rank);
  CREATE INDEX IF NOT EXISTS idx_examples_word ON examples(word_id);
`);

db.close();
console.log('Done.');
