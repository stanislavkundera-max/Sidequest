import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PausedAndLikedSections } from '@/components/journey/PausedAndLikedSections';
import { ActivityCalendar, useDaysOutThisMonth } from '@/components/progress/ActivityCalendar';
import { PlacesOnMap } from '@/components/progress/PlacesOnMap';
import { ScienceNote } from '@/components/progress/ScienceNote';
import { PathFullModal } from '@/components/quests/PathFullModal';
import { useQuestActions } from '@/components/quests/useQuestActions';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dawn, Theme } from '@/constants/Theme';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { useSessionStore } from '@/stores/session';

/** The sunrise over the hills (canvas screen 34), 390 × 224. */
const HEADER = require('@/assets/images/dawn/journey-header.png');
const HEADER_ASPECT = 224 / 390;

/**
 * Progress tab, ordered by how often each part is used (Standa, 2026-10-22): the cairn and three
 * counts, then what you can pick up again and what you liked, the month, why this works, and
 * your places. Account, the two questions and notifications moved to Settings (gear, top right);
 * the finished quests are behind the "stones" tile.
 */
export function ProgressOverview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useSessionStore((s) => s.user);
  const loadingQuests = useQuestDomainStore((s) => s.loading);
  const questError = useQuestDomainStore((s) => s.error);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const catalogFailed = useQuestDomainStore((s) => s.catalogFailed);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const memoryCount = useMemoryStore((s) => s.memories.length);
  const daysOut = useDaysOutThisMonth().size;
  // Called unconditionally (rules of hooks) — harmless with an empty userId;
  // this screen only renders past sign-in anyway.
  const actions = useQuestActions(user?.id ?? '', 'progress');

  const stones = useMemo(() => userQuests.filter((uq) => uq.status === 'completed').length, [userQuests]);
  const headerHeight = Math.round(width * HEADER_ASPECT) + Math.max(0, insets.top - 24);

  useFocusEffect(
    useCallback(() => {
      trackEvent('profile_viewed', { sourceScreen: 'profile_tab' }).catch(() => undefined);
    }, [])
  );

  return (
    <DawnBackground>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ height: headerHeight }}>
          <Image source={HEADER} style={[styles.headerImage, { height: headerHeight }]} resizeMode="cover" accessible={false} />
          {/* Your cairn on the hill — orange everywhere in Dawn. */}
          <View style={styles.cairn} accessible={false}>
            <View style={[styles.stone, { width: 15, height: 10 }]} />
            <View style={[styles.stone, { width: 24, height: 12, marginLeft: -3 }]} />
            <View style={[styles.stone, { width: 33, height: 13, marginLeft: 3 }]} />
            <View style={[styles.stone, { width: 43, height: 16 }]} />
          </View>
          <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 24) + 16 }]}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Your cairn</Text>
              <Text style={styles.title} accessibilityRole="header">
                Progress
              </Text>
              <Text style={styles.sub}>a stone for every quest you finished</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/settings' as never)}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => [styles.gear, pressed && styles.pressed]}>
              <Ionicons name="options-outline" size={20} color={Theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.stats}>
            <View style={styles.tile}>
              <Text style={styles.tileNum}>{memoryCount}</Text>
              <Text style={styles.tileLabel}>{memoryCount === 1 ? 'memory kept' : 'memories kept'}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileNum}>{daysOut}</Text>
              <Text style={styles.tileLabel}>{daysOut === 1 ? 'day out' : 'days out'} this month</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/stones' as never)}
              accessibilityRole="button"
              accessibilityLabel={`${stones} stones. See every finished quest`}
              style={({ pressed }) => [styles.tile, styles.tileLink, pressed && styles.pressed]}>
              <View style={styles.tileLinkText}>
                <Text style={[styles.tileNum, styles.tileLinkInk]}>{stones}</Text>
                <Text style={[styles.tileLabel, styles.tileLinkInk]}>{stones === 1 ? 'stone' : 'stones'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Dawn.secondaryBorder} />
            </Pressable>
          </View>

          {loadingQuests ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Theme.accent} />
              <Text style={styles.muted}>Refreshing…</Text>
            </View>
          ) : null}

          {questError ? (
            <View style={styles.errorWrap}>
              <ErrorState
                message={questError}
                // When the whole load failed, refreshing only the user's quests left the catalogue
                // empty; load everything again instead.
                onRetry={
                  user
                    ? () => void (catalogFailed ? bootstrap(user.id) : refreshUserQuests(user.id))
                    : undefined
                }
              />
            </View>
          ) : null}

          {!loadingQuests ? <PausedAndLikedSections actions={actions} /> : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              {new Date().toLocaleDateString(undefined, { month: 'long' })}
            </Text>
            <Text style={styles.sectionHint}>Days you did something</Text>
          </View>
          <ActivityCalendar />

          <View style={styles.gap}>
            <ScienceNote />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Places on your map</Text>
          </View>
          <PlacesOnMap />
        </View>
      </ScrollView>
      <PathFullModal
        visible={actions.pathFullOpen}
        activeForModal={actions.activeForModal}
        waitingUserQuestId={actions.waitingUserQuestId}
        getQuestById={actions.getQuestById}
        onLetWait={(id) => void actions.onLetWait(id)}
        onClose={actions.closePathFull}
      />
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  headerImage: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },
  cairn: { position: 'absolute', alignSelf: 'center', bottom: 34, alignItems: 'center', gap: 1 },
  stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20 },
  headerText: { flex: 1 },
  kicker: { fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.accent },
  title: { fontSize: 38, lineHeight: 44, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.8, color: Theme.text },
  sub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 250, 240, 0.92)',
    textShadowColor: 'rgba(40, 30, 40, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 25, 16, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(243, 242, 236, 0.22)',
  },
  body: { paddingHorizontal: 20, marginTop: -14 },
  stats: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    boxShadow: '0 6px 16px rgba(20, 18, 10, 0.25)',
  },
  // The one tile that opens something: it wears the secondary-button outline and a chevron.
  tileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Dawn.secondaryFill,
    borderColor: Dawn.secondaryBorder,
    borderWidth: 1.5,
    paddingRight: 8,
  },
  tileLinkText: { flex: 1 },
  tileLinkInk: { color: Dawn.secondaryText },
  tileNum: { fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  tileLabel: { fontSize: 12, lineHeight: 15, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10, marginHorizontal: 2 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  gap: { marginTop: 10 },
  errorWrap: { marginTop: 16 },
  muted: { color: Theme.textMuted, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  pressed: { opacity: 0.85 },
});
