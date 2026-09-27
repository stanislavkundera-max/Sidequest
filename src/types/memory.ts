export type MemoryEntry = {
  id: string;
  questId: string | null;
  userQuestId: string | null;
  title: string;
  body: string;
  /** What the screen shows: a short-lived signed URL, made fresh each time memories load. */
  photoUri: string | null;
  /**
   * What the database holds: the photo's storage path (`<userId>/<file>`), or — for memories saved
   * before 2026-09-27 — the one-year signed URL that was stored then. Never shown directly.
   */
  photoRef: string | null;
  /**
   * Chosen by hand, for memories that aren't tied to a quest — a quest's memory
   * takes its quest's category instead. Use `memoryCategoryId` to read the
   * effective one rather than this field directly.
   */
  categoryId: string | null;
  createdAt: string;
};
