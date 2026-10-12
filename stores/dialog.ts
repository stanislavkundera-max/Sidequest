import { create } from 'zustand';

/**
 * The app's own message dialogs, shown by `AppDialogHost` (mounted once in `app/_layout.tsx`).
 *
 * Replaces the native `Alert.alert` box, which on Android looks like a system error ("Hlášky
 * vypadají jako systémový errory" — Standa, round 2c, task 50). Callers keep using
 * `alertCompat` / `alertTwoChoice` from `lib/alertCompat.ts`; only what appears on screen changed.
 */
export type AppDialogButton = {
  text: string;
  onPress?: () => void;
  /** `primary` is the filled button; `secondary` is the way out (also Android back). */
  kind: 'primary' | 'secondary';
};

export type AppDialog = {
  id: number;
  title: string;
  message: string;
  buttons: AppDialogButton[];
};

type DialogState = {
  /** Shown one at a time, oldest first — a second message waits instead of covering the first. */
  queue: AppDialog[];
  show: (dialog: Omit<AppDialog, 'id'>) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useDialogStore = create<DialogState>((set) => ({
  queue: [],
  show: (dialog) => set((s) => ({ queue: [...s.queue, { ...dialog, id: nextId++ }] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((d) => d.id !== id) })),
}));
