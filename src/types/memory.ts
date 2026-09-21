export type MemoryEntry = {
  id: string;
  questId: string | null;
  userQuestId: string | null;
  title: string;
  body: string;
  photoUri: string | null;
  /**
   * Chosen by hand, for memories that aren't tied to a quest — a quest's memory
   * takes its quest's category instead. Use `memoryCategoryId` to read the
   * effective one rather than this field directly.
   */
  categoryId: string | null;
  createdAt: string;
};
