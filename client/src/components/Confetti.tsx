import { useEffect } from 'react';
import confetti from 'canvas-confetti';

type Intensity = 'full' | 'heavy' | 'light' | 'none';

interface Props {
  intensity: Intensity;
  onDone?: () => void;
}

export default function Confetti({ intensity, onDone }: Props) {
  useEffect(() => {
    if (intensity === 'none') {
      onDone?.();
      return;
    }

    const configs: Record<string, confetti.Options> = {
      full: { particleCount: 150, spread: 100, origin: { y: 0.6 } },
      heavy: { particleCount: 80, spread: 80, origin: { y: 0.6 } },
      light: { particleCount: 30, spread: 60, origin: { y: 0.6 } },
    };

    const opts = configs[intensity] || configs.light;

    confetti({ ...opts, angle: 60 });
    confetti({ ...opts, angle: 120 });

    const timer = setTimeout(() => onDone?.(), 100);
    return () => clearTimeout(timer);
  }, [intensity, onDone]);

  return null;
}

/** 快捷方法：直接触发彩带 */
export function fireConfetti(intensity: 'full' | 'heavy' | 'light' = 'light') {
  const configs: Record<string, confetti.Options> = {
    full: { particleCount: 150, spread: 100, origin: { y: 0.6 } },
    heavy: { particleCount: 80, spread: 80, origin: { y: 0.6 } },
    light: { particleCount: 30, spread: 60, origin: { y: 0.6 } },
  };
  const opts = configs[intensity] || configs.light;
  confetti({ ...opts, angle: 60 });
  confetti({ ...opts, angle: 120 });
}
