import axios from 'axios';
import { getApiBaseUrl } from './native';

// Native: uses configured server URL or emulator localhost mapping
// Web: uses Vite proxy (/api → localhost:5000) or env variable
const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token + bypass localtunnel interstitial
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('kaoyan-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  if (config.baseURL?.includes('loca.lt')) {
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
  }
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

// User Profile
export const getUserProfile = () => api.get('/user/profile').then((r) => r.data);
export const updateUserProfile = (data: { username?: string; email?: string; avatar?: string }) =>
  api.put('/user/profile', data).then((r) => r.data);
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put('/user/password', data).then((r) => r.data);

// Leaderboard
export const getMyRank = () => api.get('/leaderboard/me').then((r) => r.data);
export const getLevelLeaderboard = (limit = 3) =>
  api.get('/leaderboard/level', { params: { limit } }).then((r) => r.data);
