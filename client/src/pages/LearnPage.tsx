import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Word {
  _id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; examWeight?: number }[];
  rootAffix?: { root?: string; rootMeaning?: string; affixes?: { part: string; meaning: string }[]; meaning: string };
  derivatives?: { word: string; pos: string; defCn: string }[];
  collocations?: { phrase: string; meaning: string }[];
  examples?: { _id: string; sentence: string; translation: string; source?: string }[];
}

export default function LearnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wordbookId = searchParams.get('wordbook') || 'high-freq';

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [learnedCount, setLearnedCount] = useState(0);
  const [showRoot, setShowRoot] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  const fetchWord = useCallback(async () => {
    setLoading(true);
    setShowRoot(false);
    setExampleIdx(0);
    try {
      const res = await api.get('/learn/next-word', { params: { wordbookId } });
      if (res.data.data) {
        setWord(res.data.data);
      } else {
        setWord(null);
      }
    } catch {
      setWord(null);
    } finally {
      setLoading(false);
    }
  }, [wordbookId]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  const handleResponse = async (status: 'learning' | 'mastered') => {
    if (!word) return;
    try {
      await api.post('/learn/record', {
        wordId: word._id,
        status,
        quality: status === 'mastered' ? 4 : 1,
      });
      setLearnedCount((c) => c + 1);
      fetchWord();
    } catch {
      fetchWord();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-pulse">加载单词中...</div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500 text-lg">本词书已全部学完</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          返回选择词书
        </button>
      </div>
    );
  }

  const examples = word.examples || [];
  const currentExample = examples[exampleIdx];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((learnedCount / 20) * 100, 100)}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{learnedCount}/20</span>
      </div>

      {/* Word */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 tracking-wide mb-2">
          {word.word}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <span className="text-gray-400 text-lg">{word.phoneticUs || ''}</span>
          <button
            onClick={() => speak(word.word)}
            className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Meanings */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">释义</h3>
        <div className="space-y-2">
          {word.meanings.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                  m.examWeight && m.examWeight >= 4
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {m.pos}
              </span>
              <span
                className={m.examWeight && m.examWeight >= 4 ? 'font-semibold text-gray-900' : 'text-gray-600'}
              >
                {m.defCn}
                {m.examWeight && m.examWeight >= 4 && (
                  <span className="ml-1 text-xs text-primary-500 font-normal">考研</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Root & Affix */}
      {word.rootAffix && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <button
            onClick={() => setShowRoot(!showRoot)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase">词根词缀</h3>
            <span className="text-gray-300 text-sm">{showRoot ? '收起' : '展开'}</span>
          </button>
          {showRoot && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-800 leading-relaxed">{word.rootAffix.meaning}</p>
              {word.rootAffix.root && (
                <p className="text-xs text-amber-600 mt-1">
                  词根: {word.rootAffix.root}
                  {word.rootAffix.rootMeaning ? ` (${word.rootAffix.rootMeaning})` : ''}
                </p>
              )}
              {word.rootAffix.affixes && word.rootAffix.affixes.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {word.rootAffix.affixes.map((a, i) => (
                    <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      {a.part} — {a.meaning}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      {currentExample && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-400 uppercase">真题例句</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => speak(currentExample.sentence)}
                className="text-gray-400 hover:text-primary-500"
              >
                🔊
              </button>
              {examples.length > 1 && (
                <span className="text-xs text-gray-300">
                  {exampleIdx + 1}/{examples.length}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-800 leading-relaxed mb-2">{currentExample.sentence}</p>
          <p className="text-gray-400 text-sm mb-2">{currentExample.translation}</p>
          {currentExample.source && (
            <p className="text-xs text-gray-300">— {currentExample.source}</p>
          )}
          {examples.length > 1 && (
            <div className="flex gap-2 mt-3">
              {examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setExampleIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === exampleIdx ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Derivatives */}
      {word.derivatives && word.derivatives.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">派生词</h3>
          <div className="flex flex-wrap gap-2">
            {word.derivatives.map((d, i) => (
              <span key={i} className="text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium text-gray-900">{d.word}</span>
                <span className="text-gray-400 ml-1">{d.pos}</span>
                <span className="text-gray-500 ml-1">{d.defCn}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collocations */}
      {word.collocations && word.collocations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">常考搭配</h3>
          <div className="space-y-2">
            {word.collocations.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="font-medium text-gray-900">{c.phrase}</span>
                <span className="text-gray-400">{c.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => handleResponse('learning')}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 active:scale-95 transition-all"
          >
            ❌ 不认识
          </button>
          <button className="w-12 h-12 rounded-xl border border-gray-200 text-gray-400 flex items-center justify-center hover:text-amber-500 hover:border-amber-200 transition-colors">
            ⭐
          </button>
          <button
            onClick={() => handleResponse('mastered')}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 active:scale-95 transition-all"
          >
            ✅ 认识
          </button>
        </div>
      </div>
    </div>
  );
}
