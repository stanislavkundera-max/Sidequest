import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { getProfile } from '@/src/repositories/profilesRepository';
import { useSessionStore } from '@/stores/session';

const REASK_AFTER_DAYS = 90;

/** Nudges a re-answer of the nature-connection/isolation baseline scales
 * after ~3 months, so drift over time is actually captured (round-1 plan
 * item: "3-month re-ask of the onboarding question"). */
export function BaselineReaskBanner() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [due, setDue] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getProfile(user.id)
      .then((profile) => {
        if (!alive || !profile?.onboardingCompleted) return;
        const ageMs = Date.now() - new Date(profile.baselineUpdatedAt).getTime();
        const ageDays = ageMs / (24 * 60 * 60 * 1000);
        if (ageDays >= REASK_AFTER_DAYS) setDue(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  if (!due || dismissed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={18} color={Theme.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Still feeling the same way?</Text>
        <Text style={styles.text}>
          It has been a few months since your nature-connection and isolation answers — worth a
          quick refresh.
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Update baseline answers"
            onPress={() => router.push('/onboarding?edit=1')}
            style={({ pressed }) => [styles.updateBtn, pressed && styles.pressed]}>
            <Text style={styles.updateBtnText}>Update</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => setDismissed(true)}
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}>
            <Text style={styles.dismissBtnText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    padding: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.accentSoft,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  text: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, color: Theme.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  updateBtn: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: Theme.accent,
  },
  updateBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#fff' },
  dismissBtn: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  dismissBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.textMuted },
  pressed: { opacity: 0.85 },
});
