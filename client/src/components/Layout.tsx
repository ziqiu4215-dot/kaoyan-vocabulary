import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LevelRing from './LevelRing';

interface UserProgress { xp: number; level: number; streak: number; }

export default function Layout() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/user/progress').then(r => {
      if (r.data.success) setProgress(r.data.data);
    }).catch(() => {});
  }, [isAuthenticated]);

  const navItems = [
    { to: '/', label: t('nav.home'), kb: '1' },
    { to: '/learn', label: t('nav.learn'), kb: '2' },
    { to: '/review', label: t('nav.review'), kb: '3' },
    { to: '/wordbook', label: t('nav.wordbook'), kb: 'B' },
    { to: '/search', label: t('nav.search'), kb: 'S' },
    { to: '/leaderboard', label: '排行', kb: 'R' },
    { to: '/stats', label: t('nav.stats'), kb: 'T' },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyMap: Record<string, string> = {
        '1': '/', '2': '/learn', '3': '/review',
        'b': '/wordbook', 's': '/search', 'r': '/leaderboard', 't': '/stats',
      };
      const to = keyMap[e.key.toLowerCase()];
      if (to) navigate(to);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-brand-600">研词</span>
          <span className="text-xs text-gray-400 hidden sm:inline">{t('header.title')}</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && progress && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <LevelRing xp={progress.xp} size="sm" />
                <span className="text-xs text-gray-500 font-medium">Lv.{progress.level}</span>
              </div>
              {(progress.streak > 0) && (
                <span className="text-xs text-amber-500 font-medium">🔥 {progress.streak}天</span>
              )}
            </div>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 hidden sm:inline">{user?.username}</span>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              登录
            </Link>
          )}
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="text-xs font-medium px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — safe-area 适配 */}
      <nav className="border-t border-gray-200 bg-white px-2 sm:px-4 py-2 sm:py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex justify-center gap-1 flex-wrap max-w-2xl mx-auto">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-2.5 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors min-h-[40px] flex items-center ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Keyboard shortcut hints */}
        <div className="flex justify-center gap-3 mt-2 max-w-2xl mx-auto">
          {navItems.map(({ to, kb }) => (
            <span key={to} className="kbd">
              <span className="key">⌘{kb}</span>
            </span>
          ))}
        </div>
      </nav>
    </div>
  );
}
