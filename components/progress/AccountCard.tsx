import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { resetOnboardingComplete } from '@/lib/onboarding';
import { plainErrorMessage } from '@/lib/userFacingError';
import { supabase } from '@/lib/supabase';
import { deleteOwnAccount } from '@/src/repositories/accountRepository';
import { getAdminPreviewAsUser, setAdminPreviewAsUser } from '@/src/features/admin/adminPreview';
import { isAdminEmail } from '@/src/constants/admin';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { logError } from '@/src/lib/monitoring/errorLogger';
import {
  getProfile,
  updateNotificationIntensity,
  type NotificationIntensity,
} from '@/src/repositories/profilesRepository';
import {
  askNotificationAccess,
  cacheNotificationIntensity,
  cancelQuestDayNotifications,
  notificationAccessState,
} from '@/src/features/notifications/questNotifications';
import { cancelWeeklyNudges } from '@/src/features/notifications/weeklyNudge';
import { useSessionStore } from '@/stores/session';

// Named by what arrives, not by a volume; 'chatty' is not offered and behaves like 'occasional'.
// "Everything" is the default and includes the weekly nudge (task 53) — spelled out below the pills.
const NOTIFICATION_OPTIONS: { value: NotificationIntensity; label: string }[] = [
  { value: 'quiet', label: 'Timers only' },
  { value: 'occasional', label: 'Everything' },
];


/** The re-ask of the two baseline questions is due ~3 months after they were last answered. */
const REASK_AFTER_DAYS = 90;

/**
 * Settings (redesign screen 35) — its own screen now, opened from the gear on Progress. It was a
 * fold-out block at the top of Progress. Grouped by use: account, you, notifications, about, then
 * leaving; admin tools last. "Still feeling the same way?" became the "Your two questions" row
 * (it shows, with DUE, once the re-ask is due) and Send feedback opens the feedback sheet (39).
 *
 * Account controls.
 * - Everyone: sign out, edit onboarding preferences.
 * - Admin email only: redo onboarding, delete all progress, and a
 *   "preview as regular user" toggle that hides these admin tools so the
 *   admin can see exactly what a non-admin sees.
 */
