import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

// XP → Level calculation (mirrors client-side lib/xp.ts)
const LEVEL_XP: number[] = [];
let acc = 0;
for (let lv = 1; lv <= 50; lv++) {
  acc += Math.floor(lv * lv * 2.5) + 50;
  LEVEL_XP.push(acc);
}

function calcLevel(xp: number): number {
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp < LEVEL_XP[i]) return i + 1;
  }
  return 50;
}

export function addXp(userId: number, amount: number) {
  if (userId === 0) return { xp: 0, level: 1, leveledUp: false }; // 未登录用户跳过
  const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId) as any;
  if (!user) return { xp: 0, level: 1, leveledUp: false };

  const newXp = (user.xp || 0) + amount;
  const newLevel = calcLevel(newXp);
  const leveledUp = newLevel > (user.level || 1);

  db.prepare(`UPDATE users SET xp = ?, level = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(newXp, newLevel, userId);

  // Update study streak
  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.last_study_date;
  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastDate === yesterday ? (user.streak || 0) + 1 : 1;
    db.prepare('UPDATE users SET streak = ?, last_study_date = ? WHERE id = ?')
      .run(newStreak, today, userId);

    // Check streak achievements
    checkAchievements(userId, newStreak);
  }

  // Record study session
  db.prepare(`
    INSERT INTO study_sessions (user_id, date, new_words_count) VALUES (?, ?, 1)
    ON CONFLICT(user_id, date) DO UPDATE SET new_words_count = new_words_count + 1
  `).run(userId, today);

  return { xp: newXp, level: newLevel, leveledUp, streakUpdated: lastDate !== today };
}

// Achievement definitions
const ACHIEVEMENTS = [
  { key: 'first_word', name: '初次见面', icon: '🎖️', check: (data: any) => data.totalLearned >= 1 },
  { key: 'streak_3', name: '连续 3 天', icon: '🔥', check: (data: any) => data.streak >= 3 },
  { key: 'streak_7', name: '一周之星', icon: '🔥🔥', check: (data: any) => data.streak >= 7 },
  { key: 'streak_30', name: '月度王者', icon: '🔥🔥🔥', check: (data: any) => data.streak >= 30 },
  { key: 'words_100', name: '百词斩', icon: '📚', check: (data: any) => data.totalLearned >= 100 },
  { key: 'words_1000', name: '千词达人', icon: '📚📚', check: (data: any) => data.totalLearned >= 1000 },
  { key: 'words_5000', name: '词库征服者', icon: '📚📚📚', check: (data: any) => data.totalLearned >= 5000 },
];

function checkAchievements(userId: number, streak: number) {
  const totalLearned = (db.prepare(
    'SELECT COUNT(*) as c FROM learning_records WHERE user_id = ?'
  ).get(userId) as any).c;

  const data = { totalLearned, streak };
  for (const a of ACHIEVEMENTS) {
    if (a.check(data)) {
      db.prepare(
        'INSERT OR IGNORE INTO achievements (user_id, badge_key) VALUES (?, ?)'
      ).run(userId, a.key);
    }
  }
}

export function checkTestAchievements(userId: number, totalQuestions: number, correctCount: number) {
  if (userId === 0) return [];

  const pct = Math.round((correctCount / totalQuestions) * 100);
  const unlocked: string[] = [];

  if (pct >= 90 && totalQuestions >= 10) {
    const r = db.prepare('INSERT OR IGNORE INTO achievements (user_id, badge_key) VALUES (?, ?)').run(userId, 'accuracy_90');
    if (r.changes > 0) unlocked.push('🎯 精准射手');
  }
  if (pct === 100 && totalQuestions >= 5) {
    const r = db.prepare('INSERT OR IGNORE INTO achievements (user_id, badge_key) VALUES (?, ?)').run(userId, 'perfect_score');
    if (r.changes > 0) unlocked.push('💯 满分学霸');
  }

  return unlocked;
}

// GET /api/user/progress
export const getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId || 0;
    if (userId === 0) {
      res.json({ success: true, data: { xp: 0, level: 1, streak: 0, achievements: [] } });
      return;
    }

    const user = db.prepare('SELECT xp, level, streak FROM users WHERE id = ?').get(userId) as any;
    const achievements = db.prepare(
      "SELECT badge_key, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC"
    ).all(userId);

    const achievementDetails = (achievements as any[]).map((a: any) => {
      const def = ACHIEVEMENTS.find(d => d.key === a.badge_key);
      return def ? { ...def, unlockedAt: a.unlocked_at } : null;
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        xp: user?.xp || 0,
        level: user?.level || 1,
        streak: user?.streak || 0,
        achievements: achievementDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};
