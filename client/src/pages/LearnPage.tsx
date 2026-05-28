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
  const { t } = useI18n();
  const sound = useSound();

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
    } catch { /* ignore */ }
  }, [word]);

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleResponse, handleFavorite]);

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
        <button onClick={() => navigate('/')} className="btn-secondary">
          {t('learn.backToBooks')}
        </button>
      </div>
    );
  }

  const examples = word.examples || [];
  const currentExample = examples[exampleIdx];

  return (
    <div className="px-4 py-6 sm:px-6 pb-36">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('nav.learn')}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min((learnedCount / 20) * 100, 100)}%` }} />
          </div>
          <span className="text-xs text-gray-400">{learnedCount}</span>
        </div>
      </div>

      {/* Word + Phonetic */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-3">{word.word}</h1>
        <div className="flex items-center justify-center gap-4">
          <span className="text-gray-400">{word.phoneticUs || ''}</span>
          <button onClick={() => speak(word.word)} className="btn-ghost text-sm">
            {t('learn.play')}
          </button>
        </div>
      </div>

      {/* Meanings */}
      <div className="card overflow-hidden mb-4">
        <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {t('learn.meanings')}
        </div>
        <div className="px-4 py-3">
          {word.meanings.map((m, i) => (
            <div key={i} className="flex gap-3 text-sm py-0.5">
              <span className={`w-14 shrink-0 ${m.examWeight && m.examWeight >= 4 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                {m.pos}
              </span>
              <span className={m.examWeight && m.examWeight >= 4 ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                {m.defCn}
              </span>
              {m.examWeight && m.examWeight >= 4 && (
                <span className="text-amber-600 text-xs font-medium px-1 py-0.5 bg-amber-50 rounded">{t('learn.exam')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Root & Affix */}
      {word.rootAffix && (
        <div className="card overflow-hidden mb-4">
          <button
            onClick={() => setShowRoot(!showRoot)}
            className="w-full text-left text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100 hover:text-gray-700 transition-colors flex justify-between"
          >
            <span>{t('learn.rootAffix')}</span>
            <span className="text-brand-600">{showRoot ? '收起' : '展开'}</span>
          </button>
          {showRoot && (
            <div className="px-4 py-3 text-sm">
              <p className="text-gray-900 leading-relaxed mb-2">
                <span className="text-brand-600">→</span> {word.rootAffix.meaning}
              </p>
              {word.rootAffix.root && (
                <p className="text-xs text-green-600">
                  root: {word.rootAffix.root}
                  {word.rootAffix.rootMeaning ? ` (${word.rootAffix.rootMeaning})` : ''}
                </p>
              )}
              {word.rootAffix.affixes && word.rootAffix.affixes.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {word.rootAffix.affixes.map((a, i) => (
                    <span key={i} className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
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
      {currentExample && (
        <div className="card overflow-hidden mb-4">
          <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between">
            <span>{t('learn.example')}{examples.length > 1 ? ` ${exampleIdx + 1}/${examples.length}` : ''}</span>
            <button
              onClick={() => speak(currentExample.sentence)}
              className="text-brand-600 hover:text-brand-700 text-xs"
            >
              {t('learn.play')}
            </button>
          </div>
          <div className="px-4 py-4">
            <p className="text-gray-900 leading-relaxed mb-2">{currentExample.sentence}</p>
            <p className="text-sm text-gray-400 mb-1">{currentExample.translation}</p>
            {currentExample.source && (
              <p className="text-xs text-gray-400">— {currentExample.source}</p>
            )}
          </div>
          {examples.length > 1 && (
            <div className="flex gap-2 px-4 pb-3">
              {examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setExampleIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === exampleIdx ? 'bg-brand-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Derivatives */}
      {word.derivatives && word.derivatives.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
            {t('learn.derivatives')}
          </div>
          <div className="px-4 py-3">
            {word.derivatives.map((d, i) => (
              <div key={i} className="flex gap-2 text-sm py-0.5">
                <span className="text-green-600 font-medium">{d.word}</span>
                <span className="text-gray-400">{d.pos}</span>
                <span className="text-gray-500">— {d.defCn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collocations */}
      {word.collocations && word.collocations.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
            {t('learn.collocations')}
          </div>
          <div className="px-4 py-3">
            {word.collocations.map((c, i) => (
              <div key={i} className="flex gap-3 text-sm py-0.5">
                <span className="text-brand-600 font-medium">{c.phrase}</span>
                <span className="text-gray-400">— {c.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => handleResponse('learning')} className="btn-danger flex-1 py-3 text-sm font-semibold rounded-full">
            {t('learn.unknown')}
          </button>
          <button onClick={handleFavorite} className="btn-warning px-4 py-3 text-sm rounded-full">
            {t('learn.fav')}
          </button>
          <button onClick={() => handleResponse('mastered')} className="btn-success flex-1 py-3 text-sm font-semibold rounded-full">
            {t('learn.known')}
          </button>
        </div>
        <p className="text-center text-gray-400 text-xs mt-2">
          <span className="kbd mr-1"><span className="key">←</span></span> {t('learn.unknown')}
          <span className="mx-2">|</span>
          <span className="kbd mr-1"><span className="key">→</span></span> {t('learn.known')}
        </p>
      </div>

      {/* XP floating effect */}
      {xpFloat && (
        <XPFloating xp={xpFloat.xp} label={xpFloat.label} onDone={() => setXpFloat(null)} />
      )}
    </div>
  );
}
