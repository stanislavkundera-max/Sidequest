import type { Quest, UserQuest } from '@/src/types/quest';

/**
 * One-shot handoff of run evidence from the quest runner to the new-memory
 * screen. Module-level on purpose: it only needs to survive a single
 * navigation, not restarts (long bodies do not fit in route params).
 */
export type MemoryDraft = {
  questId: string;
  title: string;
  body: string;
  photoUri: string | null;
};

let pendingDraft: MemoryDraft | null = null;

export function setMemoryDraft(draft: MemoryDraft): void {
  pendingDraft = draft;
}

/** Returns the draft for this quest (or any, when questId is omitted) and clears it. */
export function consumeMemoryDraft(questId?: string | null): MemoryDraft | null {
  const draft = pendingDraft;
  if (!draft) return null;
  if (questId && draft.questId !== questId) return null;
  pendingDraft = null;
  return draft;
}

/** Builds a human memory body from what the user wrote/collected during the run. */
export function composeMemoryDraftFromRun(quest: Quest, uq: UserQuest): MemoryDraft {
  const paragraphs: string[] = [];
  let photoUri: string | null = null;

  for (const step of quest.actionSteps) {
    const entry = uq.stepProgress[step.id];
    if (!entry) continue;
    const ev = entry.evidence;
    if (ev.kind === 'text' && ev.text.trim()) {
      paragraphs.push(ev.text.trim());
    } else if (ev.kind === 'items' && ev.items.length > 0) {
      paragraphs.push(`${step.title}:\n${ev.items.map((it) => `• ${it}`).join('\n')}`);
    } else if (ev.kind === 'photo' && !photoUri) {
      photoUri = ev.photoUri;
    }
  }

  return {
    questId: quest.id,
    title: quest.title,
    body: paragraphs.join('\n\n'),
    photoUri,
  };
}
