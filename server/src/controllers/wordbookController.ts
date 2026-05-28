import { Request, Response, NextFunction } from 'express';
import db from '../config/db';



export const getWordbook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const { type } = req.query;
    let query = `
      SELECT wb.id as wb_id, wb.type, wb.created_at as added_at, w.*
      FROM wordbook wb JOIN words w ON wb.word_id = w.id
      WHERE wb.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (type && (type === 'wrong' || type === 'favorite')) {
      query += ' AND wb.type = ?';
      params.push(type);
    }

    query += ' ORDER BY wb.created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const words = rows.map((r) => ({
      _id: r.id.toString(),
      word: r.word,
      phoneticUs: r.phonetic_us,
      phoneticUk: r.phonetic_uk,
      meanings: JSON.parse(r.meanings || '[]'),
      level: r.level,
      addedAt: r.added_at,
      type: r.type,
    }));

    res.json({ success: true, data: words });
  } catch (error) {
    next(error);
  }
};

export const addToWordbook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const { wordId, type } = req.body;
    if (!wordId || !type) {
      res.status(400).json({ success: false, message: 'wordId and type are required' });
      return;
    }

    if (!['wrong', 'favorite'].includes(type)) {
      res.status(400).json({ success: false, message: 'type must be "wrong" or "favorite"' });
      return;
    }

    // Check word exists
    const word = db.prepare(`SELECT id FROM words WHERE id = ?`).get(parseInt(wordId));
    if (!word) {
      res.status(404).json({ success: false, message: 'Word not found' });
      return;
    }

    // Upsert
    db.prepare(`
      INSERT INTO wordbook (user_id, word_id, type) VALUES (?, ?, ?)
      ON CONFLICT(user_id, word_id, type) DO NOTHING
    `).run(userId, parseInt(wordId), type);

    res.json({ success: true, data: { wordId, type }, message: 'Added to wordbook' });
  } catch (error) {
    next(error);
  }
};

export const removeFromWordbook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || 0;
  try {
    const { wordId } = req.params;
    const { type } = req.query;

    if (type) {
      db.prepare(`DELETE FROM wordbook WHERE user_id = ? AND word_id = ? AND type = ?`)
        .run(userId, parseInt(wordId), type);
    } else {
      db.prepare(`DELETE FROM wordbook WHERE user_id = ? AND word_id = ?`)
        .run(userId, parseInt(wordId));
    }

    res.json({ success: true, data: null, message: 'Removed from wordbook' });
  } catch (error) {
    next(error);
  }
};
