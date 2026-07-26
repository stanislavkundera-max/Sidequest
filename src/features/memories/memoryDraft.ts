import type { Quest, UserQuest } from '@/src/types/quest';

/** What the quest runner hands off to auto-create a memory on wrap-up. */
export type MemoryDraft = {
  questId: string;
  title: string;
  body: string;
  photoUri: string | null;
};

/** Used when a run collected no written evidence (only confirm/timer steps). */
export const NO_EVIDENCE_NOTE = 'Completed — no notes captured for this run.';

/** Builds a memory body from what the user wrote/collected during the run. */
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
    body: paragraphs.length > 0 ? paragraphs.join('\n\n') : NO_EVIDENCE_NOTE,
    photoUri,
  };
}
