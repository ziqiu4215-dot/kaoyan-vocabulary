import axios from 'axios';

// 生产环境用 Render.com 后端，开发环境用 Vite 代理
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('kaoyan-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('kaoyan-token');
      } catch { /* ignore */ }
    }
    const message = error.response?.data?.message || 'Network error';
    console.error('API Error:', message);
    return Promise.reject(error);
  },
);

export default api;

// ---- API functions ----

// Wordbooks
export const getWordbooks = () => api.get('/wordbooks').then((r) => r.data.data);

// Learn
export const getNextWord = (wordbookId: string) =>
  api.get('/learn/next-word', { params: { wordbookId } }).then((r) => r.data);
export const submitLearnRecord = (data: { wordId: string; status: string; quality: number }) =>
  api.post('/learn/record', data).then((r) => r.data);

// Test
export const getTestQuestions = (wordIds: string) =>
  api.get('/test/questions', { params: { wordIds } }).then((r) => r.data);
export const submitTestResult = (answers: { wordId: string; correct: boolean }[]) =>
  api.post('/test/submit', { answers }).then((r) => r.data);

// Review
export const getTodayReviews = () => api.get('/review').then((r) => r.data);
export const submitReviewRating = (wordId: string, quality: number) =>
  api.post('/review/rate', { wordId, quality }).then((r) => r.data);

// User Wordbook
export const getUserWordbook = (type?: string) =>
  api.get('/wordbooks/user/list', { params: type ? { type } : {} }).then((r) => r.data);
export const addToWordbook = (wordId: string, type: 'wrong' | 'favorite') =>
  api.post('/wordbooks/user/add', { wordId, type }).then((r) => r.data);
export const removeFromWordbook = (wordId: string, type?: string) =>
  api.delete(`/wordbooks/user/remove/${wordId}`, { params: type ? { type } : {} }).then((r) => r.data);

// Search
export const searchWords = (q: string) =>
  api.get('/wordbooks/search', { params: { q } }).then((r) => r.data);

// Stats
export const getStats = () => api.get('/stats').then((r) => r.data);
