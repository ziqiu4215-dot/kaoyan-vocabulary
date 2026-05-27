import { Outlet, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: '首页', icon: '📚' },
  { to: '/learn', label: '学习', icon: '📖' },
  { to: '/review', label: '复习', icon: '🔄' },
  { to: '/wordbook', label: '生词本', icon: '⭐' },
  { to: '/search', label: '搜索', icon: '🔍' },
  { to: '/stats', label: '统计', icon: '📊' },
];

export default function Layout() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white relative">
      <main className="pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-lg mx-auto">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center px-3 py-1 rounded-lg transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600',
                )
              }
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs mt-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
