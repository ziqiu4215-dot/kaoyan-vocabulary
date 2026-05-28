import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface TestQuestion {
  _id?: string;
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
  const [results, setResults] = useState<{ wordId: string; correct: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'loading' | 'testing' | 'done'>('loading');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      // Get learned words and test them
      const res = await api.get('/learn/next-word', { params: { wordbookId } });
      if (res.data.data) {
        const wordId = res.data.data._id;
        const qRes = await api.get('/test/questions', { params: { wordIds: wordId } });
        if (qRes.data.data && qRes.data.data.length > 0) {
          setQuestions(qRes.data.data);
          setPhase('testing');
        } else {
          setPhase('done');
        }
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
    setResults((prev) => [...prev, { wordId: question.wordId, correct }]);
  };

  const handleNext = () => {
    setShowResult(false);
    setUserAnswer('');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      api.post('/test/submit', { answers: results }).catch(() => {});
      setPhase('done');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-pulse">准备测试中...</div>
      </div>
    );
  }

  if (phase === 'done') {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-6">{correctCount === results.length ? '🎉' : '📚'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">测试完成</h2>
        <div className="text-5xl font-bold text-primary-600 mb-4">
          {results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0}%
        </div>
        <p className="text-gray-500 mb-2">
          正确 {correctCount} / {results.length}
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
            返回词库
          </button>
          <button onClick={() => { setResults([]); setCurrentIdx(0); fetchQuestions(); }} className="btn-primary">
            再来一组
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{currentIdx + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        {/* Meaning Choice */}
        {question.type === 'meaning-choice' && (
          <>
            <h3 className="text-sm text-gray-400 mb-6">选择正确释义</h3>
            <p className="text-3xl font-bold text-center text-gray-900 mb-8">{question.prompt.word}</p>
            <div className="space-y-3">
              {question.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { setUserAnswer(opt); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    showResult
                      ? opt === question.correctAnswer
                        ? 'border-green-400 bg-green-50'
                        : opt === userAnswer
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-100'
                      : userAnswer === opt
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200'
                  }`}
                  disabled={showResult}
                >
                  <span className="text-sm text-gray-700">{opt}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Listen and Write */}
        {question.type === 'listen-write' && (
          <>
            <h3 className="text-sm text-gray-400 mb-6">听发音，写出单词</h3>
            <div className="text-center mb-6">
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(question.correctAnswer);
                    u.lang = 'en-US';
                    u.rate = 0.8;
                    speechSynthesis.speak(u);
                  }
                }}
                className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 text-2xl flex items-center justify-center mx-auto hover:bg-primary-100 transition-colors"
              >
                🔊
              </button>
              <p className="text-sm text-gray-400 mt-2">{question.prompt.phonetic}</p>
            </div>
            <p className="text-center text-sm text-gray-400 mb-4">提示: {question.prompt.hint}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="输入单词拼写..."
              disabled={showResult}
              className={`w-full p-4 rounded-xl border-2 text-center text-xl tracking-wider outline-none ${
                showResult
                  ? userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : 'border-gray-200 focus:border-primary-400'
              }`}
            />
            {showResult && userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase() && (
              <p className="text-center text-green-600 mt-3 font-medium">
                正确答案: {question.correctAnswer}
              </p>
            )}
          </>
        )}

        {/* Fill in Blank */}
        {question.type === 'fill-blank' && (
          <>
            <h3 className="text-sm text-gray-400 mb-6">根据语境填入单词</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-800 leading-relaxed">{question.prompt.sentence}</p>
              {question.prompt.translation && (
                <p className="text-gray-400 text-sm mt-2">{question.prompt.translation}</p>
              )}
            </div>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="填入单词..."
              disabled={showResult}
              className={`w-full p-4 rounded-xl border-2 text-center text-xl tracking-wider outline-none ${
                showResult
                  ? userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : 'border-gray-200 focus:border-primary-400'
              }`}
            />
            {showResult && userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase() && (
              <p className="text-center text-green-600 mt-3 font-medium">
                正确答案: {question.correctAnswer}
              </p>
            )}
          </>
        )}
      </div>

      {/* Submit / Next */}
      <div className="text-center">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="btn-primary px-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交
          </button>
        ) : (
          <div className="space-y-4">
            {isCorrect ? (
              <p className="text-green-500 text-lg font-medium animate-bounce">正确! ✓</p>
            ) : (
              <p className="text-red-500 text-lg font-medium">错误 ✗</p>
            )}
            <button onClick={handleNext} className="btn-primary px-10">
              {currentIdx + 1 < questions.length ? '下一题' : '查看结果'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
