import axios from 'axios';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

interface Word {
  _id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: { pos: string; defCn: string; defEn?: string; examWeight?: number }[];
  rootAffix?: { root?: string; rootMeaning?: string; affixes?: { part: string; meaning: string }[]; meaning: string };
  derivatives?: { word: string; pos: string; defCn: string }[];
  frequencyRank?: number;
  collocations?: { phrase: string; meaning: string }[];
  level: string;
}

interface TestQuestion {
  _id: string;
  type: 'listen-write' | 'meaning-choice' | 'fill-blank' | 'match';
  wordId: string;
  question: string;
  options?: string[];
  correctAnswer: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || '网络错误';
    return Promise.reject(new Error(message));
  },
);

// Wordbooks
export const fetchWordbooks = () => api.get<any, ApiResponse>('/wordbooks');
export const fetchWordbookProgress = (id: string) =>
  api.get<any, ApiResponse>(`/wordbooks/${id}/progress`);

// Learning
export const fetchNextWord = (wordbookId: string) =>
  api.get<any, ApiResponse<Word>>('/learn/next-word', { params: { wordbookId } });
export const submitLearningRecord = (data: {
  wordId: string;
  status: 'learning' | 'mastered';
  easeFactor?: number;
}) => api.post<any, ApiResponse>('/learn/record', data);

// Testing
export const fetchTestQuestions = (sessionId: string) =>
  api.get<any, ApiResponse<TestQuestion[]>>('/test/questions', { params: { sessionId } });
export const submitTestAnswer = (data: {
  questionId: string;
  answer: string;
  correct: boolean;
  timeSpentMs: number;
}) => api.post<any, ApiResponse>('/test/submit', data);

// Review
export const fetchTodayReview = () => api.get<any, ApiResponse<Word[]>>('/review/today');
export const submitReviewRating = (data: {
  wordId: string;
  quality: number;
}) => api.post<any, ApiResponse>('/review/rate', data);

// Wordbook
export const fetchWordbook = () => api.get<any, ApiResponse<Word[]>>('/wordbook');
export const addToWordbook = (wordId: string, type: 'wrong' | 'favorite') =>
  api.post<any, ApiResponse>('/wordbook', { wordId, type });
export const removeFromWordbook = (wordId: string) =>
  api.delete<any, ApiResponse>(`/wordbook/${wordId}`);

// Search
export const searchWords = (q: string) =>
  api.get<any, ApiResponse<Word[]>>('/words/search', { params: { q } });
export const fetchWordDetail = (wordId: string) =>
  api.get<any, ApiResponse<Word>>(`/words/${wordId}`);

// Stats
export const fetchStats = () => api.get<any, ApiResponse>('/stats');

export default api;
