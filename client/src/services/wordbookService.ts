import api from './api';
import { Wordbook, ApiResponse, Word, Pagination } from '../types';

export const getWordbooks = () =>
  api.get<ApiResponse<Wordbook[]>>('/wordbooks').then((r) => r.data.data);

export const getWordbookProgress = (id: string) =>
  api.get<ApiResponse<Wordbook>>(`/wordbooks/${id}/progress`).then((r) => r.data.data);

export const searchWords = (params: { q?: string; level?: string; page?: number }) =>
  api.get<ApiResponse<{ words: Word[]; pagination: Pagination }>>('/wordbooks/search', { params }).then((r) => r.data.data);
