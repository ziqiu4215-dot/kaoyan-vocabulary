import { create } from 'zustand';

interface LearningState {
  currentWordbookId: string | null;
  sessionId: string | null;
  dailyGoal: number;
  soundEnabled: boolean;
  setWordbook: (id: string) => void;
  setSession: (id: string) => void;
  setDailyGoal: (goal: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const SETTINGS_KEY = 'kaoyan-settings';

function loadSettings(): Partial<LearningState> {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function persistSettings(state: LearningState) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      dailyGoal: state.dailyGoal,
      soundEnabled: state.soundEnabled,
      currentWordbookId: state.currentWordbookId,
    }));
  } catch { /* ignore */ }
}

const saved = loadSettings();

export const useStore = create<LearningState>((set, get) => ({
  currentWordbookId: saved.currentWordbookId ?? null,
  sessionId: null,
  dailyGoal: saved.dailyGoal ?? 20,
  soundEnabled: saved.soundEnabled ?? true,

  setWordbook: (id) => {
    set({ currentWordbookId: id });
    persistSettings(get());
  },
  setSession: (id) => set({ sessionId: id }),
  setDailyGoal: (goal) => {
    set({ dailyGoal: goal });
    persistSettings(get());
  },
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    persistSettings(get());
  },
}));
