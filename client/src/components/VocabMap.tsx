import { useNavigate } from 'react-router-dom';
import type { Wordbook } from '../types';

interface Props {
  wordbooks: Wordbook[];
}

const CELL_SIZE = 20; // words per cell
const REGION_NAMES: Record<string, string> = {
  core: '核心词',
  'high-freq': '高频词',
  'mid-freq': '中频词',
  'low-freq': '低频词',
};

function RegionMap({ wb }: { wb: Wordbook }) {
  const navigate = useNavigate();
  const mastered = wb.mastered || 0;
  const learned = wb.learned || 0;
  const due = wb.due || 0;
  const totalCells = Math.ceil(wb.total / CELL_SIZE);
  const masteredCells = Math.round((mastered / wb.total) * totalCells);
  const learningCells = Math.round(((learned - mastered) / wb.total) * totalCells);
  const dueCells = Math.min(due, Math.ceil(totalCells * 0.05));
  const emptyCells = Math.max(0, totalCells - masteredCells - learningCells - dueCells);

  // Build cell array with shuffled positions for a natural look
  const cells: string[] = [
    ...Array(masteredCells).fill('mastered'),
    ...Array(learningCells).fill('learning'),
    ...Array(dueCells).fill('due'),
    ...Array(emptyCells).fill('empty'),
  ];
  // Fisher-Yates shuffle for natural distribution
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const pct = Math.round((learned / wb.total) * 100);
  // Determine grid columns: aim for roughly square
  const cols = Math.ceil(Math.sqrt(totalCells));

  return (
    <button
      onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
      className="text-left group cursor-pointer"
    >
      {/* Region label */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-semibold text-gray-600 group-hover:text-brand-600 transition-colors">
          {REGION_NAMES[wb.id] || wb.name}
        </span>
        <span className="text-[10px] text-gray-400">
          {wb.total}词 · {pct}%
        </span>
      </div>

      {/* Cell grid */}
      <div
        className="bg-white border border-gray-100 rounded-lg p-1.5 group-hover:border-brand-200 group-hover:shadow-sm transition-all"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '1px',
        }}
      >
        {cells.map((status, i) => (
          <div
            key={i}
            className={`transition-colors duration-300 ${
              status === 'mastered' ? 'bg-green-400 rounded-sm' :
              status === 'learning' ? 'bg-blue-400 rounded-sm' :
              status === 'due' ? 'bg-red-400 rounded-sm' :
              'bg-gray-200 rounded-sm'
            }`}
            style={{
              width: '100%',
              aspectRatio: '1',
              minWidth: '4px',
              minHeight: '4px',
            }}
            title={
              status === 'mastered' ? '已掌握' :
              status === 'learning' ? '学习中' :
              status === 'due' ? '待复习' :
              '未学习'
            }
          />
        ))}
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
      {/* Map header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          🗺️ 词汇大陆
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>已探索 {pct}%</span>
          {totalDue > 0 && (
            <span className="text-red-500 font-medium">{totalDue}词待复习</span>
          )}
        </div>
      </div>

      {/* 2x2 grid of wordbook regions */}
      <div className="grid grid-cols-2 gap-3">
        {wordbooks.map((wb) => (
          <RegionMap key={wb.id} wb={wb} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> 已掌握
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 学习中
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> 待复习
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> 未学
        </span>
      </div>
    </div>
  );
}
