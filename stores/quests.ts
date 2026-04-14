import { create } from 'zustand';

import type { QuestWithStatus } from '@/lib/questData';

type QuestsState = {
  daily: QuestWithStatus | null;
  weekly: QuestWithStatus | null;
  loading: boolean;
  error: string | null;
  setDaily: (value: QuestWithStatus | null) => void;
  setWeekly: (value: QuestWithStatus | null) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
};

export const useQuestStore = create<QuestsState>((set) => ({
  daily: null,
  weekly: null,
  loading: false,
  error: null,
  setDaily: (daily) => set({ daily }),
  setWeekly: (weekly) => set({ weekly }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
