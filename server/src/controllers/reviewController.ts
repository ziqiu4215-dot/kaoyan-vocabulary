import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import { addXp } from './userController';


export const getTodayReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const today = new Date().toISOString().split('T')[0];

    // Words due for review (next_review_at <= now)
    const rows = db.prepare(`
      SELECT w.*, lr.status, lr.ease_factor, lr.interval, lr.repetitions,
             lr.correct_count, lr.incorrect_count, lr.last_review_at,
             lr.next_review_at
      FROM learning_records lr
      JOIN words w ON lr.word_id = w.id
      WHERE lr.user_id = ? AND lr.next_review_at <= datetime('now')
      ORDER BY lr.next_review_at ASC
      LIMIT 30
    `).all(userId) as any[];

    // Count stats
    const dueTotal = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records WHERE user_id = ? AND next_review_at <= datetime('now')`
    ).get(userId) as any).c;

    const todayLearned = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records WHERE user_id = ? AND date(last_review_at) = ?`
    ).get(userId, today) as any).c;

    const words = rows.map((r) => ({
      _id: r.id.toString(),
      word: r.word,
      phoneticUs: r.phonetic_us,
      phoneticUk: r.phonetic_uk,
      meanings: JSON.parse(r.meanings || '[]'),
      level: r.level,
      record: {
        status: r.status,
        easeFactor: r.ease_factor,
        interval: r.interval,
        repetitions: r.repetitions,
        correctCount: r.correct_count,
        incorrectCount: r.incorrect_count,
        lastReviewAt: r.last_review_at,
        nextReviewAt: r.next_review_at,
      },
    }));

    res.json({
      success: true,
      data: {
        dueTotal,
        todayLearned,
        words,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitReviewRating = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const { wordId, quality } = req.body;
    if (!wordId || quality === undefined) {
      res.status(400).json({ success: false, message: 'wordId and quality are required' });
      return;
    }

    const existing = db.prepare(
      `SELECT * FROM learning_records WHERE user_id = ? AND word_id = ?`
    ).get(userId, parseInt(wordId)) as any;

    if (!existing) {
      res.status(404).json({ success: false, message: 'Learning record not found' });
      return;
    }

    const q = Math.max(0, Math.min(5, quality));
    let ef = existing.ease_factor;
    let interval = existing.interval;
    let repetitions = existing.repetitions;
    let correctCount = existing.correct_count;
    let incorrectCount = existing.incorrect_count;

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
    const status = q >= 4 ? 'mastered' : 'learning';

    db.prepare(`
      UPDATE learning_records SET status=?, ease_factor=?, interval=?, repetitions=?,
      last_review_at=?, next_review_at=?, correct_count=?, incorrect_count=?, updated_at=?
      WHERE user_id=? AND word_id=?
    `).run(status, ef, interval, repetitions, now, nextReviewAt, correctCount, incorrectCount, now, userId, parseInt(wordId));

    const record = db.prepare(
      `SELECT * FROM learning_records WHERE user_id=? AND word_id=?`
    ).get(userId, parseInt(wordId));

    const xpAmount = q >= 4 ? 10 : 5;
    const xpResult = addXp(userId, xpAmount);

    res.json({ success: true, data: { ...(record as any), xpEarned: xpAmount, ...xpResult } });
  } catch (error) {
    next(error);
  }
};
