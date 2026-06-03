import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import LevelRing from './LevelRing';
import type { UserProgress } from './Layout';

interface Props {
  progress: UserProgress | null;
}

const navItems = [
  { to: '/', label: 'home.heading', icon: '📚' },
  { to: '/learn', label: 'nav.learn', icon: '📖' },
  { to: '/test', label: 'nav.learn', icon: '✏️', suffix: '· 测试' },
  { to: '/wordbook', label: 'nav.wordbook', icon: '📝' },
  { to: '/search', label: 'nav.search', icon: '🔍' },
  { to: '/leaderboard', label: '排行榜', icon: '🏆' },
  { to: '/stats', label: 'nav.stats', icon: '📊' },
];

export default function TabletSidebar({ progress }: Props) {
  const { t, lang, setLang } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="w-52 lg:w-60 h-screen flex flex-col bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-brand-600">研词</span>
        <span className="text-xs text-gray-400 ml-2">{t('header.title')}</span>
      </div>

      {/* User info */}
      {isAuthenticated && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <LevelRing xp={progress?.xp ?? 0} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
            <p className="text-xs text-gray-400">Lv.{progress?.level ?? 1}</p>
            {progress && progress.streak > 0 && (
              <span className="text-xs text-amber-500">🔥 {progress.streak}天</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-auto">
        {navItems.map(({ to, label, icon, suffix }) => (
          <NavLink
            key={to + (suffix || '')}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span className="truncate">{label in t ? t(label as any) : label}{suffix || ''}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-2">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        ) : (
          <NavLink
            to="/login"
            className="block w-full px-3 py-2 rounded-lg text-sm text-brand-600 hover:bg-brand-50 text-center transition-colors"
          >
            登录
          </NavLink>
        )}
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="w-full text-center px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {lang === 'zh' ? 'Switch to English' : '切换中文'}
        </button>
      </div>
    </aside>
  );
}
