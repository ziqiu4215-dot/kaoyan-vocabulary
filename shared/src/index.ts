// Word difficulty levels
export type WordLevel = 'cet4' | 'cet6' | 'postgraduate' | 'ielts' | 'toefl';

// Learning status
export type LearningStatus = 'new' | 'learning' | 'review' | 'mastered';

// Part of speech
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'interjection';

// Meaning entry
export interface Meaning {
  pos: PartOfSpeech;
  defCn: string;
  defEn: string;
  isExamFocus: boolean; // 考研重点考义
}

// Root & affix breakdown
export interface RootAffix {
  root?: string;
  rootMeaning?: string;
  affixes: { text: string; meaning: string }[];
  overallMeaning: string;
}

// Collocation
export interface Collocation {
  phrase: string;
  meaning: string;
}

// Example sentence
export interface Example {
  id: string;
  sentence: string;
  translation: string;
  source: string;
  audioUrl?: string;
  difficulty: 1 | 2 | 3;
}

// Word
export interface Word {
  id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  wordAudioUrl?: string;
  meanings: Meaning[];
  rootAffix?: RootAffix;
  derivatives: { wordId: string; word: string; meaning: string }[];
  collocations: Collocation[];
  frequencyRank?: number;
  level: WordLevel;
  examples: Example[];
}

// Learning record
export interface LearningRecord {
  id: string;
  userId: string;
  wordId: string;
  status: LearningStatus;
  easeFactor: number;      // 2.5 initial, range [1.3, 2.5]
  interval: number;         // days until next review
  repetitions: number;      // consecutive correct
  lastReviewAt: string;
  nextReviewAt: string;
  correctCount: number;
  incorrectCount: number;
}

// Study session
export interface StudySession {
  id: string;
  userId: string;
  date: string;
  newWordsCount: number;
  reviewWordsCount: number;
  durationSeconds: number;
}

// Test question types
export type TestType = 'spell' | 'chooseMeaning' | 'fillBlank' | 'matchMeaning';

export interface TestQuestion {
  id: string;
  wordId: string;
  type: TestType;
  prompt: Record<string, unknown>; // varies by type
  correctAnswer: string;
  options?: string[]; // for chooseMeaning type
}

// API response wrappers
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
