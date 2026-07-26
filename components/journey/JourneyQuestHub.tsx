import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Theme } from '@/constants/Theme';
import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { alertCompat } from '@/lib/alertCompat';
import { journeyBackgroundForTimeframe } from '@/src/features/journey/journeyTimeframeBackground';
import { questDurationLabel, QUEST_COPY } from '@/src/features/quests/questCopy';
import { activeQuestResumePath } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest, UserQuest } from '@/src/types/quest';

const TIMEFRAME_ORDER: Quest['timeframe'][] = ['weekly', 'monthly', 'yearly'];
const HERO_EMPTY_H = 200;

type LikedRow = { key: string; uq: UserQuest };

type Props = {
  userId: string;
  hubHeight?: number;
};

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
}

function rowShort(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotShort?.trim() || quest?.shortDescription || '';
}

function rowCategoryId(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotCategoryId || quest?.categoryId || '';
}

function categoryLabel(categoryId: string): string {
  return useQuestDomainStore.getState().categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function timeframeDiscoverHeading(tf: Quest['timeframe']): string {
  switch (tf) {
    case 'weekly':
      return QUEST_COPY.discoverTimeframeWeekly;
    case 'monthly':
      return QUEST_COPY.discoverTimeframeMonthly;
    default:
      return QUEST_COPY.discoverTimeframeYearly;
  }
}

const TF_META: Record<Quest['timeframe'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function questMetaLine(q: Quest): string {
  return [TF_META[q.timeframe], questDurationLabel(q.estimatedDurationMinutes)]
    .filter(Boolean)
    .join(' · ');
}

export function JourneyQuestHub({ userId, hubHeight = 560 }: Props) {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const [hubW, setHubW] = useState(0);
  const pageW = Math.max(1, hubW > 0 ? hubW : Math.round(winW));

  const likedH = Math.max(168, Math.round(hubHeight * 0.32));

  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const pending = useQuestDomainStore((s) => s.pending);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);
  const saveQuestForLater = useQuestDomainStore((s) => s.saveQuestForLater);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pathFullOpen, setPathFullOpen] = useState(false);
  const [likedInfoOpen, setLikedInfoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingActivationRef = useRef<string | null>(null);

  const categoryIds = useMemo(() => {
    const withQuests = new Set(quests.map((q) => q.categoryId));
    return categories.filter((c) => withQuests.has(c.id)).map((c) => c.id);
  }, [categories, quests]);

  const activeCategoryId =
    selectedCategoryId && categoryIds.includes(selectedCategoryId)
      ? selectedCategoryId
      : (categoryIds[0] ?? null);

  const questsByTimeframe = useMemo(() => {
    const buckets: Record<Quest['timeframe'], Quest[]> = {
      weekly: [],
      monthly: [],
      yearly: [],
    };
    if (!activeCategoryId) return buckets;
    for (const q of quests) {
      if (q.categoryId !== activeCategoryId) continue;
      buckets[q.timeframe].push(q);
    }
    for (const tf of TIMEFRAME_ORDER) {
      buckets[tf].sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes);
    }
    return buckets;
  }, [activeCategoryId, quests]);

  const categoryQuestTotal = useMemo(() => {
    if (!activeCategoryId) return 0;
    return TIMEFRAME_ORDER.reduce((n, tf) => n + questsByTimeframe[tf].length, 0);
  }, [activeCategoryId, questsByTimeframe]);

  const likedList = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'saved_for_later')
        .sort((a, b) => (b.savedAt ?? b.startedAt).localeCompare(a.savedAt ?? a.startedAt)),
    [userQuests]
  );

  const likedRows: LikedRow[] = useMemo(
    () => likedList.map((uq) => ({ key: uq.id, uq })),
    [likedList]
  );
  const activeForModal = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'active')
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    [userQuests]
  );
  const primaryBusy = pending || busy;

  const onHubLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0) setHubW((prev) => (prev === w ? prev : w));
  }, []);

  const openPathFull = useCallback((questId: string) => {
    pendingActivationRef.current = questId;
    setPathFullOpen(true);
  }, []);

  const runActivate = useCallback(
    async (questId: string, afterNavigate?: string) => {
      setBusy(true);
      try {
        const r = await assignQuestToUser(userId, questId);
        if (r.ok) {
          await refreshUserQuests(userId);
          setPathFullOpen(false);
          pendingActivationRef.current = null;
          if (afterNavigate) router.push(afterNavigate as never);
          return;
        }
        if (r.reason === 'active_path_full') {
          openPathFull(questId);
          return;
        }
        if (r.reason === 'already_active') {
          alertCompat('Already in motion', 'This one is already active.');
          return;
        }
        alertCompat('Cannot add', 'This quest is not available right now.');
      } finally {
        setBusy(false);
      }
    },
    [assignQuestToUser, openPathFull, refreshUserQuests, router, userId]
  );

  const onStartNow = useCallback(
    async (questId: string) => {
      const quest = getQuestById(questId);
      if (!quest) return;
      const existing = userQuests.find((uq) => uq.questId === questId && uq.status === 'active');
      if (existing) {
        router.push(activeQuestResumePath(quest, existing) as never);
        return;
      }
      await runActivate(questId, `/quest/run/${questId}`);
    },
    [getQuestById, router, runActivate, userQuests]
  );

  const onLike = useCallback(
    async (questId: string) => {
      setBusy(true);
      try {
        const r = await saveQuestForLater(userId, questId);
        if (!r.ok) {
          alertCompat('Could not save', r.reason);
          return;
        }
        await refreshUserQuests(userId);
      } finally {
        setBusy(false);
      }
    },
    [refreshUserQuests, saveQuestForLater, userId]
  );

  const onLetWait = useCallback(
    async (userQuestId: string) => {
      setBusy(true);
      try {
        const r = await deactivateQuest(userId, userQuestId);
        if (!r.ok) {
          alertCompat('Could not update', 'Try again in a moment.');
          return;
        }
        await refreshUserQuests(userId);
        const nextPending = pendingActivationRef.current;
        if (nextPending) {
          await runActivate(nextPending);
        } else {
          setPathFullOpen(false);
        }
      } finally {
        setBusy(false);
      }
    },
    [deactivateQuest, refreshUserQuests, runActivate, userId]
  );

  const renderLiked = useCallback(
    ({ item }: { item: LikedRow }) => {
      const uq = item.uq;
      const q = getQuestById(uq.questId);
      const accent = categoryAccentForCategoryId(rowCategoryId(uq, q));
      return (
        <Pressable
          style={{ width: pageW, minHeight: likedH, paddingHorizontal: 16, justifyContent: 'center' }}
          onPress={() => router.push(`/quest/${uq.questId}` as never)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${rowTitle(uq, q)}`}>
          <View style={styles.likedCompactRow}>
            {uq.photoUri ? (
              <Image source={{ uri: uq.photoUri }} style={styles.likedThumb} resizeMode="cover" />
            ) : null}
            <View style={[styles.discoverQuestAccent, { backgroundColor: accent }]} />
            <View style={styles.likedCompactBody}>
              <Text style={styles.questRowMeta}>{categoryLabel(rowCategoryId(uq, q))}</Text>
              <Text style={styles.questRowTitle} numberOfLines={2}>
                {rowTitle(uq, q)}
              </Text>
              <Text style={styles.questRowSub} numberOfLines={2}>
                {rowShort(uq, q)}
              </Text>
              <View style={styles.questRowActions}>
                <Pressable
                  disabled={primaryBusy}
                  onPress={() => void onStartNow(uq.questId)}
                  style={({ pressed }) => [
                    styles.btnSubtleSolid,
                    pressed && !primaryBusy && styles.pressed,
                    primaryBusy && styles.disabled,
                  ]}>
                  <Text style={styles.btnSubtleSolidText}>{QUEST_COPY.startNow}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [getQuestById, likedH, onStartNow, pageW, primaryBusy, router]
  );

  return (
    <View style={styles.root} onLayout={onHubLayout}>
      <View style={styles.sectionHead}>
        <Ionicons name="sparkles-outline" size={16} color={Theme.accent} />
        <Text style={styles.sectionHeadText}>{QUEST_COPY.chooseCategoryTitle}</Text>
      </View>
      <View style={styles.chipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}>
          {categoryIds.map((id) => {
            const selected = id === activeCategoryId;
            return (
              <Pressable
                key={id}
                onPress={() => setSelectedCategoryId(id)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{categoryLabel(id)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={() => setLikedInfoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${QUEST_COPY.forLaterSectionTitle}. ${QUEST_COPY.openLikedHint}`}
          style={({ pressed }) => [styles.chipHeartWrap, pressed && styles.pressed]}>
          <Ionicons name="heart-outline" size={22} color={Theme.accent} />
        </Pressable>
      </View>

      <View style={styles.discoverBlock}>
        {!activeCategoryId ? (
          <View style={[styles.heroCard, { height: HERO_EMPTY_H }]}>
            <View style={[styles.heroSolid, { height: HERO_EMPTY_H }]}>
              <Text style={styles.heroEmptyTitle}>No quests yet</Text>
              <Text style={styles.heroEmptySub}>Check back after the catalog loads.</Text>
            </View>
          </View>
        ) : categoryQuestTotal === 0 ? (
          <View style={[styles.heroCard, styles.heroEmptyPadded, { minHeight: HERO_EMPTY_H * 0.85 }]}>
            <Text style={styles.emptyTitleSolid}>No quests here yet</Text>
            <Text style={styles.emptyBodySolid}>Choose another category to explore options.</Text>
          </View>
        ) : (
          <>
            {TIMEFRAME_ORDER.map((tf) => {
              const bucket = questsByTimeframe[tf];
              if (bucket.length === 0) return null;
              return (
                <View key={tf} style={styles.timeframeSection}>
                  <View style={styles.timeframeSplit}>
                    <View style={styles.timeframeImageCol}>
                      <ImageBackground
                        source={journeyBackgroundForTimeframe(tf)}
                        style={styles.timeframeImageBg}
                        imageStyle={styles.bgImage}>
                        <View
                          style={[
                            styles.scrim,
                            { backgroundColor: `${categoryAccentForCategoryId(activeCategoryId)}45` },
                          ]}
                        />
                        <View style={styles.timeframeImageLabels}>
                          <Text style={styles.footerMeta}>{categoryLabel(activeCategoryId)}</Text>
                          <Text style={styles.heroHeadline} numberOfLines={2}>
                            {timeframeDiscoverHeading(tf)}
                          </Text>
                          <Text style={styles.heroHint} numberOfLines={2}>
                            {QUEST_COPY.discoverTimeframeQuestCounts(bucket.length)}
                          </Text>
                        </View>
                      </ImageBackground>
                    </View>
                    <View style={styles.timeframeQuestCol}>
                      {bucket.map((q) => {
                        const accent = categoryAccentForCategoryId(q.categoryId);
                        return (
                          <Pressable
                            key={q.id}
                            onPress={() => router.push(`/quest/${q.id}` as never)}
                            style={({ pressed }) => [styles.discoverQuestRow, pressed && styles.pressed]}>
                            <View style={[styles.discoverQuestAccent, { backgroundColor: accent }]} />
                            <View style={styles.discoverQuestRowBody}>
                              <Text style={styles.questRowMeta}>{categoryLabel(q.categoryId)}</Text>
                              <Text style={styles.questRowTitle} numberOfLines={3}>
                                {q.title}
                              </Text>
                              <Text style={styles.questRowSub} numberOfLines={3}>
                                {q.shortDescription}
                              </Text>
                              <Text style={styles.questRowMetaLight}>{questMetaLine(q)}</Text>
                              <View style={styles.questRowActions}>
                                <Pressable
                                  disabled={primaryBusy}
                                  onPress={() => void onStartNow(q.id)}
                                  style={({ pressed }) => [
                                    styles.btnSubtleSolid,
                                    pressed && !primaryBusy && styles.pressed,
                                    primaryBusy && styles.disabled,
                                  ]}>
                                  <Text style={styles.btnSubtleSolidText}>{QUEST_COPY.startNow}</Text>
                                </Pressable>
                                <Pressable
                                  disabled={primaryBusy}
                                  onPress={() => void onLike(q.id)}
                                  style={({ pressed }) => [
                                    styles.btnSubtleLight,
                                    pressed && !primaryBusy && styles.pressed,
                                    primaryBusy && styles.disabled,
                                  ]}>
                                  <Ionicons name="heart" size={13} color={Theme.accent} />
                                  <Text style={styles.btnSubtleLightText}>{QUEST_COPY.likeQuest}</Text>
                                </Pressable>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>

      {likedRows.length > 0 ? (
        <View style={[styles.panel, { minHeight: likedH }]}>
          <Text style={styles.likedSectionLabel}>{QUEST_COPY.forLaterSectionTitle}</Text>
          <FlatList
            data={likedRows}
            keyExtractor={(r) => r.key}
            renderItem={renderLiked}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={pageW}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={styles.likedListContent}
            extraData={`${pageW}:${likedH}`}
            getItemLayout={(_, index) => ({ length: pageW, offset: pageW * index, index })}
          />
        </View>
      ) : null}

      {primaryBusy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      ) : null}

      <Modal
        transparent
        visible={likedInfoOpen}
        animationType="fade"
        onRequestClose={() => setLikedInfoOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setLikedInfoOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.likedInfoCard} accessibilityViewIsModal>
            <View style={styles.likedInfoIconWrap}>
              <Ionicons name="heart-outline" size={28} color={Theme.accent} />
            </View>
            <Text style={styles.likedInfoTitle}>{QUEST_COPY.likedEmptyTitle}</Text>
            <Text style={styles.likedInfoBody}>{QUEST_COPY.likedEmptyBody}</Text>
            <Pressable
              onPress={() => setLikedInfoOpen(false)}
              style={({ pressed }) => [styles.likedInfoClose, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.likedInfoCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={pathFullOpen}
        animationType="fade"
        onRequestClose={() => {
          setPathFullOpen(false);
          pendingActivationRef.current = null;
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{QUEST_COPY.activePathFullTitle}</Text>
            <Text style={styles.modalBody}>{QUEST_COPY.activePathFullBody}</Text>
            <Text style={styles.modalSub}>Let one of these wait:</Text>
            <ScrollView style={styles.modalList} contentContainerStyle={{ gap: 10 }}>
              {activeForModal.map((uq) => {
                const q = getQuestById(uq.questId);
                return (
                  <Pressable
                    key={uq.id}
                    onPress={() => void onLetWait(uq.id)}
                    style={({ pressed }) => [styles.modalRow, pressed && styles.pressed]}>
                    <Text style={styles.modalRowTitle}>{rowTitle(uq, q)}</Text>
                    <Text style={styles.modalRowAction}>{QUEST_COPY.moveToLater}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => {
                setPathFullOpen(false);
                pendingActivationRef.current = null;
              }}
              style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
