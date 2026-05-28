import { Request, Response, NextFunction } from 'express';
import Word from '../models/Word';
import Example from '../models/Example';

// Generate test questions for a set of words
export const getTestQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordIds: idsParam } = req.query;
    if (!idsParam) {
      res.status(400).json({ success: false, message: 'wordIds query parameter required' });
      return;
    }

    const wordIds = (idsParam as string).split(',');
    const words = await Word.find({ _id: { $in: wordIds } }).lean();
    const allWords = await Word.find({ _id: { $nin: wordIds } }).limit(20).lean();

    const questions: any[] = [];

    for (const word of words) {
      // 1. Meaning choice question
      const distractors = allWords
        .filter((w) => w._id.toString() !== word._id.toString())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      questions.push({
        type: 'meaning-choice',
        wordId: word._id,
        prompt: { word: word.word },
        options: shuffleArray([
          word.meanings[0]?.defCn || '',
          ...distractors.map((d) => d.meanings[0]?.defCn || ''),
        ]),
        correctAnswer: word.meanings[0]?.defCn || '',
      });

      // 2. Listen and spell (return word with missing letters)
      if (word.phoneticUs) {
        const letters = word.word.split('');
        const blankIndices: number[] = [];
        const blankCount = Math.max(2, Math.floor(letters.length * 0.4));
        while (blankIndices.length < blankCount) {
          const idx = Math.floor(Math.random() * letters.length);
          if (!blankIndices.includes(idx) && letters[idx] !== ' ') {
            blankIndices.push(idx);
          }
        }
        const blanked = letters.map((l, i) => (blankIndices.includes(i) ? '_' : l)).join('');

        questions.push({
          type: 'listen-write',
          wordId: word._id,
          prompt: {
            phonetic: word.phoneticUs,
            hint: blanked,
          },
          correctAnswer: word.word,
        });
      }

      // 3. Fill in blank from examples
      const examples = await Example.find({ wordId: word._id }).lean();
      if (examples.length > 0) {
        const example = examples[Math.floor(Math.random() * examples.length)];
        const blankedSentence = example.sentence.replace(
          new RegExp(word.word, 'gi'),
          '____',
        );
        questions.push({
          type: 'fill-blank',
          wordId: word._id,
          prompt: {
            sentence: blankedSentence,
            translation: example.translation,
          },
          correctAnswer: word.word,
        });
      }
    }

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// Submit test answers and update learning records
export const submitTestAnswers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { answers } = req.body; // [{ questionId: wordId, correct: boolean, timeSpentMs: number }]
    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ success: false, message: 'answers array required' });
      return;
    }

    const results = {
      total: answers.length,
      correct: answers.filter((a: any) => a.correct).length,
      wrong: answers.filter((a: any) => !a.correct).length,
      wordResults: answers.map((a: any) => ({
        wordId: a.wordId,
        correct: a.correct,
      })),
    };

    res.json({ success: true, data: results });
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
