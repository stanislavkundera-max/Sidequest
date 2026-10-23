import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import {
  feedbackPromptDue,
  recordFeedbackPromptShown,
} from '@/src/features/feedback/feedbackPrompt';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { storedStepTimers } from '@/src/features/quests/questRunnerTimer';
import { trackEvent } from '@/src/lib/analytics';
import { useDialogStore } from '@/stores/dialog';
import { useSessionStore } from '@/stores/session';

/** The calm moments: arriving at Explore, Memories or Progress. Never a runner or a form. */
const CALM_SCREENS: Record<string, string> = {
  '/explore': 'explore',
  '/memories': 'memories',
  '/profile': 'progress',
};

/** Let the screen settle before asking — a tap straight through to elsewhere cancels it. */
const SETTLE_MS = 1500;
/** Nothing right after a dialog: one message on top of another reads as a nag. */
const AFTER_DIALOG_MS = 5000;
/** Not at a cold start: the screen the app opens on, and the first moments after, are left alone. */
const AFTER_LAUNCH_MS = 15_000;
/** A timer left behind by a quest paused mid-step stops counting after this. */
const TIMER_STALE_MS = 12 * 60 * 60 * 1000;

/** A quest step done or a memory kept — there is something to give feedback on. */
function hasSomethingToSay(userId: string): boolean {
  const quests = useQuestDomainStore.getState();
  const memories = useMemoryStore.getState();
  const didStep =
    quests.initializedForUserId === userId &&
    quests.userQuests.some(
      (uq) => uq.status === 'completed' || Object.keys(uq.stepProgress).length > 0
    );
  const keptMemory = memories.initializedForUserId === userId && memories.memories.length > 0;
  return didStep || keptMemory;
}

/** Someone is out on a timed step: the timer is still running, or done but not yet finished. */
async function timedStepUnderway(): Promise<boolean> {
  const active = useQuestDomainStore.getState().userQuests.filter((uq) => uq.status === 'active');
  const timers = await storedStepTimers();
  return timers.some(
    (t) =>
      Date.now() - t.startedAt < TIMER_STALE_MS &&
      active.some((uq) => uq.id === t.userQuestId && !uq.stepProgress[t.stepId])
  );
}

/**
 * Opens the feedback pop-up on its own, now and then (task 60). *Whether* it may ask is in
 * `feedbackPromptRules.ts`; this decides *when*: on arriving at a calm screen, never at a cold
 * start, during a step timer or right after a dialog. Mounted once, in the tab layout — so not in
 * onboarding or sign-in either.
 */
export function FeedbackPromptHost() {
  const pathname = usePathname();
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const [open, setOpen] = useState(false);
  const previousPath = useRef<string | null>(null);
  const mountedAt = useRef(Date.now());
  const lastDialogAt = useRef(0);

  useEffect(
    () =>
      useDialogStore.subscribe((s, prev) => {
        if (s.queue !== prev.queue) lastDialogAt.current = Date.now();
      }),
    []
  );

  useEffect(() => {
    const from = previousPath.current;
    previousPath.current = pathname;
    const screen = CALM_SCREENS[pathname];
    // An arrival, not the screen the app opened on.
    if (!screen || from == null || from === pathname || !userId || open) return;
    if (Date.now() - mountedAt.current < AFTER_LAUNCH_MS) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const calm = () =>
          !cancelled &&
          useDialogStore.getState().queue.length === 0 &&
          Date.now() - lastDialogAt.current >= AFTER_DIALOG_MS;
        if (!calm()) return;
        if (!(await feedbackPromptDue(hasSomethingToSay(userId)))) return;
        if (await timedStepUnderway()) return;
        if (!calm()) return;
        await recordFeedbackPromptShown();
        trackEvent('feedback_prompt_shown', { sourceScreen: screen }).catch(() => undefined);
        setOpen(true);
      })();
    }, SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, userId, open]);

  return <FeedbackSheet visible={open} onClose={() => setOpen(false)} source="prompt" />;
}
