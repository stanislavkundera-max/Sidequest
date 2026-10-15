import { supabase } from '@/lib/supabase';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import {
  cacheNotificationIntensity,
  scheduleQuestDay,
} from '@/src/features/notifications/questNotifications';
import { findSavedQuestEventStart } from '@/src/features/quests/questCalendar';
import { scheduleWeeklyNudges } from '@/src/features/notifications/weeklyNudge';
import { getOnboardingState } from '@/src/features/onboarding';
import { resolvePendingCalendarLookups } from '@/src/features/quests/questRunnerPending';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { useUnavailableQuestStore } from '@/src/features/quests/unavailableQuests';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { getProfile } from '@/src/repositories/profilesRepository';
import { useSessionStore } from '@/stores/session';

/**
 * What the app does around sign-in, sign-out and coming back to the foreground — kept here so
 * `app/_layout.tsx` only says *when*, not *how*.
 */

/** Photo links are signed for 7 days at load (photoRepository); refetch well before they lapse. */
const PHOTO_LINKS_REFRESH_MS = 24 * 60 * 60 * 1000;

/**
 * A new session on this phone: bring the device-side copies in line with the account.
 *
 * The notification setting is read from the profile every time. It used to be cached only when
 * the Progress tab was opened, so a reinstall, or a setting changed elsewhere, left the phone
 * scheduling by the default until someone happened to open that tab (code review 2026-09-27).
 */
export function syncDeviceStateForUser(userId: string): void {
  void useUnavailableQuestStore.getState().load();
  resolveCalendarLookupsWhenReady(userId);
  getProfile(userId)
    .then((profile) => {
      if (!profile) return;
      const value =
        profile.notificationIntensity === 'chatty' ? 'occasional' : profile.notificationIntensity;
      return cacheNotificationIntensity(value, userId);
    })
    .catch((e: unknown) => logError('appLifecycle.syncNotificationIntensity', e, { userId }));
}

/** Signed out: in-memory copies of the last account's device state must not carry over. */
export function resetDeviceStateForSignOut(): void {
  useUnavailableQuestStore.getState().reset();
}

/**
 * The app came back to the foreground.
 *
 * - A catalogue that failed to load — typically no signal when the app started, the situation
 *   the app sends people into — is tried again. Before this, Journey said "Loading…" until the
 *   app was killed (code review 2026-09-27).
 * - Memories loaded more than a day ago are fetched again, so photo links stay fresh.
 * - A guest who confirmed their e-mail in the browser comes back to an account that is no
 *   longer anonymous; refreshing the session is how the app finds out.
 */
export function onAppForeground(userId: string): void {
  const quests = useQuestDomainStore.getState();
  if (!quests.loading && (quests.quests.length === 0 || quests.initializedForUserId !== userId)) {
    void quests.bootstrap(userId);
  }
  const memories = useMemoryStore.getState();
  const staleLinks =
    memories.loadedAt != null && Date.now() - memories.loadedAt > PHOTO_LINKS_REFRESH_MS;
  if (!memories.loading && (memories.error || staleLinks)) {
    void memories.refresh(userId);
  }
  resolveCalendarLookupsWhenReady(userId);
  const user = useSessionStore.getState().user;
  if (user?.is_anonymous && user.new_email) {
    supabase.auth
      .refreshSession()
      .catch((e: unknown) => logError('appLifecycle.refreshPendingAccount', e, { userId }));
  }
}

/**
 * Once this account's quests are loaded: reads back the days of calendar events saved from a quest
 * step (see `resolvePendingCalendarLookups`), then moves the weekly nudge a week on from now (see
 * `scheduleWeeklyNudges`) — every open does, so only a week away from the app brings one.
 */
let waitingForQuests: (() => void) | null = null;

function resolveCalendarLookupsWhenReady(userId: string): void {
  // One wait at a time: a load that keeps failing must not stack up a listener per foreground.
  waitingForQuests?.();
  waitingForQuests = null;

  const run = async () => {
    await resolvePendingCalendarLookups({
      isQuestActive: (userQuestId) => {
        const state = useQuestDomainStore.getState();
        if (state.initializedForUserId !== userId || state.loading) return undefined;
        return state.userQuests.some((uq) => uq.id === userQuestId && uq.status === 'active');
      },
      findEventStart: (title) => findSavedQuestEventStart(title),
      scheduleQuestDay,
    }).catch((e: unknown) => logError('appLifecycle.calendarLookups', e, { userId }));
    // After the lookups, so a quest day they just scheduled keeps that week free of a nudge.
    const { quests, userQuests } = useQuestDomainStore.getState();
    const onboarding = await getOnboardingState().catch(() => null);
    await scheduleWeeklyNudges({
      catalog: quests,
      userQuests,
      preferences: onboarding?.preferences ?? null,
    });
  };

  const ready = () => {
    const state = useQuestDomainStore.getState();
    return state.initializedForUserId === userId && !state.loading;
  };
  if (ready()) {
    void run();
    return;
  }
  const unsubscribe = useQuestDomainStore.subscribe(() => {
    if (useSessionStore.getState().user?.id !== userId) {
      stop();
      return;
    }
    if (!ready()) return;
    stop();
    void run();
  });
  const stop = () => {
    unsubscribe();
    if (waitingForQuests === stop) waitingForQuests = null;
  };
  waitingForQuests = stop;
}
