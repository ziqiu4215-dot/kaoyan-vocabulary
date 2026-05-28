import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordbooks } from '../services/api';
import { useI18n } from '../i18n';
import { Wordbook } from '../types';

const levelIcons: Record<string, string> = {
  'high-freq': 'HIGH',
  'mid-freq': 'MID',
  'low-freq': 'LOW',
  'core': 'CORE',
  'cet4': 'CET4',
  'cet6': 'CET6',
};

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Home() {
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    getWordbooks()
      .then(setWordbooks)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load wordbooks'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('home.heading')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t('home.clickHint')}</p>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-gray-400">
          <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
          {t('home.loading')}
        </div>
      )}

      {error && (
        <div className="py-12 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">{t('home.errorCheck')}</p>
        </div>
      )}

      {!loading && !error && wordbooks.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">{t('home.empty')}</p>
      )}

      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="text-xs text-gray-400 px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
            <span>{t('home.cols.id')}</span>
            <div className="flex gap-6">
              <span className="w-12 text-right">{t('home.cols.total')}</span>
              <span className="w-32">{t('home.cols.progress')}</span>
            </div>
          </div>

          {wordbooks.map((wb, i) => {
            const isLast = i === wordbooks.length - 1;
            const learned = wb.learned || 0;
            const mastered = wb.mastered || 0;

            return (
              <div
                key={wb.id}
                onClick={() => navigate(`/learn?wordbook=${wb.id}`)}
                className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isLast ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {levelIcons[wb.id] || wb.id}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{wb.name}</span>
                </div>
                <div className="flex gap-6 items-center">
                  <span className="text-sm text-gray-500 w-12 text-right">{wb.total}</span>
                  <div className="w-32">
                    <ProgressBar current={learned} total={wb.total} />
                  </div>
                  <span className="text-xs text-gray-400 w-14 text-right">
                    {learned > 0 && <span className="text-green-600">{learned}</span>}
                    {mastered > 0 && <span className="text-amber-600 ml-1">{mastered}m</span>}
                    {learned === 0 && '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
