import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { resetOnboardingComplete } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';
import { getAdminPreviewAsUser, setAdminPreviewAsUser } from '@/src/features/admin/adminPreview';
import { isAdminEmail } from '@/src/constants/admin';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

/**
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

  const email = user?.email ?? null;
  const admin = isAdminEmail(email);

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

  function togglePreview(next: boolean) {
    setPreviewAsUser(next);
    void setAdminPreviewAsUser(next);
  }

  function signOut() {
    alertTwoChoice('Sign out?', 'You can sign back in anytime.', {
      cancel: { text: 'Stay signed in' },
      confirm: {
        text: 'Sign out',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await supabase.auth.signOut();
              router.replace('/(auth)/sign-in');
            } catch (e: unknown) {
              logError('account.signOut', e);
              alertCompat('Error', e instanceof Error ? e.message : 'Could not sign out.');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
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
                  'Error',
                  e instanceof Error ? e.message : 'Could not restart onboarding.'
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
                  'Error',
                  e instanceof Error ? e.message : 'Could not delete all progress.'
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
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="person-circle-outline" size={20} color={Theme.textMuted} />
        <Text style={styles.email} numberOfLines={1}>
          {email ?? 'Anonymous session'}
        </Text>
      </View>

      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit preferences"
            onPress={() => router.push('/onboarding?edit=1')}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={14} color={Theme.text} />
            <Text style={styles.editBtnText}>Edit preferences</Text>
          </Pressable>
          {showAdminTools ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Preview as a regular user"
                onPress={() => togglePreview(true)}
                style={({ pressed }) => [styles.adminBtn, pressed && styles.pressed]}>
                <Ionicons name="eye-outline" size={14} color={Theme.accent} />
                <Text style={styles.adminBtnText}>Preview as user</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Redo onboarding"
                onPress={redoOnboarding}
                style={({ pressed }) => [styles.adminBtn, pressed && styles.pressed]}>
                <Ionicons name="refresh-outline" size={14} color={Theme.accent} />
                <Text style={styles.adminBtnText}>Redo onboarding</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete all progress"
                onPress={deleteAllProgress}
                style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}>
                <Ionicons name="trash-outline" size={14} color={Theme.danger} />
                <Text style={styles.dangerBtnText}>Delete all progress</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={signOut}
            style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}>
            <Text style={styles.signOutBtnText}>Sign out</Text>
          </Pressable>
        </View>
      )}

      {admin && previewAsUser ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit admin preview"
          onPress={() => togglePreview(false)}
          style={({ pressed }) => [styles.exitPreviewLink, pressed && styles.pressed]}>
          <Text style={styles.exitPreviewLinkText}>Admin preview mode · Exit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    padding: 14,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { flex: 1, fontSize: 14, fontWeight: '600', color: Theme.text },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  busyRow: { alignItems: 'center', paddingVertical: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.bg,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: Theme.text },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  adminBtnText: { fontSize: 13, fontWeight: '700', color: Theme.accent },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.danger,
    backgroundColor: '#fdecea',
  },
  dangerBtnText: { fontSize: 13, fontWeight: '700', color: Theme.danger },
  signOutBtn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.bg,
  },
  signOutBtnText: { fontSize: 13, fontWeight: '700', color: Theme.textMuted },
  exitPreviewLink: { alignSelf: 'flex-start', paddingVertical: 2 },
  exitPreviewLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.textMuted,
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.85 },
});
