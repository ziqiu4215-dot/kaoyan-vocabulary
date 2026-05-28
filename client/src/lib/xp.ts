/** XP 计算和等级系统 */

const LEVEL_XP: number[] = [];
let acc = 0;
for (let lv = 1; lv <= 50; lv++) {
  acc += Math.floor(lv * lv * 2.5) + 50;
  LEVEL_XP.push(acc);
}

const TITLES: Record<number, string> = {
  1: '考研新兵', 5: '单词学徒', 10: '词汇达人',
  20: '背词高手', 30: '词汇大师', 50: '考研词王',
};

export function getLevel(xp: number): number {
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp < LEVEL_XP[i]) return i + 1;
  }
  return 50;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return LEVEL_XP[level - 2] || 0;
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_XP[Math.min(level - 1, LEVEL_XP.length - 1)] || 0;
}

export function getLevelProgress(xp: number): { level: number; current: number; next: number; pct: number } {
  const level = getLevel(xp);
  const currentXp = getXpForLevel(level);
  const nextXp = getXpForNextLevel(level);
  const pct = nextXp > currentXp ? Math.round(((xp - currentXp) / (nextXp - currentXp)) * 100) : 100;
  return { level, current: xp - currentXp, next: nextXp - currentXp, pct };
}

export function getTitle(level: number): string {
  let title = '考研新兵';
  for (const [lv, t] of Object.entries(TITLES)) {
    if (level >= Number(lv)) title = t;
  }
  return title;
}

export function xpForAction(action: string): number {
  switch (action) {
    case 'learn_known': return 10;
    case 'learn_unknown': return 5;
    case 'test_correct': return 15;
    case 'test_wrong': return 3;
    case 'review_high': return 10;
    case 'review_mid': return 5;
    case 'daily_goal': return 50;
    case 'streak_7': return 100;
    default: return 0;
  }
}

export const EVALUATIONS: [number, string, string][] = [
  [100, '🏆 完美！你是词汇王！', 'full'],
  [80, '👏 优秀！继续保持！', 'heavy'],
  [60, '💪 不错！还有进步空间！', 'light'],
  [40, '📖 加油！每次复习都在进步！', 'none'],
  [0, '🌱 刚刚开始，坚持就是胜利！', 'none'],
];

export function getEvaluation(pct: number) {
  for (const [threshold, text, confetti] of EVALUATIONS) {
    if (pct >= threshold) return { text, confetti };
  }
  return { text: EVALUATIONS[EVALUATIONS.length - 1][1], confetti: 'none' };
}

export const COMBO_MESSAGES: [number, string][] = [
  [10, '无人能挡！👑'],
  [5, '五连绝杀！⚡'],
  [3, '三连击！🔥'],
];
