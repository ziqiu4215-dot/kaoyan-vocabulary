import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import AppError from '../utils/AppError';

const LEVEL_NAMES: Record<string, string> = {
  'high-freq': '考研高频词',
  'mid-freq': '考研中频词',
  'low-freq': '考研低频词',
  'core': '真题核心词',
  'cet4': 'CET-4',
  'cet6': 'CET-6',
  'postgraduate': '考研大纲完整版',
};

export const getWordbooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    const rows = db.prepare(`
      SELECT w.level as id, COUNT(*) as total,
        COALESCE(SUM(CASE WHEN lr.id IS NOT NULL THEN 1 ELSE 0 END), 0) as learned,
        COALESCE(SUM(CASE WHEN lr.status = 'mastered' THEN 1 ELSE 0 END), 0) as mastered
      FROM words w
      LEFT JOIN learning_records lr ON lr.word_id = w.id AND lr.user_id = ?
      GROUP BY w.level
      ORDER BY w.level
    `).all(userId) as { id: string; total: number; learned: number; mastered: number }[];

    const wordbooks = rows.map((r) => ({
      id: r.id,
      name: LEVEL_NAMES[r.id] || r.id,
      total: r.total,
      learned: r.learned,
      mastered: r.mastered,
    }));

    res.json({ success: true, data: wordbooks });
  } catch (error) {
    next(error);
  }
};

export const getWordbookProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const row = db.prepare(`SELECT COUNT(*) as total FROM words WHERE level = ?`).get(id) as { total: number };
    if (!row || row.total === 0) {
      throw new AppError('Wordbook not found', 404);
    }
    res.json({
      success: true,
      data: { id, name: LEVEL_NAMES[id] || id, total: row.total, learned: 0, mastered: 0 },
    });
  } catch (error) {
    next(error);
  }
};

export const searchWords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, level, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM words WHERE 1=1';
    const params: (string | number)[] = [];

    if (level) { query += ' AND level = ?'; params.push(level as string); }
    if (q) { query += ' AND word LIKE ?'; params.push(`%${q}%`); }

    const countRow = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params) as { total: number };
    const words = db.prepare(query + ' LIMIT ? OFFSET ?').all(...params, limitNum, offset);

    const parsed = (words as any[]).map(w => ({
      _id: w.id.toString(),
      word: w.word,
      phoneticUs: w.phonetic_us,
      phoneticUk: w.phonetic_uk,
      meanings: JSON.parse(w.meanings || '[]'),
      rootAffix: w.root_affix ? JSON.parse(w.root_affix) : undefined,
      derivatives: w.derivatives ? JSON.parse(w.derivatives) : undefined,
      collocations: w.collocations ? JSON.parse(w.collocations) : undefined,
      frequencyRank: w.frequency_rank,
      level: w.level,
    }));

    res.json({
      success: true,
      data: {
        words: parsed,
        pagination: { page: pageNum, limit: limitNum, total: countRow.total },
      },
    });
  } catch (error) {
    next(error);
  }
};
