import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LevelRing from '../components/LevelRing';

interface RankEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string;
  xp?: number;
  level: number;
  streak?: number;
  totalLearned?: number;
  todayCount?: number;
  newWords?: number;
  reviewWords?: number;
}

interface MyRank {
  levelRank: number;
  dailyRank: number | null;
  level: number;
  xp: number;
  todayCount: number;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'level' | 'daily'>('level');
  const [list, setList] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'level' ? '/leaderboard/level' : '/leaderboard/daily';
    api.get(endpoint).then(r => {
      if (r.data.success) setList(r.data.data.list);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/leaderboard/me').then(r => {
      if (r.data.success && r.data.data) setMyRank(r.data.data);
    }).catch(() => {});
  }, [isAuthenticated, tab]);

  const rankColors = (rank: number) => {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-gray-400';
  };

  const rankIcons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">排行榜</h1>
      <p className="text-sm text-gray-400 mb-4">看看谁最努力</p>

      {/* My rank card */}
      {myRank && (
        <div className="card px-4 py-3 mb-4 flex items-center gap-4">
          <LevelRing xp={myRank.xp} size="sm" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-gray-900">我的排名</span>
          </div>
          <div className="text-right text-sm">
            <div>
              <span className="text-gray-400">等级榜 </span>
              <span className="font-bold text-gray-900">#{myRank.levelRank}</span>
            </div>
            {myRank.dailyRank && (
              <div>
                <span className="text-gray-400">今日榜 </span>
                <span className="font-bold text-brand-600">#{myRank.dailyRank}</span>
                <span className="text-xs text-gray-400 ml-1">({myRank.todayCount}词)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {([
          ['level', '等级排行'],
          ['daily', '今日排行'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {tab === 'daily' ? '今天还没有人打卡，快来当第一！' : '暂无排行数据'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {list.map((entry, i) => (
            <div
              key={entry.userId}
              className={`px-4 py-3 flex items-center gap-3 ${
                i < list.length - 1 ? 'border-b border-gray-100' : ''
              } ${myRank && entry.userId === (myRank as any)?.userId__ ? 'bg-brand-50/50' : ''}`}
            >
              {/* Rank */}
              <div className={`w-8 text-center font-bold text-lg ${rankColors(entry.rank)}`}>
                {rankIcons[entry.rank] || entry.rank}
              </div>

              {/* Avatar & name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {entry.avatar ? (
                  <img src={entry.avatar} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                    {entry.username[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.username}</p>
                  <p className="text-xs text-gray-400">Lv.{entry.level}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                {tab === 'level' ? (
                  <div>
                    <p className="text-sm font-bold text-brand-600">{entry.xp?.toLocaleString()} XP</p>
                    <p className="text-xs text-gray-400">
                      {entry.streak ? `🔥 ${entry.streak}天` : ''}
                      {entry.totalLearned ? ` · ${entry.totalLearned}词` : ''}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-green-600">{entry.todayCount} 词</p>
                    <p className="text-xs text-gray-400">
                      新学{entry.newWords} · 复习{entry.reviewWords}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
