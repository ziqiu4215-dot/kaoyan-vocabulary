import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('./pages/Home'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
const TestPage = lazy(() => import('./pages/TestPage'));
const WordbookPage = lazy(() => import('./pages/WordbookPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="px-4 py-12 text-center text-sm text-gray-400">
      <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
          <Route path="/learn" element={<Suspense fallback={<PageLoader />}><StudyPage /></Suspense>} />
          <Route path="/test" element={<Suspense fallback={<PageLoader />}><TestPage /></Suspense>} />
          <Route path="/review" element={<Suspense fallback={<PageLoader />}><StudyPage /></Suspense>} />
          <Route path="/wordbook" element={<Suspense fallback={<PageLoader />}><WordbookPage /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
          <Route path="/stats" element={<Suspense fallback={<PageLoader />}><StatsPage /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          <Route path="/auth/callback" element={<Suspense fallback={<PageLoader />}><AuthCallbackPage /></Suspense>} />
          <Route path="/leaderboard" element={<Suspense fallback={<PageLoader />}><LeaderboardPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
