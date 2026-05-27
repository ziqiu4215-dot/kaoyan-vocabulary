export interface Wordbook {
  id: string;
  name: string;
  total: number;
  learned?: number;
  mastered?: number;
}

export interface Meaning {
  pos: string;
  defCn: string;
  defEn?: string;
  examWeight?: number;
}

export interface RootAffix {
  root?: string;
  rootMeaning?: string;
  affixes?: { part: string; meaning: string }[];
  meaning: string;
}

export interface Derivative {
  word: string;
  pos: string;
  defCn: string;
}

export interface Collocation {
  phrase: string;
  meaning: string;
}

export interface Word {
  _id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  meanings: Meaning[];
  rootAffix?: RootAffix;
  derivatives?: Derivative[];
  frequencyRank?: number;
  collocations?: Collocation[];
  level: string;
}

export interface Example {
  _id: string;
  wordId: string;
  sentence: string;
  translation: string;
  source?: string;
  audioUrl?: string;
  difficulty?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
