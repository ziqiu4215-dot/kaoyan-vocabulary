import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Wordbook } from '../types';

interface Props { wordbooks: Wordbook[]; }

const REGION_NAMES: Record<string, string> = {
  core: '核心词', 'high-freq': '高频词', 'mid-freq': '中频词', 'low-freq': '低频词',
};

function RegionCanvas({ wb }: { wb: Wordbook }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const mastered = wb.mastered || 0;
  const learned = wb.learned || 0;
  const due = wb.due || 0;
  const total = wb.total;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cols = 50; // 固定50列, 确保每格够宽
    const rows = Math.ceil(total / cols);
    const cw = w / cols;
    const ch = h / rows;

    // Build and shuffle cells
    const cells: number[] = [];
    const learningCount = Math.max(0, learned - mastered);
    const masteredCount = mastered;
    const dueCount = Math.min(due, total - masteredCount - learningCount);
    const emptyCount = total - masteredCount - learningCount - dueCount;

    cells.push(...Array(masteredCount).fill(2));
    cells.push(...Array(learningCount).fill(1));
    cells.push(...Array(dueCount).fill(3));
    cells.push(...Array(emptyCount).fill(0));
    // Fisher-Yates shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const colors = ['#E5E7EB', '#60A5FA', '#4ADE80', '#F87171'];

    for (let i = 0; i < cells.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = colors[cells[i]];
      ctx.fillRect(col * cw + 0.5, row * ch + 0.5, Math.max(cw - 1, 1), Math.max(ch - 1, 1));
    }
  }, [total, mastered, learned, due]);

  const pct = Math.round((learned / total) * 100);
  // Height proportional to row count, ~3px per row minimum
  const rows = Math.ceil(total / 50);
  const pixelH = Math.max(rows * 6, 60);

  return (
    <button
      onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
      className="text-left cursor-pointer group w-full"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
          {REGION_NAMES[wb.id] || wb.name}
        </span>
        <span className="text-[10px] text-gray-400">{wb.total}词 · {pct}%</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-lg p-0.5 group-hover:border-brand-200 group-hover:shadow-sm transition-all overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: `${pixelH}px` }}
        />
      </div>
    </button>
  );
}

export default function VocabMap({ wordbooks }: Props) {
  if (!wordbooks.length) return null;
  const totalLearned = wordbooks.reduce((s, wb) => s + (wb.learned || 0), 0);
  const totalWords = wordbooks.reduce((s, wb) => s + wb.total, 0);
  const totalDue = wordbooks.reduce((s, wb) => s + (wb.due || 0), 0);
  const pct = Math.round((totalLearned / totalWords) * 100);

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">🗺️ 词汇大陆</h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>已探索 {pct}%</span>
          {totalDue > 0 && <span className="text-red-500 font-medium">{totalDue}词待复习</span>}
        </div>
      </div>

      {/* Stacked regions — each spans full width */}
      <div className="flex flex-col gap-3">
        {wordbooks.map((wb) => (
          <RegionCanvas key={wb.id} wb={wb} />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> 已掌握</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 学习中</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> 待复习</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> 未学</span>
      </div>
    </div>
  );
}
