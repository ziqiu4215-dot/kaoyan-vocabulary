import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordbooks } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import api from '../services/api';
import { Wordbook } from '../types';
import LevelRing from '../components/LevelRing';

interface TodayStats {
  xp: number; level: number; streak: number;
  todayLearned: number; todayReviewed: number;
}

export default function Home() {
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    Promise.all([
      getWordbooks(),
      isAuthenticated ? api.get('/user/progress').then(r => r.data.data).catch(() => null) : null,
      isAuthenticated ? api.get('/leaderboard/me').then(r => r.data.data).catch(() => null) : null,
    ]).then(([wbs, progress, rank]) => {
      setWordbooks(wbs);
      if (progress) {
        setTodayStats({
          xp: progress.xp || 0,
          level: progress.level || 1,
          streak: progress.streak || 0,
          todayLearned: rank?.todayCount || 0,
          todayReviewed: 0,
        });
      }
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load');
    }).finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Find the most recently used wordbook (one with most learned)
  const activeWordbook = [...wordbooks].sort((a, b) => (b.learned || 0) - (a.learned || 0))[0];

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
      </div>
    );
  }

  if (error && wordbooks.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-4 text-xs">重试</button>
      </div>
    );
  }

  const totalLearned = wordbooks.reduce((s, wb) => s + (wb.learned || 0), 0);
  const totalWords = wordbooks.reduce((s, wb) => s + wb.total, 0);

  return (
    <div className="px-4 py-6 sm:px-6 pb-24">
      {/* Hero Card — 今日学习状态 */}
      {isAuthenticated && todayStats && (
        <div className="card p-5 mb-6 bg-gradient-to-br from-brand-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400">
                {lang === 'zh' ? '今日学习' : 'Today'}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {todayStats.todayLearned}<span className="text-lg text-gray-400 font-normal"> 词</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <LevelRing xp={todayStats.xp} size="sm" />
                <p className="text-[10px] text-gray-400 mt-1">Lv.{todayStats.level}</p>
              </div>
              {todayStats.streak > 0 && (
                <div className="text-center">
                  <p className="text-lg">🔥</p>
                  <p className="text-xs font-bold text-amber-500">{todayStats.streak}天</p>
                </div>
              )}
            </div>
          </div>

          {/* Overall progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{lang === 'zh' ? '总进度' : 'Progress'}</span>
              <span>{totalLearned}/{totalWords}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full transition-all"
                style={{ width: `${totalWords > 0 ? (totalLearned / totalWords) * 100 : 0}%` }} />
            </div>
          </div>

          {activeWordbook && (
            <button
              onClick={() => navigate(`/learn?wordbook=${activeWordbook.id}`)}
              className="btn-primary w-full text-base font-semibold"
            >
              {lang === 'zh' ? `继续学习「${activeWordbook.name}」` : `Continue "${activeWordbook.name}"`}
            </button>
          )}
        </div>
      )}

      {/* Wordbook Cards Grid */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {t('home.heading')}
      </h2>
      <div className="grid gap-3">
        {wordbooks.map((wb) => {
          const learned = wb.learned || 0;
          const pct = Math.round((learned / wb.total) * 100);
          const isActive = activeWordbook?.id === wb.id;

          return (
            <button
              key={wb.id}
              onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
              className={`card p-4 text-left hover:shadow-md transition-all duration-200 cursor-pointer ${
                isActive ? 'ring-2 ring-brand-300' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{wb.name}</span>
                <span className="text-xs text-gray-400">{wb.total} {lang === 'zh' ? '词' : 'words'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-500 w-10 text-right">{pct}%</span>
              </div>
              {learned > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {lang === 'zh' ? '已学' : 'Learned'}: {learned}
                  {(wb.mastered || 0) > 0 ? ` · ${lang === 'zh' ? '掌握' : 'Mastered'}: ${wb.mastered}` : ''}
                </p>
              )}
              {isActive && learned > 0 && (
                <span className="inline-block mt-2 text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {lang === 'zh' ? '上次学习' : 'Last studied'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
