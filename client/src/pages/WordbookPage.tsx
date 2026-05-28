import { useEffect, useState, useCallback } from 'react';
import { getUserWordbook, removeFromWordbook } from '../services/api';
import { useI18n } from '../i18n';

interface WordbookEntry {
  _id: string;
  word: string;
  phoneticUs?: string;
  meanings: { pos: string; defCn: string }[];
  level: string;
  addedAt: string;
  type: 'wrong' | 'favorite';
}

export default function WordbookPage() {
  const [entries, setEntries] = useState<WordbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'favorite'>('all');
  const { t } = useI18n();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filter === 'all' ? undefined : filter;
      const res = await getUserWordbook(typeParam);
      if (res.success) setEntries(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleRemove = async (id: string, type: string) => {
    await removeFromWordbook(id, type);
    setEntries((prev) => prev.filter((e) => !(e._id === id && e.type === type)));
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">{t('wordbook.title')}</h1>

      {/* Filter tabs */}
      <div className="flex gap-0 mb-4 border-b border-gray-200">
        {(['all', 'wrong', 'favorite'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {f === 'all' ? t('wordbook.filter.all') : f === 'wrong' ? t('wordbook.filter.wrong') : t('wordbook.filter.favorite')}
          </button>
        ))}
        <span className="ml-auto py-2 text-xs text-gray-400">{t('wordbook.count', { count: entries.length })}</span>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-gray-400">{t('wordbook.loading')}</div>
      )}

      {!loading && entries.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">{t('wordbook.empty')}</div>
      )}

      {!loading && entries.length > 0 && (
        <div className="card overflow-hidden">
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            return (
              <div
                key={`${entry._id}-${entry.type}`}
                className={`px-4 py-3 flex items-center justify-between ${
                  !isLast ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                    entry.type === 'wrong'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {entry.type === 'wrong' ? t('wordbook.filter.wrong') : t('wordbook.filter.favorite')}
                  </span>
                  <span className="font-semibold text-gray-900">{entry.word}</span>
                  <span className="text-gray-400 text-sm truncate hidden sm:inline">
                    — {entry.meanings[0]?.defCn || ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{entry.addedAt?.split('T')[0] || ''}</span>
                  <button
                    onClick={() => handleRemove(entry._id, entry.type)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    {t('wordbook.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
