import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type SessionState = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (value: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setInitialized: (initialized) => set({ initialized }),
}));
