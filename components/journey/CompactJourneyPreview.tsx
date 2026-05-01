import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { getJourneyVisualState, getWorldStateFromCompletedQuests } from '@/src/features/journey/journeyWorld';
import type { MemoryEntry } from '@/src/types/memory';
import type { Quest, UserQuest } from '@/src/types/quest';

type CompactJourneyPreviewProps = {
  quests: Quest[];
  userQuests: UserQuest[];
  memories: MemoryEntry[];
  onOpenJourney: () => void;
  onOpenMemory: (id: string) => void;
  onOpenQuest: (id: string) => void;
};

function findRelatedMemory(memories: MemoryEntry[], uq: UserQuest): MemoryEntry | undefined {
  const direct = memories.find((m) => m.userQuestId === uq.id);
  if (direct) return direct;
  const withSameQuest = memories.filter((m) => m.questId === uq.questId);
  if (withSameQuest.length === 0) return undefined;
  return [...withSameQuest].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  )[0];
}

export function CompactJourneyPreview({
  quests,
  userQuests,
  memories,
  onOpenJourney,
  onOpenMemory,
  onOpenQuest,
}: CompactJourneyPreviewProps) {
  const questById = new Map(quests.map((q) => [q.id, q]));
  const completed = userQuests
    .filter((uq) => uq.status === 'completed' && uq.completedAt)
    .filter((uq) => questById.has(uq.questId))
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));

  const lastNodes = completed.slice(-4).map((uq) => {
    const q = questById.get(uq.questId)!;
    const memory = findRelatedMemory(memories, uq);
    const title = memory?.title?.trim() ? memory.title : q.title;
    return {
      key: uq.id,
      questId: q.id,
      categoryId: q.categoryId,
      title,
      memoryId: memory?.id,
      hasPhoto: Boolean(memory?.photoUri),
      date: memory?.createdAt ?? uq.completedAt!,
    };
  });

  const worldState = getWorldStateFromCompletedQuests({
    completedUserQuests: completed.filter((uq) => uq.completedAt),
    questCatalog: quests,
  });
  const visual = getJourneyVisualState(worldState);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {visual.environmentLayers.map((layer, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: layer.color, opacity: layer.opacity }]}
        />
      ))}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Your path</Text>
          <Text style={styles.title} numberOfLines={2}>
            Recent steps and moments
          </Text>
        </View>
        <Pressable
          onPress={onOpenJourney}
          accessibilityRole="button"
          accessibilityLabel="Open Journey"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={styles.ctaText}>Open</Text>
        </Pressable>
      </View>

      <View style={styles.worldRow}>
        <WorldChip label="Nature" value={`L${worldState.nature.level}`} tint={Theme.nature} />
        <WorldChip label="Social" value={`L${worldState.social.level}`} tint={Theme.social} />
        <WorldChip label="Adventure" value={`L${worldState.adventure.level}`} tint={Theme.adventure} />
        <WorldChip label="Relax" value={`L${worldState.relax.level}`} tint={Theme.relax} />
      </View>

      {lastNodes.length === 0 ? (
        <Text style={styles.empty}>Complete a quest to place your first step here.</Text>
      ) : (
        <View style={styles.pathWrap}>
          <View pointerEvents="none" style={[styles.pathLine, { width: visual.pathWidth }]} />
          <View style={styles.nodes}>
            {lastNodes.map((n, idx) => {
              const accent = categoryAccentForCategoryId(n.categoryId);
              const isCurrent = idx === lastNodes.length - 1;
              return (
                <Pressable
                  key={n.key}
                  onPress={() => (n.memoryId ? onOpenMemory(n.memoryId) : onOpenQuest(n.questId))}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${n.title}`}
                  style={({ pressed }) => [styles.nodeRow, pressed && styles.nodeRowPressed]}>
                  <View style={styles.dotColumn}>
                    <View style={[styles.dot, { backgroundColor: accent }]}>
                      {isCurrent ? <View style={styles.ring} /> : null}
                    </View>
                    {n.hasPhoto ? (
                      <View style={[styles.photoTick, { backgroundColor: accent }]}>
                        <FontAwesome name="camera" size={10} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nodeTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.nodeMeta}>
                      {new Date(n.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function WorldChip({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={styles.worldChip} accessibilityRole="text">
      <View style={[styles.worldDot, { backgroundColor: tint }]} />
      <Text style={styles.worldLabel}>{label}</Text>
      <Text style={styles.worldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Theme.textMuted,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '700', color: Theme.text },
  cta: {
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { fontSize: 14, fontWeight: '700', color: Theme.text },
  worldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  worldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  worldDot: { width: 8, height: 8, borderRadius: 4, opacity: 0.9 },
  worldLabel: { fontSize: 12, fontWeight: '700', color: Theme.textMuted },
  worldValue: { fontSize: 12, fontWeight: '800', color: Theme.text },
  empty: { marginTop: 12, color: Theme.textMuted, fontSize: 14, lineHeight: 20 },
  pathWrap: { marginTop: 12, paddingLeft: 18, position: 'relative' },
  pathLine: {
    position: 'absolute',
    left: 8,
    top: 4,
    bottom: 4,
    backgroundColor: Theme.border,
    borderRadius: 999,
    opacity: 0.9,
  },
  nodes: { gap: 8 },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
  nodeRowPressed: { opacity: 0.92 },
  dotColumn: { width: 26, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Theme.accent, opacity: 0.5 },
  photoTick: { marginTop: 5, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  nodeTitle: { fontSize: 14, fontWeight: '700', color: Theme.text },
  nodeMeta: { marginTop: 2, fontSize: 12, color: Theme.textMuted },
});

