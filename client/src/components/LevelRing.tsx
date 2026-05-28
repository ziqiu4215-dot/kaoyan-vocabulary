import { getLevelProgress } from '../lib/xp';

interface Props {
  xp: number;
  size?: 'sm' | 'md';
}

export default function LevelRing({ xp, size = 'md' }: Props) {
  const { level, pct } = getLevelProgress(xp);
  const dims = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-14 h-14 text-xs';
  const strokeW = size === 'sm' ? 3 : 4;
  const r = size === 'sm' ? 12 : 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={`relative ${dims} inline-flex items-center justify-center`}>
      <svg className="absolute inset-0 -rotate-90" viewBox={size === 'sm' ? '0 0 30 30' : '0 0 52 52'}>
        <circle cx={size === 'sm' ? 15 : 26} cy={size === 'sm' ? 15 : 26} r={r}
          fill="none" stroke="#E5E7EB" strokeWidth={strokeW} />
        <circle cx={size === 'sm' ? 15 : 26} cy={size === 'sm' ? 15 : 26} r={r}
          fill="none" stroke="#3B82F6" strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out" />
      </svg>
      <span className="font-bold text-gray-700">{level}</span>
    </div>
  );
}

export function LevelRingSm({ xp }: { xp: number }) {
  return <LevelRing xp={xp} size="sm" />;
}

