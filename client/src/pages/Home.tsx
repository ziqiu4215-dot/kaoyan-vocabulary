import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordbooks } from '../services/wordbookService';
import { Wordbook } from '../types';

const levelIcons: Record<string, string> = {
  'high-freq': '📗',
  'mid-freq': '📘',
  'low-freq': '📙',
  'core': '📓',
  'cet4': '📕',
  'cet6': '📔',
  'postgraduate': '📚',
};

export default function Home() {
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getWordbooks()
      .then(setWordbooks)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load wordbooks'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">选择词书</h1>
        <p className="text-gray-500">从真实语境中学习单词，科学记忆，高效备考</p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-400">加载词库中...</div>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-400 text-sm mt-2">请确保后端服务已启动</p>
        </div>
      )}

      {!loading && !error && wordbooks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          暂无词库，请先运行种子数据脚本
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2">
          {wordbooks.map((wb) => (
            <div
              key={wb.id}
              onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
              className="wordbook-card group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{levelIcons[wb.id] || '📖'}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {wb.total} 词
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {wb.name}
              </h3>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>已学 {(wb.learned || 0)}/{wb.total}</span>
                  <span>{Math.round(((wb.learned || 0) / wb.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${((wb.learned || 0) / wb.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
