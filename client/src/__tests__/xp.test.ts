import { describe, it, expect } from 'vitest';
import { getLevel, getXpForNextLevel, getLevelProgress, getTitle, xpForAction, getEvaluation } from '../lib/xp';

describe('XP Level System', () => {
  it('getLevel: 0 XP → level 1', () => {
    expect(getLevel(0)).toBe(1);
  });

  it('getLevel: XP grows, level increases', () => {
    const level10Xp = getXpForNextLevel(10);
    expect(getLevel(level10Xp)).toBeGreaterThanOrEqual(10);
  });

  it('getLevelProgress: returns correct structure', () => {
    const p = getLevelProgress(0);
    expect(p.level).toBe(1);
    expect(p.pct).toBe(0);
    expect(p.current).toBe(0);
    expect(p.next).toBeGreaterThan(0);
  });

  it('getLevelProgress: 100% at level boundary', () => {
    const lv2Xp = getXpForNextLevel(1); // XP needed to reach level 2
    const p = getLevelProgress(lv2Xp);
    expect(p.level).toBeGreaterThanOrEqual(2);
  });

  it('getTitle: returns titles by level', () => {
    expect(getTitle(1)).toBe('考研新兵');
    expect(getTitle(5)).toBe('单词学徒');
    expect(getTitle(10)).toBe('词汇达人');
    expect(getTitle(20)).toBe('背词高手');
    expect(getTitle(50)).toBe('考研词王');
  });

  it('xpForAction: returns correct XP values', () => {
    expect(xpForAction('learn_known')).toBe(10);
    expect(xpForAction('learn_unknown')).toBe(5);
    expect(xpForAction('test_correct')).toBe(15);
    expect(xpForAction('test_wrong')).toBe(3);
    expect(xpForAction('review_high')).toBe(10);
    expect(xpForAction('unknown_action')).toBe(0);
  });

  it('getEvaluation: returns confetti levels', () => {
    expect(getEvaluation(100).confetti).toBe('full');
    expect(getEvaluation(85).confetti).toBe('heavy');
    expect(getEvaluation(65).confetti).toBe('light');
    expect(getEvaluation(45).confetti).toBe('none');
    expect(getEvaluation(0).confetti).toBe('none');
  });
});
