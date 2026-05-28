import { Request, Response, NextFunction } from 'express';
import db from '../config/db';



export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const totalWords = (db.prepare(`SELECT COUNT(*) as c FROM words`).get() as any).c;

    const learned = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records WHERE user_id = ?`
    ).get(userId) as any).c;

    const mastered = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records WHERE user_id = ? AND status = 'mastered'`
    ).get(userId) as any).c;

    const dueToday = (db.prepare(
      `SELECT COUNT(*) as c FROM learning_records WHERE user_id = ? AND next_review_at <= datetime('now')`
    ).get(userId) as any).c;

    const totalCorrect = (db.prepare(
      `SELECT COALESCE(SUM(correct_count), 0) as c FROM learning_records WHERE user_id = ?`
    ).get(userId) as any).c;

    const totalIncorrect = (db.prepare(
      `SELECT COALESCE(SUM(incorrect_count), 0) as c FROM learning_records WHERE user_id = ?`
    ).get(userId) as any).c;

    // Streak — count consecutive days with reviews going backwards
    const days = db.prepare(`
      SELECT DISTINCT date(last_review_at) as d FROM learning_records
      WHERE user_id = ? AND last_review_at IS NOT NULL
      ORDER BY d DESC
      LIMIT 100
    `).all(userId) as { d: string }[];

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (days[i].d === expectedStr) {
        if (i === 0) streak = 1;
        else streak++;
      } else break;
    }
    // If no review today, check yesterday as start
    if (streak === 0 && days.length > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (days[0].d === yesterdayStr) streak = 1;
    }

    // Per-level stats
    const levelStats = db.prepare(`
      SELECT w.level, COUNT(*) as total,
        COALESCE(SUM(CASE WHEN lr.id IS NOT NULL THEN 1 ELSE 0 END), 0) as learned,
        COALESCE(SUM(CASE WHEN lr.status = 'mastered' THEN 1 ELSE 0 END), 0) as mastered
      FROM words w
      LEFT JOIN learning_records lr ON lr.word_id = w.id AND lr.user_id = ?
      GROUP BY w.level
      ORDER BY w.level
    `).all(userId);

    // Recent activity (last 7 days)
    const recentActivity = db.prepare(`
      SELECT date(last_review_at) as d, COUNT(*) as count
      FROM learning_records
      WHERE user_id = ? AND last_review_at >= datetime('now', '-7 days')
      GROUP BY date(last_review_at)
      ORDER BY d ASC
    `).all(userId);

    res.json({
      success: true,
      data: {
        totalWords,
        learned,
        mastered,
        dueToday,
        totalCorrect,
        totalIncorrect,
        accuracy: totalCorrect + totalIncorrect > 0
          ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
          : 0,
        streak,
        levelStats,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
