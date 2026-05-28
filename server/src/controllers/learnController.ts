import { Request, Response, NextFunction } from 'express';
import Word from '../models/Word';
import LearningRecord from '../models/LearningRecord';
import AppError from '../utils/AppError';

// Get next word for learning (simplified: random word from level not yet learned)
export const getNextWord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordbookId } = req.query;
    const level = wordbookId || 'high-freq';

    // Find words already learned by this user (placeholder: use a demo userId)
    const userId = (req as any).userId || 'demo-user';
    const learnedWordIds = await LearningRecord.find({ userId }).distinct('wordId');

    const word = await Word.findOne({
      level,
      _id: { $nin: learnedWordIds },
    }).lean();

    if (!word) {
      res.json({ success: true, data: null, message: 'All words in this wordbook have been learned' });
      return;
    }

    // Get examples for this word
    const Example = (await import('../models/Example')).default;
    const examples = await Example.find({ wordId: word._id }).lean();

    res.json({ success: true, data: { ...word, examples } });
  } catch (error) {
    next(error);
  }
};

// Submit learning record
export const submitLearningRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordId, status, easeFactor, quality } = req.body;
    const userId = (req as any).userId || 'demo-user';

    if (!wordId || !status) {
      throw new AppError('wordId and status are required', 400);
    }

    const word = await Word.findById(wordId);
    if (!word) {
      throw new AppError('Word not found', 404);
    }

    let record = await LearningRecord.findOne({ userId, wordId });

    if (!record) {
      record = new LearningRecord({ userId, wordId, status: 'new' });
    }

    // SM-2 Algorithm
    const q = quality || (status === 'mastered' ? 4 : 1);
    let { easeFactor: ef, interval, repetitions } = record;

    if (q >= 3) {
      // Correct answer
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * ef);

      repetitions += 1;
      ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    } else {
      // Wrong answer
      repetitions = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
    }

    record.status = status;
    record.easeFactor = ef;
    record.interval = interval;
    record.repetitions = repetitions;
    record.lastReviewAt = new Date();
    record.nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    record.correctCount += q >= 3 ? 1 : 0;
    record.incorrectCount += q < 3 ? 1 : 0;

    await record.save();

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// Get learning stats for a wordbook
export const getLearningStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordbookId } = req.params;
    const userId = (req as any).userId || 'demo-user';

    const total = await Word.countDocuments({ level: wordbookId });
    const learned = await LearningRecord.countDocuments({
      userId,
      status: { $in: ['learning', 'review', 'mastered'] },
    });
    const mastered = await LearningRecord.countDocuments({ userId, status: 'mastered' });

    res.json({
      success: true,
      data: { total, learned, mastered, newCount: total - learned },
    });
  } catch (error) {
    next(error);
  }
};
