import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { addToWordbook } from '../services/api';
import { useI18n } from '../i18n';
import XPFloating from '../components/XPFloating';
import { fireConfetti } from '../components/Confetti';
import { useSound } from '../hooks/useSound';

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
  const [xpFloat, setXpFloat] = useState<{ xp: number; label: string } | null>(null);
  const [faved, setFaved] = useState(false);
  const [wordbookTotal, setWordbookTotal] = useState(20); // 词书总词数
  const { t } = useI18n();
  const sound = useSound();

  // 获取词书总词数
  useEffect(() => {
    api.get('/wordbooks').then(res => {
      const wbs = res.data.data;
      const wb = wbs?.find((w: any) => w.id === wordbookId);
      if (wb) setWordbookTotal(wb.total);
    }).catch(() => {});
  }, [wordbookId]);

  const fetchWord = useCallback(async () => {
    setLoading(true);
    setShowRoot(false);
    setExampleIdx(0);
    setFaved(false);
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

  const handleResponse = useCallback(async (status: 'learning' | 'mastered') => {
    if (!word) return;
    const wordId = word._id;
    try {
      const res = await api.post('/learn/record', {
        wordId,
        status,
        quality: status === 'mastered' ? 4 : 1,
      });
      if (status === 'learning') {
        addToWordbook(wordId, 'wrong').catch(() => {});
      }

      const xp = res.data?.data?.xpEarned || (status === 'mastered' ? 10 : 5);
      if (status === 'mastered') sound.playCorrect();
      else sound.playClick();
      setXpFloat({ xp, label: status === 'mastered' ? '认识' : '已记录' });

      const newCount = learnedCount + 1;
      setLearnedCount(newCount);

      // Daily goal celebration (20 words)
      if (newCount === 20) {
        setTimeout(() => fireConfetti('heavy'), 500);
      }

      fetchWord();
    } catch {
      fetchWord();
    }
  }, [word, fetchWord, sound, learnedCount]);

  const handleFavorite = useCallback(async () => {
    if (!word) return;
    try {
      await addToWordbook(word._id, 'favorite');
      setFaved(true);
      sound.playClick();
    } catch { /* ignore */ }
  }, [word, sound]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') handleResponse('learning');
      else if (e.key === 'ArrowRight') handleResponse('mastered');
      else if (e.key === 'f') handleFavorite();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const ex = word?.examples;
        if (ex && ex.length > 1) {
          setExampleIdx((i) => {
            if (e.key === 'ArrowUp') return i > 0 ? i - 1 : ex.length - 1;
            return i < ex.length - 1 ? i + 1 : 0;
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleResponse, handleFavorite, word]);

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
        {t('learn.loading')}
      </div>
    );
  }

  if (!word) {
    return (
      <div className="px-4 py-12 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="text-gray-900">{t('learn.allDone')}</p>
        <p className="text-sm text-gray-400">已学习 {learnedCount} 个单词</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => navigate('/')} className="btn-secondary">
            {t('learn.backToBooks')}
          </button>
          {learnedCount >= 3 && (
            <button onClick={() => navigate(`/test?wordbook=${wordbookId}`)} className="btn-primary">
              去测试巩固 →
            </button>
          )}
        </div>
      </div>
    );
  }

  const examples = word.examples || [];
  const currentExample = examples[exampleIdx];

  return (
    <div className="px-4 py-6 sm:px-6 pb-36">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors text-lg" title="返回首页">
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">{t('nav.learn')}</h1>
          </div>
          {learnedCount >= 10 && (
            <button
              onClick={() => navigate(`/test?wordbook=${wordbookId}`)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              去测试 →
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min((learnedCount / wordbookTotal) * 100, 100)}%` }} />
          </div>
          <span className="text-xs text-gray-400">{learnedCount}/{wordbookTotal}</span>
        </div>
      </div>

      {/* Word Hero — 沉浸式大字 */}
      <div className="text-center mb-8 pt-4">
        <p className="text-7xl sm:text-8xl font-extrabold text-gray-900 tracking-tight mb-4 animate-fade-in">
          {word.word}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-base text-gray-400 font-light">{word.phoneticUs || ''}</span>
          <button
            onClick={() => speak(word.word)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-brand-50 text-gray-500 hover:text-brand-600 flex items-center justify-center transition-all"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Meanings — 柔和卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white">
          {t('learn.meanings')}
        </div>
        <div className="px-5 py-3">
          {word.meanings.map((m, i) => (
            <div key={i} className="flex gap-3 py-1">
              <span className={`w-12 shrink-0 text-xs font-medium ${m.examWeight && m.examWeight >= 4 ? 'text-amber-500' : 'text-gray-400'}`}>
                {m.pos}
              </span>
              <span className={m.examWeight && m.examWeight >= 4 ? 'text-gray-900 font-semibold' : 'text-gray-600'}>
                {m.defCn}
              </span>
              {m.examWeight && m.examWeight >= 4 && (
                <span className="text-amber-500 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 rounded-md">考点</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Root & Affix */}
      {word.rootAffix && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <button
            onClick={() => setShowRoot(!showRoot)}
            className="w-full text-left px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center"
          >
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('learn.rootAffix')}</span>
            <span className="text-brand-500 text-xs">{showRoot ? '收起 ▴' : '展开 ▾'}</span>
          </button>
          {showRoot && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-gray-800 leading-relaxed mb-2">
                {word.rootAffix.meaning}
              </p>
              {word.rootAffix.root && (
                <p className="text-xs text-green-600 font-medium">
                  root: {word.rootAffix.root}
                  {word.rootAffix.rootMeaning ? ` (${word.rootAffix.rootMeaning})` : ''}
                </p>
              )}
              {word.rootAffix.affixes && word.rootAffix.affixes.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {word.rootAffix.affixes.map((a, i) => (
                    <span key={i} className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium">
                      {a.part} = {a.meaning}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      {examples.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {t('learn.example')}{examples.length > 1 ? ` ${exampleIdx + 1}/${examples.length}` : ''}
            </span>
            <div className="flex items-center gap-2">
              {currentExample?.source && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">{currentExample.source}</span>
              )}
              <button onClick={() => speak(currentExample.sentence)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-brand-50 text-gray-400 hover:text-brand-500 flex items-center justify-center transition-all text-xs">
                🔊
              </button>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-gray-50">
            <p className="text-gray-800 leading-relaxed mb-2 text-[15px]">{currentExample.sentence}</p>
            <p className="text-sm text-gray-400">{currentExample.translation}</p>
          </div>
          {examples.length > 1 && (
            <div className="flex gap-1.5 px-5 pb-3">
              {examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setExampleIdx(i)}
                  className={`h-1 rounded-full transition-all ${
                    i === exampleIdx ? 'w-5 bg-brand-500' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Derivatives */}
      {word.derivatives && word.derivatives.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white">
            {t('learn.derivatives')}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            {word.derivatives.map((d, i) => (
              <div key={i} className="flex gap-2 py-0.5 text-sm">
                <span className="text-green-600 font-semibold">{d.word}</span>
                <span className="text-gray-400">{d.pos}</span>
                <span className="text-gray-500">— {d.defCn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collocations */}
      {word.collocations && word.collocations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white">
            {t('learn.collocations')}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            {word.collocations.map((c, i) => (
              <div key={i} className="flex gap-3 py-0.5 text-sm">
                <span className="text-brand-600 font-semibold">{c.phrase}</span>
                <span className="text-gray-400">— {c.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => handleResponse('learning')} className="flex-1 py-3.5 text-sm font-semibold rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98] transition-all">
            {t('learn.unknown')}
          </button>
          <button onClick={handleFavorite} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all active:scale-[0.95] ${faved ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-500 hover:bg-amber-100'}`}>
            {faved ? '★' : '☆'}
          </button>
          <button onClick={() => handleResponse('mastered')} className="flex-1 py-3.5 text-sm font-semibold rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 active:scale-[0.98] transition-all">
            {t('learn.known')}
          </button>
        </div>
      </div>

      {/* XP floating effect */}
      {xpFloat && (
        <XPFloating xp={xpFloat.xp} label={xpFloat.label} onDone={() => setXpFloat(null)} />
      )}
    </div>
  );
}
