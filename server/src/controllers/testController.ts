import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import { addXp, checkTestAchievements } from './userController';

export const getTestQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordIds: idsParam } = req.query;
    if (!idsParam) {
      res.status(400).json({ success: false, message: 'wordIds query parameter required' });
      return;
    }

    const wordIds = (idsParam as string).split(',').map(Number);
    const placeholders = wordIds.map(() => '?').join(',');

    const words = db.prepare(
      `SELECT * FROM words WHERE id IN (${placeholders})`
    ).all(...wordIds) as any[];

    const allWords = db.prepare(
      `SELECT * FROM words WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 20`
    ).all(...wordIds) as any[];

    const questions: any[] = [];

    for (const word of words) {
      const meanings = JSON.parse(word.meanings || '[]');
      const mainMeaning = meanings[0]?.defCn || '';

      // 1. Meaning choice
      const distractors = allWords
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => {
          const m = JSON.parse(w.meanings || '[]');
          return m[0]?.defCn || '';
        })
        .filter(Boolean);

      if (mainMeaning && distractors.length >= 2) {
        questions.push({
          type: 'meaning-choice',
          wordId: word.id.toString(),
          prompt: { word: word.word },
          options: shuffleArray([mainMeaning, ...distractors]),
          correctAnswer: mainMeaning,
        });
      }

      // 2. Listen and write
      if (word.phonetic_us) {
        const letters = word.word.split('');
        const blankIndices: number[] = [];
        const blankCount = Math.max(2, Math.floor(letters.length * 0.4));
        while (blankIndices.length < blankCount) {
          const idx = Math.floor(Math.random() * letters.length);
          if (!blankIndices.includes(idx)) blankIndices.push(idx);
        }
        const blanked = letters.map((l: string, i: number) => (blankIndices.includes(i) ? '_' : l)).join('');

        questions.push({
          type: 'listen-write',
          wordId: word.id.toString(),
          prompt: { phonetic: word.phonetic_us, hint: blanked },
          correctAnswer: word.word,
        });
      }

      // 3. Fill in blank
      const examples = db.prepare(`SELECT * FROM examples WHERE word_id = ?`).all(word.id) as any[];
      if (examples.length > 0) {
        const example = examples[Math.floor(Math.random() * examples.length)];
        const blankedSentence = example.sentence.replace(new RegExp(word.word, 'gi'), '____');
        questions.push({
          type: 'fill-blank',
          wordId: word.id.toString(),
          prompt: { sentence: blankedSentence, translation: example.translation },
          correctAnswer: word.word,
        });
      }
    }

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const submitTestAnswers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ success: false, message: 'answers array required' });
      return;
    }

    const correctCount = answers.filter((a: any) => a.correct).length;
    const wrongCount = answers.filter((a: any) => !a.correct).length;
    const results = {
      total: answers.length,
      correct: correctCount,
      wrong: wrongCount,
      wordResults: answers.map((a: any) => ({ wordId: a.wordId, correct: a.correct })),
    };

    // Award XP
    const xpAmount = correctCount * 15 + wrongCount * 3;
    const userId = (req as any).userId || 0;
    const xpResult = addXp(userId, xpAmount);

    // Check test achievements
    const newAchievements = checkTestAchievements(userId, answers.length, correctCount);

    res.json({
      success: true,
      data: { ...results, xpEarned: xpAmount, ...xpResult, newAchievements },
    });
  } catch (error) {
    next(error);
  }
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
