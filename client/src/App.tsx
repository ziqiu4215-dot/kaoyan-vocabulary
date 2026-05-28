import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LearnPage from './pages/LearnPage';
import TestPage from './pages/TestPage';
import ReviewPage from './pages/ReviewPage';
import WordbookPage from './pages/WordbookPage';
import SearchPage from './pages/SearchPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LeaderboardPage from './pages/LeaderboardPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/wordbook" element={<WordbookPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
