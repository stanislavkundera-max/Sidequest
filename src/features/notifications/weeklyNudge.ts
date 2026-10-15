import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { questDayRemindersOn } from '@/src/features/notifications/questNotifications';
import type { OnboardingCategory, OnboardingPreferences } from '@/src/features/onboarding/types';
import { getNextActionableStepLabel } from '@/src/features/quests/questHelpers';
import {
  likedQuestsInCategory,
  openQuestsInCategory,
  questsInMotionInCategory,
} from '@/src/features/quests/suggestedQuests';
import type { Quest, UserQuest } from '@/src/types/quest';

/**
 * A weekly nudge back into the app (Standa, 2026-10-15, task 53 — a competing app sends one every
 * morning). Ours is gentler on purpose, to stay clear of "endless notifications" (AGENTS.md):
 *
 *   • It arrives only after a week without opening the app. Every open moves it a week on, so
 *     someone using the app never gets one.
 *   • A week that already has a reason to hear from us — a quest day from the calendar, a timer —
 *     gets no nudge on top.
 *   • Three weeks of silence and it stops, until the app is opened again.
 *   • On by default, with everything except "Timers only"; asked for permission at the end of
 *     onboarding, never out of nowhere.
 *
 * What it says: a quest in motion first ("pick it up"), otherwise a quest from a place chosen in
 * onboarding, in that place's words (Standa's model: "Is it all a bit much lately? Escape into
 * nature — I'll help you with it").
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NUDGE_WEEKS = 3;
/** Early evening, local time: after work or school, before the evening is spoken for. */
const NUDGE_HOUR = 18;
const CHANNEL_ID = 'quests';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

const nudgeId = (week: number) => `nudge:${week}`;

type PlaceWords = {
  title: string;
  /** With a concrete quest from the offer. */
  withQuest: (questTitle: string) => string;
  /** When the place has nothing on offer right now. */
  withoutQuest: string;
};

/** One voice per place chosen in onboarding — the categories people said they want more of. */
export const NUDGE_WORDS: Record<OnboardingCategory, PlaceWords> = {
  nature: {
    title: 'A bit much lately?',
    withQuest: (q) => `Escape into nature for a while — try “${q}”. I'll help you with it.`,
    withoutQuest: "Escape into nature for a while. Pick a quest and I'll help you with it.",
  },
  relax: {
    title: 'Could you use a slower day?',
    withQuest: (q) => `Make a little room for yourself — “${q}” is a good place to start. I'll guide you through it.`,
    withoutQuest: "Make a little room for yourself this week. Pick a quest and I'll guide you through it.",
  },
  adventure: {
    title: 'Same week on repeat?',
    withQuest: (q) => `Break it with something bold — “${q}”. I'll help you plan it.`,
    withoutQuest: "Break it with something bold. Pick a quest and I'll help you plan it.",
  },
  social: {
    title: 'Missing some good company?',
    withQuest: (q) => `Make a real connection this week — try “${q}”. I'll help with the first step.`,
    withoutQuest: "Make a real connection this week. Pick a quest and I'll help with the first step.",
  },
};

type Nudge = { title: string; body: string; url: string };

/** "Pick it up" — for a quest someone has started and not finished. */
function inMotionNudge(uq: UserQuest, quest: Quest): Nudge {
  const title = uq.snapshotTitle?.trim() || quest.title;
  const next = quest.actionSteps.length > 0 ? getNextActionableStepLabel(uq, quest) : null;
  return {
    title: `Still up for “${title}”?`,
    body: next
      ? `Next step: ${next}. Pick it up whenever it suits you — I'll walk you through it.`
      : "Pick it up whenever it suits you — I'll walk you through it.",
    url: uq.status === 'active' ? `/quest/run/${quest.id}` : `/quest/${quest.id}`,
  };
}

