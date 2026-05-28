import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

// GET /api/leaderboard/level — 等级排行（Top 50）
export const getLevelLeaderboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT id, username, avatar, xp, level, streak,
        (SELECT COUNT(*) FROM learning_records WHERE user_id = users.id) as total_learned
      FROM users
      WHERE xp > 0
      ORDER BY level DESC, xp DESC
      LIMIT 50
    `).all() as any[];

    const list = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.id,
      username: r.username,
      avatar: r.avatar || '',
      xp: r.xp,
      level: r.level,
      streak: r.streak || 0,
      totalLearned: r.total_learned,
    }));

    res.json({ success: true, data: { list } });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaderboard/daily — 今日背词排行（Top 50）
export const getDailyLeaderboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const rows = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.level,
        COALESCE(s.new_words_count, 0) as today_count,
        COALESCE(s.review_words_count, 0) as review_count
      FROM users u
      LEFT JOIN study_sessions s ON s.user_id = u.id AND s.date = ?
      WHERE s.new_words_count > 0 OR s.review_words_count > 0
      ORDER BY (COALESCE(s.new_words_count, 0) + COALESCE(s.review_words_count, 0)) DESC
      LIMIT 50
    `).all(today) as any[];

    const list = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.id,
      username: r.username,
      avatar: r.avatar || '',
      level: r.level,
      todayCount: r.today_count + r.review_count,
      newWords: r.today_count,
      reviewWords: r.review_count,
    }));

    res.json({ success: true, data: { list } });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaderboard/me — 当前用户排名
export const getMyRank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    if (userId === 0) {
      res.json({ success: true, data: null });
      return;
    }

    const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId) as any;

    const levelRank = (db.prepare(
      'SELECT COUNT(*) as c FROM users WHERE level > ? OR (level = ? AND xp > ?)'
    ).get(user.level, user.level, user.xp) as any).c + 1;

    const today = new Date().toISOString().split('T')[0];
    const session = db.prepare(
      'SELECT new_words_count, review_words_count FROM study_sessions WHERE user_id = ? AND date = ?'
    ).get(userId, today) as any;

    const todayTotal = (session?.new_words_count || 0) + (session?.review_words_count || 0);
    const dailyRank = todayTotal > 0
      ? (db.prepare(
          `SELECT COUNT(*) as c FROM study_sessions WHERE date = ? AND (new_words_count + review_words_count) > ?`
        ).get(today, todayTotal) as any).c + 1
      : null;

    res.json({
      success: true,
      data: {
        levelRank,
        dailyRank,
        level: user.level,
        xp: user.xp,
        todayCount: todayTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};
