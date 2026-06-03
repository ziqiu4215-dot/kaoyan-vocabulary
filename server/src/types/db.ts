/** Database row types — replace `as any` casts with typed queries */

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  phone: string | null;
  avatar: string;
  oauth_provider: string | null;
  oauth_id: string | null;
  xp: number;
  level: number;
  streak: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordRow {
  id: number;
  word: string;
  phonetic_us: string | null;
  phonetic_uk: string | null;
  meanings: string; // JSON string
  root_affix: string | null;
  derivatives: string | null;
  frequency_rank: number | null;
  collocations: string | null;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface ExampleRow {
  id: number;
  word_id: number;
  sentence: string;
  translation: string;
  source: string | null;
  audio_url: string | null;
  difficulty: number;
  created_at: string;
  updated_at: string;
}

export interface LearningRecordRow {
  id: number;
  user_id: string;
  word_id: number;
  status: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_review_at: string | null;
  next_review_at: string | null;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  updated_at: string;
}

export interface CountRow {
  c: number;
}
