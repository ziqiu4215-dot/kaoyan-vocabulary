import { Request, Response, NextFunction } from 'express';
import Word from '../models/Word';
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

export const getWordbooks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await Word.aggregate([
      {
        $group: {
          _id: '$level',
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const wordbooks = stats.map((s) => ({
      id: s._id,
      name: LEVEL_NAMES[s._id] || s._id,
      total: s.total,
    }));

    res.json({ success: true, data: wordbooks });
  } catch (error) {
    next(error);
  }
};

export const getWordbookProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const total = await Word.countDocuments({ level: id });
    if (total === 0) {
      throw new AppError('Wordbook not found', 404);
    }
    res.json({
      success: true,
      data: {
        id,
        name: LEVEL_NAMES[id] || id,
        total,
        learned: 0,
        mastered: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchWords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, level, page = '1', limit = '20' } = req.query;
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    if (q) filter.word = { $regex: q, $options: 'i' };

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const [words, total] = await Promise.all([
      Word.find(filter).skip(skip).limit(limitNum).lean(),
      Word.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { words, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
};
