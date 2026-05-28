import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useI18n } from '../i18n';
import XPFloating from '../components/XPFloating';
import { fireConfetti } from '../components/Confetti';
import { useSound } from '../hooks/useSound';
import { getEvaluation, COMBO_MESSAGES } from '../lib/xp';

interface TestQuestion {
  type: 'meaning-choice' | 'listen-write' | 'fill-blank';
  wordId: string;
  prompt: Record<string, string>;
  options?: string[];
  correctAnswer: string;
}

export default function TestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wordbookId = searchParams.get('wordbook') || 'high-freq';

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'loading' | 'testing' | 'done'>('loading');
  const [combo, setCombo] = useState(0);
  const [xpFloat, setXpFloat] = useState<{ xp: number; label: string } | null>(null);
  const { t } = useI18n();
  const sound = useSound();

  const resultsRef = useRef<{ wordId: string; correct: boolean }[]>([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const wordIds: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await api.get('/learn/next-word', { params: { wordbookId } });
        if (res.data.data) {
          wordIds.push(parseInt(res.data.data._id));
        } else {
          break;
        }
      }

      if (wordIds.length === 0) {
        setPhase('done');
        setLoading(false);
        return;
      }

      const qRes = await api.get('/test/questions', { params: { wordIds: wordIds.join(',') } });
      if (qRes.data.data && qRes.data.data.length > 0) {
        setQuestions(qRes.data.data);
        setPhase('testing');
      } else {
        setPhase('done');
      }
    } catch {
      setPhase('done');
    } finally {
      setLoading(false);
    }
  }, [wordbookId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const question = questions[currentIdx];

  const handleSubmit = () => {
    if (!question) return;
    const correct = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    resultsRef.current = [...resultsRef.current, { wordId: question.wordId, correct }];

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      sound.playCorrect();

      // Combo messages
      for (const [threshold, msg] of COMBO_MESSAGES) {
        if (newCombo === threshold) setXpFloat({ xp: 0, label: msg });
      }
    } else {
      setCombo(0);
      sound.playWrong();
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setUserAnswer('');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      const answers = resultsRef.current;
      api.post('/test/submit', { answers }).then(res => {
        const data = res.data?.data;
        if (data?.xpEarned) {
          setXpFloat({ xp: data.xpEarned, label: '测试完成' });
        }
        if (data?.newAchievements?.length > 0) {
          setTimeout(() => fireConfetti('full'), 300);
        }
      }).catch(() => {});

      answers.forEach((a) => {
        api.post('/learn/record', {
          wordId: a.wordId,
          status: a.correct ? 'mastered' : 'learning',
          quality: a.correct ? 4 : 1,
        }).catch(() => {});
      });
      setPhase('done');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
        {t('test.loading')}
      </div>
    );
  }

  if (phase === 'done') {
    const results = resultsRef.current;
    const correctCount = results.filter((r) => r.correct).length;
    const pct = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    const evalData = getEvaluation(pct);

    // Trigger confetti
    if (evalData.confetti !== 'none') {
      setTimeout(() => fireConfetti(evalData.confetti as any), 200);
    }

    return (
      <div className="px-4 py-12 flex flex-col items-center gap-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          pct >= 80 ? 'bg-green-50' : pct >= 50 ? 'bg-amber-50' : 'bg-red-50'
        }`}>
          <span className={`text-2xl font-bold ${
            pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>{pct}%</span>
        </div>

        <p className="text-xl font-bold text-gray-900">{evalData.text}</p>

        <p className="text-lg font-semibold text-gray-500">{t('test.done')}</p>

        <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-gray-500">
          <span className="text-green-600 font-medium">{correctCount} {t('test.correct')}</span>
          <span className="mx-2">/</span>
          <span className="text-red-600 font-medium">{results.length - correctCount} {t('test.wrong')}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{results.length} {t('common.total')}</span>
        </p>

        <div className="flex gap-4 mt-4">
          <button onClick={() => navigate('/')} className="btn-secondary">
            {t('common.back')}
          </button>
          <button
            onClick={() => {
              resultsRef.current = [];
              setCurrentIdx(0);
              setPhase('loading');
              fetchQuestions();
            }}
            className="btn-primary"
          >
            {t('test.another')}
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const typeLabel = question.type === 'meaning-choice'
    ? t('test.type.meaning')
    : question.type === 'listen-write'
    ? t('test.type.listen')
    : t('test.type.fill');

  return (
    <div className="px-4 py-6 sm:px-6 pb-36">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">{t('nav.learn')} · 测试</h1>
          {combo >= 2 && (
            <span className="text-sm font-bold text-amber-500 animate-pulse">
              🔥 {combo}连击
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{currentIdx + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="card overflow-hidden mb-6">
        <div className="text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {typeLabel}
        </div>

        <div className="px-4 py-5">
          {/* Meaning Choice */}
          {question.type === 'meaning-choice' && (
            <>
              <p className="text-4xl font-bold text-center text-gray-900 mb-6">
                {question.prompt.word}
              </p>
              <div className="space-y-2">
                {question.options?.map((opt, i) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  let cls = 'border-gray-200 text-gray-500 hover:border-gray-300';
                  if (showResult) {
                    if (opt === question.correctAnswer) {
                      cls = 'border-green-400 bg-green-50 text-green-700';
                    } else if (opt === userAnswer) {
                      cls = 'border-red-400 bg-red-50 text-red-700';
                    }
                  } else if (userAnswer === opt) {
                    cls = 'border-brand-400 bg-brand-50 text-brand-700';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setUserAnswer(opt)}
                      disabled={showResult}
                      className={`w-full text-left px-4 py-3 text-sm border rounded-lg transition-colors cursor-pointer ${cls}`}
                    >
                      <span className="font-bold text-brand-600 mr-2">{labels[i]}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Listen and Write */}
          {question.type === 'listen-write' && (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-4">{t('test.listenHint')}</p>
                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const u = new SpeechSynthesisUtterance(question.correctAnswer);
                      u.lang = 'en-US';
                      u.rate = 0.8;
                      speechSynthesis.speak(u);
                    }
                  }}
                  className="btn-primary text-sm"
                >
                  ▶ {t('test.play')}
                </button>
                <p className="text-gray-400 text-xs mt-2">{question.prompt.phonetic?.replace(/\//g, '') || ''}</p>
              </div>
              <p className="text-gray-400 text-xs mb-3 text-center">
                {t('test.hint')}: <span className="text-gray-700 font-medium tracking-widest">{question.prompt.hint}</span>
              </p>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={t('test.placeholder')}
                disabled={showResult}
                className={`input text-lg tracking-wider text-center ${showResult
                  ? userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                    ? 'border-green-400'
                    : 'border-red-400'
                  : ''}`}
                autoFocus
              />
              {showResult && userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase() && (
                <p className="text-sm text-center mt-2">
                  <span className="text-red-600 line-through">{userAnswer || t('test.empty')}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-green-600 font-semibold">{question.correctAnswer}</span>
                </p>
              )}
            </>
          )}

          {/* Fill in Blank */}
          {question.type === 'fill-blank' && (
            <>
              <p className="text-gray-400 text-sm mb-4">{t('test.fillHint')}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-900 leading-relaxed">{question.prompt.sentence}</p>
                {question.prompt.translation && (
                  <p className="text-sm text-gray-400 mt-2">{question.prompt.translation}</p>
                )}
              </div>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={t('test.placeholder')}
                disabled={showResult}
                className={`input text-lg tracking-wider text-center ${showResult
                  ? userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                    ? 'border-green-400'
                    : 'border-red-400'
                  : ''}`}
                autoFocus
              />
              {showResult && userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase() && (
                <p className="text-sm text-center mt-2">
                  <span className="text-red-600 line-through">{userAnswer || t('test.empty')}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-green-600 font-semibold">{question.correctAnswer}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit / Next */}
      <div className="text-center">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="btn-primary px-10 py-2.5"
          >
            {t('common.submit')}
          </button>
        ) : (
          <div className="space-y-4">
            <p className={`text-lg font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? `✓ ${t('test.correct')}` : `✗ ${t('test.wrong')}`}
            </p>
            <button onClick={handleNext} className="btn-primary px-10 py-2.5">
              {currentIdx + 1 < questions.length ? t('test.next') : t('test.viewResult')}
            </button>
          </div>
        )}
      </div>

      {xpFloat && (
        <XPFloating xp={xpFloat.xp} label={xpFloat.label} onDone={() => setXpFloat(null)} />
      )}
    </div>
  );
}
