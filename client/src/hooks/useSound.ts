import { useCallback, useRef } from 'react';

let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* audio not supported */ }
}

export function useSound() {
  const enabled = useRef(true);

  const playCorrect = useCallback(() => {
    if (!enabled.current) return;
    playTone(880, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 80);
  }, []);

  const playWrong = useCallback(() => {
    if (!enabled.current) return;
    playTone(220, 0.2, 'triangle', 0.1);
  }, []);

  const playLevelUp = useCallback(() => {
    if (!enabled.current) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.12), i * 100);
    });
  }, []);

  const playAchievement = useCallback(() => {
    if (!enabled.current) return;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.12), i * 120);
    });
  }, []);

  const playClick = useCallback(() => {
    if (!enabled.current) return;
    playTone(660, 0.05, 'sine', 0.08);
  }, []);

  return { playCorrect, playWrong, playLevelUp, playAchievement, playClick };
}
