import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LearnPage from './pages/LearnPage';
import TestPage from './pages/TestPage';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p className="text-lg">{title} — 开发中</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/review" element={<Placeholder title="复习" />} />
          <Route path="/wordbook" element={<Placeholder title="生词本" />} />
          <Route path="/search" element={<Placeholder title="搜索" />} />
          <Route path="/stats" element={<Placeholder title="统计" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