export function AccountCard() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const deleteAllQuestProgress = useQuestDomainStore((s) => s.deleteAllProgress);
  const deleteAllMemories = useMemoryStore((s) => s.deleteAllMemories);
  const [busy, setBusy] = useState(false);
  const [previewAsUser, setPreviewAsUser] = useState(false);
  const [notificationIntensity, setNotificationIntensity] =
    useState<NotificationIntensity | null>(null);
  const [notificationBusy, setNotificationBusy] = useState(false);
  // Whether the phone lets the app notify at all. Anyone onboarded before the weekly nudge
  // (2026-10-15) was never asked unless a timer or calendar step asked them — "Everything" would
  // then quietly send nothing (code review follow-up, 2026-10-17). Re-read when the app comes back,
  // since the fix for "blocked" is in the phone's settings.
  const [notificationAccess, setNotificationAccess] = useState<
    'granted' | 'ask' | 'blocked' | 'unsupported'
  >('unsupported');
  useEffect(() => {
    let alive = true;
    const read = () =>
      void notificationAccessState().then((state) => {
        if (alive) setNotificationAccess(state);
      });
    read();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') read();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  async function allowNotifications() {
    if (notificationAccess === 'blocked') {
      void Linking.openSettings();
      return;
    }
    await askNotificationAccess();
    setNotificationAccess(await notificationAccessState());
  }

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [baselineDue, setBaselineDue] = useState(false);

  const email = user?.email ?? null;
  const admin = isAdminEmail(email);
  // Everyone starts as a guest (app/index.tsx). A guest has nothing to sign back in to.
  const isGuest = Boolean(user?.is_anonymous);
  const pendingEmail = isGuest ? (user?.new_email ?? null) : null;

  useEffect(() => {
    if (!admin) return;
    let alive = true;
    getAdminPreviewAsUser().then((v) => {
      if (alive) setPreviewAsUser(v);
    });
    return () => {
      alive = false;
    };
  }, [admin]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getProfile(user.id)
      .then((profile) => {
        if (alive && profile) {
          const value = profile.notificationIntensity === 'chatty' ? 'occasional' : profile.notificationIntensity;
          setNotificationIntensity(value);
          void cacheNotificationIntensity(value);
          if (profile.onboardingCompleted) {
            const ageDays = (Date.now() - new Date(profile.baselineUpdatedAt).getTime()) / 86_400_000;
            setBaselineDue(ageDays >= REASK_AFTER_DAYS);
          }
        }
      })
      .catch((e: unknown) => {
        logError('account.loadNotificationIntensity', e, { userId: user.id });
      });
    return () => {
      alive = false;
    };
  }, [user]);

  function changeNotificationIntensity(value: NotificationIntensity) {
    if (!user || value === notificationIntensity) return;
    const previous = notificationIntensity;
    setNotificationIntensity(value);
    void cacheNotificationIntensity(value);
    if (value === 'quiet') {
      void cancelQuestDayNotifications();
      void cancelWeeklyNudges();
    }
    setNotificationBusy(true);
    void updateNotificationIntensity(user.id, value)
      .catch((e: unknown) => {
        setNotificationIntensity(previous);
        if (previous) void cacheNotificationIntensity(previous);
        logError('account.updateNotificationIntensity', e, { userId: user.id });
        alertCompat(
          "Couldn't save that",
          plainErrorMessage(e, "Your notification setting did not change. Try again in a moment.")
        );
      })
      .finally(() => setNotificationBusy(false));
  }

  function togglePreview(next: boolean) {
    setPreviewAsUser(next);
    void setAdminPreviewAsUser(next);
  }

  function performSignOut() {
    void (async () => {
      setBusy(true);
      try {
        await supabase.auth.signOut();
        router.replace('/(auth)/sign-in');
      } catch (e: unknown) {
        logError('account.signOut', e);
        alertCompat("That didn't go through", plainErrorMessage(e, "Couldn't sign you out. Try again in a moment."));
      } finally {
        setBusy(false);
      }
    })();
  }

  function signOut() {
    if (isGuest) {
      // It said "You can sign back in anytime." to guests, who can't: there is no e-mail or
      // password behind a guest, so signing out threw away every quest and memory for good
      // (code review 2026-09-27). The way out that keeps everything comes first.
      alertTwoChoice(
        'Sign out and lose everything?',
        "If you don't want to lose your quests and memories, create an account first — everything you have done stays in it. You are using the app as a guest, so after signing out there is nothing to sign back in to.",
        {
          cancel: { text: 'Create an account', onPress: () => router.push('/account/save' as never) },
          confirm: { text: 'Sign out and lose it', onPress: performSignOut },
        }
      );
      return;
    }
    alertTwoChoice('Sign out?', 'You can sign back in anytime.', {
      cancel: { text: 'Stay signed in' },
      confirm: { text: 'Sign out', onPress: performSignOut },
    });
  }

  function redoOnboarding() {
    alertTwoChoice(
      'Redo onboarding?',
      'You will be asked the onboarding questions again and your preferences update once you finish. Existing quests and memories are not affected.',
      {
        cancel: { text: 'Not now' },
        confirm: {
          text: 'Start onboarding',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await resetOnboardingComplete();
                router.replace('/onboarding');
              } catch (e: unknown) {
                logError('account.redoOnboarding', e);
                alertCompat(
                  "That didn't go through",
                  plainErrorMessage(e, "Couldn't restart onboarding. Try again in a moment.")
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      }
    );
  }

  function deleteAllProgress() {
    if (!user) return;
    alertTwoChoice(
      'Delete ALL progress?',
      'This permanently deletes every active, saved, and completed quest and every memory, and resets onboarding so it runs again. This cannot be undone.',
      {
        cancel: { text: 'Cancel' },
        confirm: {
          text: 'Delete everything',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await Promise.all([
                  deleteAllQuestProgress(user.id),
                  deleteAllMemories(user.id),
                ]);
                await resetOnboardingComplete();
                alertCompat('Done', 'All progress was deleted and onboarding was reset.');
              } catch (e: unknown) {
                logError('account.deleteAllProgress', e, { userId: user.id });
                alertCompat(
                  "That didn't go through",
                  plainErrorMessage(e, "Couldn't delete your progress. Try again in a moment.")
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      }
    );
  }

  function deleteAccount() {
    if (!user) return;
    alertTwoChoice(
      'Delete your account?',
      'This permanently deletes your account, quests, and memories. Unlike "Delete all progress," there is no undo and no restarting onboarding afterward — the account itself is gone.',
      {
        cancel: { text: 'Cancel' },
        confirm: {
          text: 'Delete account',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await deleteOwnAccount();
                await supabase.auth.signOut();
                router.replace('/(auth)/sign-in');
              } catch (e: unknown) {
                logError('account.deleteAccount', e, { userId: user.id });
                alertCompat(
                  "That didn't go through",
                  plainErrorMessage(e, "Couldn't delete your account. Nothing was deleted. Try again in a moment.")
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      }
    );
  }

  const showAdminTools = admin && !previewAsUser;

  return (
    <View style={styles.root}>
      {/* ACCOUNT */}
      <Text style={styles.groupTitle}>ACCOUNT</Text>
      <View style={[styles.group, styles.groupPadded]}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={20} color="#e6dfca" />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountTitle} numberOfLines={1}>
              {isGuest ? 'Guest — no account yet' : (email ?? 'Signed in')}
            </Text>
            {isGuest ? (
              <Text style={styles.accountHint}>
                {pendingEmail
                  ? `Almost there: confirm ${pendingEmail} from the e-mail we sent, then choose a password.`
                  : 'Everything lives on this phone. An account keeps it if you get a new one.'}
              </Text>
            ) : null}
          </View>
        </View>
        {isGuest ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pendingEmail ? 'Finish creating your account' : 'Create an account'}
            onPress={() => router.push('/account/save' as never)}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <Text style={styles.primaryBtnText}>{pendingEmail ? 'Finish creating your account' : 'Create an account'}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* YOU */}
      <Text style={styles.groupTitle}>YOU</Text>
      <View style={styles.group}>
        {baselineDue ? (
          <SettingsRow
            icon="help-circle-outline"
            label="Your two questions"
            hint="A few months since you answered — answer again to compare"
            tag="DUE"
            onPress={() => router.push('/onboarding?edit=1')}
          />
        ) : null}
        <SettingsRow
          icon="options-outline"
          label="Edit my answers"
          hint="What brings you here, how bold"
          onPress={() => router.push('/onboarding?edit=1')}
        />
        <SettingsRow
          icon="chatbox-ellipses-outline"
          label="Send feedback"
          hint="An idea, something broken, a quest that missed"
          tag="NEW"
          last
          onPress={() => setFeedbackOpen(true)}
        />
      </View>

      {/* NOTIFICATIONS */}
      {notificationIntensity ? (
        <>
          <Text style={styles.groupTitle}>NOTIFICATIONS</Text>
          <View style={[styles.group, styles.groupPadded]}>
            <View style={styles.segment}>
              {NOTIFICATION_OPTIONS.map((opt) => {
                const selected = opt.value === notificationIntensity;
                return (
                  <Pressable
                    key={opt.value}
                    disabled={notificationBusy}
                    accessibilityRole="button"
                    accessibilityLabel={`Notifications: ${opt.label}`}
                    accessibilityState={{ selected }}
                    onPress={() => changeNotificationIntensity(opt.value)}
                    style={({ pressed }) => [
                      styles.segmentPill,
                      selected && styles.segmentPillOn,
                      pressed && !notificationBusy && styles.pressed,
                      notificationBusy && styles.disabled,
                    ]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.notificationHint}>
              {notificationIntensity === 'quiet'
                ? 'Only when a step timer ends.'
                : "When a step timer ends, the day before a quest you planned, and an idea for a quest if you haven't opened the app for a week."}
            </Text>
            {notificationAccess === 'ask' || notificationAccess === 'blocked' ? (
              <View style={styles.allowRow}>
                <Ionicons name="notifications-off-outline" size={18} color={Theme.danger} />
                <Text style={styles.allowText}>
                  {notificationAccess === 'blocked' ? 'Turned off for this app on your phone.' : 'Your phone blocks them for now.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    notificationAccess === 'blocked' ? 'Open phone settings to allow notifications' : 'Allow notifications'
                  }
                  onPress={() => void allowNotifications()}
                  style={({ pressed }) => [styles.allowBtn, pressed && styles.pressed]}>
                  <Text style={styles.allowBtnText}>{notificationAccess === 'blocked' ? 'Settings' : 'Allow'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {/* ABOUT */}
      <Text style={styles.groupTitle}>ABOUT</Text>
      <View style={styles.group}>
        <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
        <SettingsRow icon="document-text-outline" label="Terms of Service" last onPress={() => router.push('/legal/terms')} />
      </View>

      {/* LEAVE */}
      <View style={[styles.group, styles.groupGap]}>
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={Theme.accent} />
          </View>
        ) : (
          <>
            <SettingsRow icon="log-out-outline" label="Sign out" iconColor="#e6dfca" noChevron onPress={signOut} />
            <SettingsRow
              icon="trash-outline"
              label="Delete account"
              danger
              last
              noChevron
              onPress={deleteAccount}
            />
          </>
        )}
      </View>

      {/* ADMIN */}
      {showAdminTools ? (
        <View style={styles.admin}>
          <Text style={styles.adminTitle}>ADMIN — ONLY YOU SEE THIS</Text>
          <View style={styles.adminRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview as a regular user"
              onPress={() => togglePreview(true)}
              style={({ pressed }) => [styles.adminBtn, pressed && styles.pressed]}>
              <Text style={styles.adminBtnText}>Preview as user</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Redo onboarding"
              onPress={redoOnboarding}
              style={({ pressed }) => [styles.adminBtn, pressed && styles.pressed]}>
              <Text style={styles.adminBtnText}>Redo onboarding</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete all progress"
              onPress={deleteAllProgress}
              style={({ pressed }) => [styles.adminBtn, styles.adminBtnDanger, pressed && styles.pressed]}>
              <Text style={[styles.adminBtnText, styles.adminBtnDangerText]}>Delete all progress</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {admin && previewAsUser ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit admin preview"
          onPress={() => togglePreview(false)}
          style={({ pressed }) => [styles.exitPreview, pressed && styles.pressed]}>
          <Text style={styles.exitPreviewText}>Admin preview mode · Exit</Text>
        </Pressable>
      ) : null}

      <Text style={styles.version}>Side Quest Life · version {Constants.expoConfig?.version ?? ''}</Text>

      <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} source="settings" />
    </View>
  );
}

/** One row of a settings group: an icon in a soft peach square, a label, an optional hint and tag. */
function SettingsRow({
  icon,
  label,
  hint,
  tag,
  last = false,
  danger = false,
  noChevron = false,
  iconColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  tag?: string;
  last?: boolean;
  danger?: boolean;
  noChevron?: boolean;
  iconColor?: string;
  onPress: () => void;
}) {
  const ink = danger ? Theme.danger : Theme.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      style={({ pressed }) => [styles.rowItem, !last && styles.rowDivider, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={danger ? Theme.danger : (iconColor ?? Theme.accent)} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: ink }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
      {noChevron ? null : <Ionicons name="chevron-forward" size={16} color="#bfb69c" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingBottom: 32 },
  groupTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Theme.textMuted,
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  group: {
    borderRadius: 20,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.22)',
    paddingHorizontal: 16,
  },
  groupPadded: { paddingVertical: 14 },
  groupGap: { marginTop: 22 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 234, 214, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: { flex: 1, minWidth: 0 },
  accountTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  accountHint: { marginTop: 2, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  primaryBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: Dawn.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
  rowItem: { minHeight: 58, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(246, 234, 214, 0.14)' },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(240, 178, 122, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  rowHint: { marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  tag: { backgroundColor: Theme.accent, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.6, color: Theme.onAccent },
  segment: {
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(27, 25, 16, 0.45)',
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentPill: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segmentPillOn: { backgroundColor: Theme.accent },
  segmentText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
  segmentTextOn: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.onAccent },
  notificationHint: { marginTop: 10, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  allowRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 234, 214, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allowText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', color: '#f0d2c8' },
  allowBtn: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: Dawn.primaryFill, justifyContent: 'center' },
  allowBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
  busyRow: { alignItems: 'center', paddingVertical: 18 },
  admin: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(243, 242, 236, 0.22)',
    padding: 14,
  },
  adminTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.4, color: '#bfb69c' },
  adminRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  adminBtn: {
    minHeight: MIN_TOUCH_TARGET - 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(243, 242, 236, 0.22)',
    justifyContent: 'center',
  },
  adminBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
  adminBtnDanger: { borderColor: Theme.dangerBorder },
  adminBtnDangerText: { color: Theme.danger },
  exitPreview: { marginTop: 12, alignSelf: 'center', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  exitPreviewText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.accent },
  version: { marginTop: 22, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', color: '#a39a80' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
