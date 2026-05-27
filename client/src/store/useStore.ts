import { create } from 'zustand';

interface LearningState {
  currentWordbookId: string | null;
  sessionId: string | null;
  dailyGoal: number;
  setWordbook: (id: string) => void;
  setSession: (id: string) => void;
  setDailyGoal: (goal: number) => void;
}

export const useStore = create<LearningState>((set) => ({
  currentWordbookId: null,
  sessionId: null,
  dailyGoal: 20,
  setWordbook: (id) => set({ currentWordbookId: id }),
  setSession: (id) => set({ sessionId: id }),
  setDailyGoal: (goal) => set({ dailyGoal: goal }),
}));
