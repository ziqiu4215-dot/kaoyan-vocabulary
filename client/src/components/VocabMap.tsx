import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import type { Wordbook } from '../types';

interface Props { wordbooks: Wordbook[]; }

const REGION_NAMES: Record<string, string> = {
  core: '核心词', 'high-freq': '高频词', 'mid-freq': '中频词', 'low-freq': '低频词',
};
const REGION_BG: Record<string, string> = {
  core: 'bg-emerald-50 border-emerald-200',
  'high-freq': 'bg-blue-50 border-blue-200',
  'mid-freq': 'bg-violet-50 border-violet-200',
  'low-freq': 'bg-amber-50 border-amber-200',
};

const BASE_COLS: Record<string, number> = {
  core: 20, 'high-freq': 36, 'mid-freq': 42, 'low-freq': 32,
};

function useColScale(): number {
  const { isPhone, isDesktop } = useResponsive();
  if (isDesktop) return 1.6;
  if (!isPhone) return 1.3;
  return 1;
}

function RegionMap({ wb, colScale }: { wb: Wordbook; colScale: number }) {
  const navigate = useNavigate();
  const mastered = wb.mastered || 0;
  const learned = wb.learned || 0;
  const due = wb.due || 0;
  const total = wb.total;

  const cells = useMemo(() => {
    const learningCount = Math.max(0, learned - mastered);
    const masteredCount = mastered;
    const dueCount = Math.min(due, Math.ceil(total * 0.03));
    const emptyCount = total - masteredCount - learningCount - dueCount;

    const arr: number[] = [
      ...Array(masteredCount).fill(2),
      ...Array(learningCount).fill(1),
      ...Array(dueCount).fill(3),
      ...Array(emptyCount).fill(0),
    ];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [total, mastered, learned, due]);

  const cols = Math.round((BASE_COLS[wb.id] || 30) * colScale);
  const pct = Math.round((learned / total) * 100);
  const bgClass = REGION_BG[wb.id] || 'bg-gray-50 border-gray-200';

  return (
    <button
      onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
      className="text-left cursor-pointer group w-full"
    >
      {/* Region header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-700 group-hover:text-brand-600 transition-colors">
          {REGION_NAMES[wb.id] || wb.name}
        </span>
        <span className="text-[10px] font-medium text-gray-400">
          {learned > 0 && <span className="text-gray-600">{learned}</span>}
          {learned === 0 && '0'}
          <span className="mx-0.5">/</span>{total}词 · {pct}%
        </span>
      </div>

      {/* Cell grid — each cell is a perfect square */}
      <div
        className={`${bgClass} border rounded-xl p-1 group-hover:shadow-md transition-shadow overflow-hidden`}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.5px' }}
      >
        {cells.map((status, i) => {
          let cls = 'bg-gray-300/60';
          if (status === 2) cls = 'bg-emerald-400 shadow-[0_0_2px_rgba(52,211,153,0.5)]';
          else if (status === 1) cls = 'bg-sky-400';
          else if (status === 3) cls = 'bg-rose-400 animate-pulse';

          return (
            <div
              key={i}
              className={`${cls} rounded-[1px] transition-colors duration-500`}
              style={{ aspectRatio: '1', minWidth: '3px', minHeight: '3px' }}
              title={
                status === 2 ? '已掌握' : status === 1 ? '学习中' : status === 3 ? '待复习' : '未探索'
              }
            />
          );
        })}
      </div>
    </button>
  );
}

export default function VocabMap({ wordbooks }: Props) {
  const colScale = useColScale();
  if (!wordbooks.length) return null;
  const totalLearned = wordbooks.reduce((s, wb) => s + (wb.learned || 0), 0);
  const totalWords = wordbooks.reduce((s, wb) => s + wb.total, 0);
  const totalDue = wordbooks.reduce((s, wb) => s + (wb.due || 0), 0);
  const pct = Math.round((totalLearned / totalWords) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">词汇大陆</h3>
          <p className="text-xs text-gray-400 mt-0.5">每格 = 1 个单词 · 共 {totalWords} 格领土等你探索</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-gray-900">{pct}%</p>
          <p className="text-[10px] text-gray-400">已探索</p>
        </div>
      </div>

      {/* Regions */}
      <div className="flex flex-col gap-3">
        {wordbooks.map((wb) => (
          <RegionMap key={wb.id} wb={wb} colScale={colScale} />
        ))}
      </div>

      {totalDue > 0 && (
        <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-xs font-medium text-rose-600">{totalDue} 个单词等待复习</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-50 text-[10px] font-medium text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 已掌握</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> 学习中</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> 待复习</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300/60" /> 未探索</span>
      </div>
    </div>
  );
}
