import { useState } from 'react';
import { searchWords } from '../services/api';
import { useI18n } from '../i18n';

interface Word {
  _id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; examWeight?: number }[];
  level: string;
  frequencyRank?: number;
  rootAffix?: { meaning: string };
  collocations?: { phrase: string; meaning: string }[];
}

const levelNames: Record<string, string> = {
  'high-freq': '高频词',
  'mid-freq': '中频词',
  'low-freq': '低频词',
  'core': '核心词',
  'cet4': 'CET-4',
  'cet6': 'CET-6',
  'postgraduate': '考研大纲',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const { t } = useI18n();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setExpandedIdx(null);
    try {
      const res = await searchWords(query.trim());
      if (res.success) setResults(res.data?.words || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">{t('search.title')}</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('search.placeholder')}
          className="input flex-1"
          autoFocus
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="btn-primary"
        >
          {t('search.button')}
        </button>
      </div>

      {loading && (
        <p className="py-8 text-center text-sm text-gray-400">{t('search.searching')}</p>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          {t('search.noResults', { query })}
        </p>
      )}

      {results.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">{t('search.results', { count: results.length })}</p>
          <div className="card overflow-hidden">
            {results.map((word, i) => {
              const isLast = i === results.length - 1;
              const isExpanded = expandedIdx === i;
              const mainMeaning = word.meanings[0]?.defCn || '';

              return (
                <div key={word._id}>
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !isLast ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-gray-900">{word.word}</span>
                        <span className="text-gray-400 text-sm truncate">{mainMeaning}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {levelNames[word.level] || word.level} {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>
                    {word.phoneticUs && (
                      <p className="text-xs text-gray-400 mt-0.5">{word.phoneticUs}</p>
                    )}
                  </button>

                  {isExpanded && (
                    <div className={`px-4 py-3 bg-gray-50 text-sm ${!isLast ? 'border-b border-gray-100' : ''}`}>
                      {word.meanings.map((m, j) => (
                        <p key={j} className="py-0.5">
                          <span className={m.examWeight && m.examWeight >= 4 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                            {m.pos}
                          </span>
                          <span className="text-gray-700 ml-2">{m.defCn}</span>
                          {m.examWeight && m.examWeight >= 4 && (
                            <span className="text-amber-600 text-xs ml-1">[考点]</span>
                          )}
                        </p>
                      ))}
                      {word.rootAffix && (
                        <p className="text-brand-600 mt-1 text-xs">{word.rootAffix.meaning}</p>
                      )}
                      {word.collocations && word.collocations.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {word.collocations.map((c, k) => (
                            <span key={k} className="text-gray-400 text-xs">
                              {c.phrase}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