function placeNudge(
  place: OnboardingCategory,
  catalog: Quest[],
  userQuests: UserQuest[],
  preferences: OnboardingPreferences | null
): Nudge {
  const categoryId = `cat-${place}`;
  const words = NUDGE_WORDS[place];
  // Something they liked there comes first — they already said they want it.
  const liked = likedQuestsInCategory({
    catalog,
    userQuests,
    categoryId,
    hasProgress: () => false,
  })[0]?.quest;
  const quest =
    liked ?? openQuestsInCategory({ catalog, userQuests, categoryId, preferences })[0];
  return quest
    ? { title: words.title, body: words.withQuest(quest.title), url: `/quest/${quest.id}` }
    : {
        title: words.title,
        body: words.withoutQuest,
        url: `/journey?category=${categoryId}`,
      };
}

/**
 * The three nudges, one per week. A quest in motion is the first and third; the places chosen in
 * onboarding take turns otherwise. Pure — scheduling is `scheduleWeeklyNudges`.
 */
export function composeWeeklyNudges(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  preferences: OnboardingPreferences | null;
}): Nudge[] {
  const { catalog, userQuests, preferences } = params;
  const places: OnboardingCategory[] = preferences?.categories.length
    ? preferences.categories
    : ['nature', 'adventure', 'social', 'relax'];

  const byId = new Map(catalog.map((q) => [q.id, q]));
  const inMotion = places
    .flatMap((p) => questsInMotionInCategory({ catalog, userQuests, categoryId: `cat-${p}` }))
    .concat(
      // In motion in a place they did not pick in onboarding still counts.
      userQuests.filter((uq) => uq.status === 'active')
    )
    .find((uq) => byId.has(uq.questId));

  const nudges: Nudge[] = [];
  let placeTurn = 0;
  for (let week = 1; week <= NUDGE_WEEKS; week += 1) {
    if (inMotion && week !== 2) {
      nudges.push(inMotionNudge(inMotion, byId.get(inMotion.questId)!));
    } else {
      nudges.push(placeNudge(places[placeTurn % places.length], catalog, userQuests, preferences));
      placeTurn += 1;
    }
  }
  return nudges;
}

export async function cancelWeeklyNudges(): Promise<void> {
  if (!supported) return;
  await Promise.all(
    Array.from({ length: NUDGE_WEEKS }, (_, i) =>
      Notifications.cancelScheduledNotificationAsync(nudgeId(i + 1)).catch(() => undefined)
    )
  );
}

/** Due times of quest-day and timer notifications already scheduled. */
async function otherNotificationTimes(): Promise<number[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all
    .map((n) => n.content.data as { kind?: unknown; at?: unknown } | undefined)
    .filter((d) => (d?.kind === 'quest-day' || d?.kind === 'timer') && typeof d.at === 'number')
    .map((d) => d!.at as number);
}

function weekFromNow(weeks: number, now: number): Date {
  const at = new Date(now + weeks * WEEK_MS);
  at.setHours(NUDGE_HOUR, 0, 0, 0);
  return at;
}

/**
 * Called whenever the app opens: replaces the nudges with fresh ones a week, two and three weeks
 * from now. Never asks for permission — that happens at the end of onboarding.
 */
export async function scheduleWeeklyNudges(params: {
  catalog: Quest[];
  userQuests: UserQuest[];
  preferences: OnboardingPreferences | null;
  now?: number;
}): Promise<void> {
  if (!supported) return;
  try {
    await cancelWeeklyNudges();
    if (!(await questDayRemindersOn())) return; // "Timers only"
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    if (params.catalog.length === 0) return;

    const now = params.now ?? Date.now();
    const others = await otherNotificationTimes();
    const nudges = composeWeeklyNudges(params);
    for (let week = 1; week <= NUDGE_WEEKS; week += 1) {
      const at = weekFromNow(week, now);
      // The app already speaks that week (a planned quest day, a timer): no nudge on top.
      if (others.some((t) => t > at.getTime() - WEEK_MS && t <= at.getTime())) continue;
      const nudge = nudges[week - 1];
      await Notifications.scheduleNotificationAsync({
        identifier: nudgeId(week),
        content: {
          title: nudge.title,
          body: nudge.body,
          data: { kind: 'nudge', url: nudge.url, at: at.getTime() },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // A missing nudge must never break anything else.
  }
}
