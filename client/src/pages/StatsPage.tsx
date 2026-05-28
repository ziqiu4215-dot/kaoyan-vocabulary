import { useEffect, useState } from 'react';
import { getStats } from '../services/api';
import { useI18n } from '../i18n';

interface StatsData {
  totalWords: number;
  learned: number;
  mastered: number;
  dueToday: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  streak: number;
  levelStats: { level: string; total: number; learned: number; mastered: number }[];
  recentActivity: { d: string; count: number }[];
}

const levelNames: Record<string, string> = {
  'high-freq': '高频词',
  'mid-freq': '中频词',
  'low-freq': '低频词',
  'core': '核心词',
  'cet4': 'CET-4',
  'cet6': 'CET-6',
  'postgraduate': '考研大纲',
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    getStats()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">{t('stats.loadFailed')}</div>
    );
  }

  const pct = Math.round((stats.learned / Math.max(stats.totalWords, 1)) * 100);

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t('stats.title')}</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('stats.totalWords')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalWords}</p>
        </div>
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('stats.streak')}</p>
          <p className="text-2xl font-bold text-amber-500">{stats.streak}d</p>
        </div>
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('common.learned')}</p>
          <p className="text-2xl font-bold text-brand-600">{stats.learned}</p>
        </div>
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('common.mastered')}</p>
          <p className="text-2xl font-bold text-green-600">{stats.mastered}</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card px-4 py-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">{t('stats.progress')}</span>
          <span className="font-semibold text-gray-900">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-brand-600">{t('common.learned')} {stats.learned}</span>
          <span className="text-green-600">{t('common.mastered')} {stats.mastered}</span>
          <span className="text-gray-400">{t('common.total')} {stats.totalWords}</span>
        </div>
      </div>

      {/* Accuracy & Due */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('stats.accuracy')}</p>
          <p className={`text-2xl font-bold ${
            stats.accuracy >= 80 ? 'text-green-600' : stats.accuracy >= 50 ? 'text-amber-500' : 'text-red-600'
          }`}>
            {stats.accuracy}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalCorrect}✓ / {stats.totalIncorrect}✗</p>
        </div>
        <div className="card px-4 py-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('stats.dueToday')}</p>
          <p className={`text-2xl font-bold ${stats.dueToday > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.dueToday}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('stats.wordsToReview')}</p>
        </div>
      </div>

      {/* Per-level stats */}
      <div className="card overflow-hidden mb-6">
        <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {t('stats.byLevel')}
        </div>
        {stats.levelStats.map((ls, i) => {
          const isLast = i === stats.levelStats.length - 1;
          const lpct = Math.round((ls.learned / Math.max(ls.total, 1)) * 100);
          return (
            <div
              key={ls.level}
              className={`px-4 py-2.5 flex items-center gap-3 text-sm ${!isLast ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-gray-500 w-20 shrink-0 text-xs">{levelNames[ls.level] || ls.level}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${lpct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{lpct}%</span>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
            {t('stats.last7Days')}
          </div>
          <div className="px-4 py-4 flex gap-1 justify-between items-end">
            {stats.recentActivity.map((day) => {
              const maxCount = Math.max(...stats.recentActivity.map((d) => d.count), 1);
              const height = Math.max(4, Math.round((day.count / maxCount) * 80));
              const dayLabel = day.d.slice(5);
              return (
                <div key={day.d} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{day.count || ''}</span>
                  <div
                    className="w-5 bg-green-500 rounded-sm"
                    style={{ height: `${height}px`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-gray-400">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
