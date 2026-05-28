import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import AppError from '../utils/AppError';
import { addXp } from './userController';

export const getNextWord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    const wordbookId = (req.query.wordbookId as string) || 'high-freq';

    // Find learned word IDs
    const learnedRows = db.prepare(
      `SELECT word_id FROM learning_records WHERE user_id = ?`
    ).all(userId) as { word_id: number }[];
    const learnedIds = learnedRows.map(r => r.word_id);

    let row: any;
    if (learnedIds.length > 0) {
      const placeholders = learnedIds.map(() => '?').join(',');
      row = db.prepare(
        `SELECT * FROM words WHERE level = ? AND id NOT IN (${placeholders}) ORDER BY frequency_rank LIMIT 1`
      ).get(wordbookId, ...learnedIds);
    } else {
      row = db.prepare(
        `SELECT * FROM words WHERE level = ? ORDER BY frequency_rank LIMIT 1`
      ).get(wordbookId);
    }

    if (!row) {
      res.json({ success: true, data: null, message: 'All words in this wordbook have been learned' });
      return;
    }

    const examples = db.prepare(`SELECT * FROM examples WHERE word_id = ?`).all(row.id);

    const word = {
      _id: row.id.toString(),
      word: row.word,
      phoneticUs: row.phonetic_us,
      phoneticUk: row.phonetic_uk,
      meanings: JSON.parse(row.meanings || '[]'),
      rootAffix: row.root_affix ? JSON.parse(row.root_affix) : undefined,
      derivatives: row.derivatives ? JSON.parse(row.derivatives) : undefined,
      frequencyRank: row.frequency_rank,
      collocations: row.collocations ? JSON.parse(row.collocations) : undefined,
      level: row.level,
      examples,
    };

    res.json({ success: true, data: word });
  } catch (error) {
    next(error);
  }
};

export const submitLearningRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    const { wordId, status, quality } = req.body;
    if (!wordId || !status) {
      throw new AppError('wordId and status are required', 400);
    }

    const word = db.prepare(`SELECT id FROM words WHERE id = ?`).get(parseInt(wordId));
    if (!word) {
      throw new AppError('Word not found', 404);
    }

    const existing = db.prepare(
      `SELECT * FROM learning_records WHERE user_id = ? AND word_id = ?`
    ).get(userId, parseInt(wordId)) as any;

    const q = quality || (status === 'mastered' ? 4 : 1);
    let ef = existing?.ease_factor ?? 2.5;
    let interval = existing?.interval ?? 0;
    let repetitions = existing?.repetitions ?? 0;
    let correctCount = existing?.correct_count ?? 0;
    let incorrectCount = existing?.incorrect_count ?? 0;

    if (q >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * ef);
      repetitions += 1;
      ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      correctCount += 1;
    } else {
      repetitions = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
      incorrectCount += 1;
    }

    const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE learning_records SET status=?, ease_factor=?, interval=?, repetitions=?,
        last_review_at=?, next_review_at=?, correct_count=?, incorrect_count=?, updated_at=?
        WHERE user_id=? AND word_id=?
      `).run(status, ef, interval, repetitions, now, nextReviewAt, correctCount, incorrectCount, now, userId, parseInt(wordId));
    } else {
      db.prepare(`
        INSERT INTO learning_records (user_id, word_id, status, ease_factor, interval, repetitions,
        last_review_at, next_review_at, correct_count, incorrect_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, parseInt(wordId), status, ef, interval, repetitions, now, nextReviewAt, correctCount, incorrectCount);
    }

    const record = db.prepare(
      `SELECT * FROM learning_records WHERE user_id=? AND word_id=?`
    ).get(userId, parseInt(wordId));

    const xpAmount = status === 'mastered' ? 10 : 5;
    const xpResult = addXp(userId, xpAmount);

    res.json({ success: true, data: { ...(record as any), xpEarned: xpAmount, ...xpResult } });
  } catch (error) {
    next(error);
  }
};

export const getLearningStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    const { wordbookId } = req.params;
    const total = (db.prepare(`SELECT COUNT(*) as c FROM words WHERE level = ?`).get(wordbookId) as any).c;
    const learned = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records l JOIN words w ON l.word_id = w.id WHERE l.user_id=? AND w.level=?`
    ).get(userId, wordbookId) as any).c;
    const mastered = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records l JOIN words w ON l.word_id = w.id WHERE l.user_id=? AND w.level=? AND l.status='mastered'`
    ).get(userId, wordbookId) as any).c;

    res.json({
      success: true,
      data: { total, learned, mastered, newCount: total - learned },
    });
  } catch (error) {
    next(error);
  }
};
