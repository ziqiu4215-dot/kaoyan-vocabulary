import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function RegionCanvas({ wb }: { wb: Wordbook }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const mastered = wb.mastered || 0;
  const learned = wb.learned || 0;
  const due = wb.due || 0;
  const total = wb.total;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth - 4; // padding
    const cols = Math.ceil(Math.sqrt(total * (width / 300))); // adaptive columns
    const rows = Math.ceil(total / cols);
    const cellSize = Math.floor(width / cols); // square cells!
    const height = rows * cellSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Build shuffled cells
    const cells: number[] = [];
    const lc = Math.max(0, learned - mastered);
    cells.push(...Array(mastered).fill(2));
    cells.push(...Array(lc).fill(1));
    cells.push(...Array(Math.min(due, Math.ceil(total * 0.03))).fill(3));
    while (cells.length < total) cells.push(0);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const colors = ['#D1D5DB', '#7DD3FC', '#4ADE80', '#FB7185']; // gray, sky, green, rose
    for (let i = 0; i < cells.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = colors[cells[i]];
      ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5);
    }
  }, [total, mastered, learned, due]);

  const pct = Math.round((learned / total) * 100);
  const bgClass = REGION_BG[wb.id] || 'bg-gray-50 border-gray-200';

  return (
    <button
      onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
      className="text-left cursor-pointer group w-full"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-700 group-hover:text-brand-600 transition-colors">
          {REGION_NAMES[wb.id] || wb.name}
        </span>
        <span className="text-[10px] font-medium text-gray-400">
          {learned > 0 && <span className="text-gray-600">{learned}</span>}
          {learned === 0 && '0'}/{total} · {pct}%
        </span>
      </div>
      <div ref={containerRef} className={`${bgClass} border rounded-xl p-0.5 group-hover:shadow-md transition-shadow overflow-hidden`}>
        <canvas ref={canvasRef} className="block" />
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">词汇大陆</h3>
          <p className="text-xs text-gray-400 mt-0.5">每格 = 1 词 · 共 {totalWords} 格领土</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-gray-900">{pct}%</p>
          <p className="text-[10px] text-gray-400">已探索</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {wordbooks.map((wb) => (
          <RegionCanvas key={wb.id} wb={wb} />
        ))}
      </div>

      {totalDue > 0 && (
        <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-xs font-medium text-rose-600">{totalDue} 个单词等待复习</span>
        </div>
      )}

      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-50 text-[10px] font-medium text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 已掌握</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-300" /> 学习中</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> 待复习</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300" /> 未探索</span>
      </div>
    </div>
  );
}
