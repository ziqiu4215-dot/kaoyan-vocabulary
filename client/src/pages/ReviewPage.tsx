import { useEffect, useState, useCallback, useRef } from 'react';
import { getTodayReviews, submitReviewRating } from '../services/api';
import { useI18n } from '../i18n';
import XPFloating from '../components/XPFloating';
import { useSound } from '../hooks/useSound';

interface ReviewWord {
  _id: string;
  word: string;
  phoneticUs?: string;
  meanings: { pos: string; defCn: string }[];
  record: {
    status: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    correctCount: number;
    incorrectCount: number;
    lastReviewAt: string;
    nextReviewAt: string;
  };
}

const qualityLabels = [
  { q: 0, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { q: 1, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { q: 2, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { q: 3, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { q: 4, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { q: 5, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dueTotal, setDueTotal] = useState(0);
  const [todayLearned, setTodayLearned] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [xpFloat, setXpFloat] = useState<{ xp: number; label: string } | null>(null);
  const { t } = useI18n();
  const sound = useSound();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTodayReviews();
      if (res.success && res.data) {
        setReviews(res.data.words || []);
        setDueTotal(res.data.dueTotal || 0);
        setTodayLearned(res.data.todayLearned || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const word = reviews[currentIdx];

  // Refs for keyboard handler
  const showMeaningRef = useRef(showMeaning);
  showMeaningRef.current = showMeaning;
  const wordRef = useRef(word);
  wordRef.current = word;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!showMeaningRef.current) setShowMeaning(true);
      }
      if (showMeaningRef.current && wordRef.current) {
        const q = parseInt(e.key);
        if (q >= 0 && q <= 5) handleRate(q);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRate = async (quality: number) => {
    if (!word) return;
    try {
      const res = await submitReviewRating(word._id, quality);
      const xp = res.data?.xpEarned || (quality >= 4 ? 10 : 5);
      const labels: Record<number, string> = { 5: '秒杀!⚡', 4: '不错!👍', 3: '下次更好💪', 2: '复习加固🔧', 1: '复习加固🔧', 0: '复习加固🔧' };
      if (quality >= 4) sound.playCorrect();
      else sound.playClick();
      setXpFloat({ xp, label: labels[quality] || '' });
    } catch {
      // continue
    }
    setShowMeaning(false);
    setRatedCount((c) => c + 1);
    if (currentIdx + 1 < reviews.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
        {t('review.loading')}
      </div>
    );
  }

  if (done || reviews.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="text-gray-900 font-medium">
          {reviews.length === 0 ? t('review.allDone') : t('review.completed', { count: ratedCount })}
        </p>
        <p className="text-sm text-gray-400">
          {t('review.stats', { learned: todayLearned, due: dueTotal })}
        </p>
        {reviews.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">{t('review.comeBackLater')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 pb-36">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('nav.review')}</h1>
        <div className="flex justify-between items-center">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-4">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${reviews.length > 0 ? ((currentIdx + 1) / reviews.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{currentIdx + 1}/{reviews.length}</span>
          <span className="text-xs text-gray-400 ml-4">{t('review.stats', { learned: '', due: String(dueTotal - ratedCount) }).replace(' /', '')}</span>
        </div>
      </div>

      {word && (
        <>
          {/* Word card */}
          <div className="card px-6 py-8 text-center mb-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{word.word}</h2>
            <p className="text-gray-400 text-sm">{word.phoneticUs?.replace(/\//g, '') || '—'}</p>
            <p className="text-xs text-gray-400 mt-3">
              {t('review.rep')}:{word.record.repetitions} {t('review.interval')}:{word.record.interval}d {t('review.ef')}:{word.record.easeFactor.toFixed(1)}
            </p>
          </div>

          {/* Show meaning toggle */}
          <div className="text-center mb-4">
            {!showMeaning ? (
              <button
                onClick={() => setShowMeaning(true)}
                className="btn-primary"
              >
                {t('review.showMeaning')}
              </button>
            ) : (
              <div className="card px-4 py-4 text-left">
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase">{t('review.recall')}</p>
                {word.meanings.map((m, i) => (
                  <p key={i} className="text-gray-900 py-0.5">
                    <span className="text-gray-400 text-sm mr-2">{m.pos}</span>
                    {m.defCn}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Rating buttons */}
          {showMeaning && (
            <div className="card overflow-hidden">
              <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
                {t('review.rateQuality')}
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {qualityLabels.map(({ q, color, bg, border: bor }) => (
                  <button
                    key={q}
                    onClick={() => handleRate(q)}
                    className={`rounded-lg py-2.5 text-xs font-medium border transition-colors cursor-pointer ${color} ${bg} ${bor} hover:opacity-80`}
                  >
                    <span className="block text-lg mb-0.5 font-bold">{q}</span>
                    {t(`review.quality.${q}` as any)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {xpFloat && (
        <XPFloating xp={xpFloat.xp} label={xpFloat.label} onDone={() => setXpFloat(null)} />
      )}
    </div>
  );
}
