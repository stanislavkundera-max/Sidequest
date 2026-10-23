import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradientStyle } from '@/components/ui/DawnBackground';
import { Dawn, Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import { countCompletedJourneySteps } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest, UserQuest } from '@/src/types/quest';

type Props = {
  visible: boolean;
  activeForModal: UserQuest[];
  getQuestById: (id: string) => Quest | undefined;
  onLetWait: (userQuestId: string) => void;
  onClose: () => void;
  /** The quest being paused right now; while set, the rows take no more taps. */
  waitingUserQuestId?: string | null;
};

const SHEET_BG = `radial-gradient(90% 60% at 100% 100%, rgba(240, 150, 120, 0.22) 0%, rgba(240, 150, 120, 0) 72%), linear-gradient(180deg, ${Dawn.ground[0]} 0%, ${Dawn.ground[1]} 55%, ${Dawn.ground[2]} 100%)`;

/**
 * "Your path is full" — shared by Explore and Journey (redesign screen 18). A sheet from the
 * bottom: three filled segments for the three places on the path, then each quest going with
 * where it is and a quiet "Let it wait". Close stays a neutral button, not a call to action.
 */
export function PathFullModal({
  visible,
  activeForModal,
  getQuestById,
  onLetWait,
  onClose,
  waitingUserQuestId = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const categories = useQuestDomainStore((s) => s.categories);
  const working = waitingUserQuestId != null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, gradientStyle(SHEET_BG), { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}
          accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.slots} accessible={false}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.slot} />
            ))}
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {QUEST_COPY.activePathFullTitle}
          </Text>
          <Text style={styles.body}>{QUEST_COPY.activePathFullBody}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {activeForModal.map((uq) => {
              const q = getQuestById(uq.questId);
              const cid = uq.snapshotCategoryId || q?.categoryId || '';
              const title = uq.snapshotTitle?.trim() || q?.title || 'Side quest';
              const total = q?.actionSteps.length ?? 0;
              const done = q && total > 0 ? countCompletedJourneySteps(uq, q) : 0;
              const where = total > 0 ? `Step ${Math.min(done + 1, total)} of ${total}` : 'In motion';
              const isWaiting = uq.id === waitingUserQuestId;
              return (
                <View key={uq.id} style={[styles.row, working && !isWaiting && styles.dim]}>
                  <View style={[styles.dot, { backgroundColor: categoryAccentForCategoryId(cid) }]} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {`${categories.find((c) => c.id === cid)?.name ?? ''} · ${where}`}
                    </Text>
                  </View>
                  <Pressable
                    disabled={working}
                    onPress={() => onLetWait(uq.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Let it wait: ${title}`}
                    style={({ pressed }) => [styles.wait, pressed && styles.pressed]}>
                    <Text style={styles.waitText}>{isWaiting ? 'Pausing…' : 'Let it wait'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={onClose}
            disabled={working}
            accessibilityRole="button"
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24, 22, 14, 0.62)' },
  sheet: {
    backgroundColor: Theme.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(240, 178, 122, 0.45)',
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(243, 242, 236, 0.25)' },
  slots: { flexDirection: 'row', gap: 6, marginTop: 18 },
  slot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#e0823d' },
  title: { marginTop: 18, fontSize: 24, lineHeight: 29, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  body: { marginTop: 8, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  list: { marginTop: 18, flexGrow: 0 },
  listContent: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
  },
  dim: { opacity: 0.45 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(246, 234, 214, 0.8)' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  rowMeta: { marginTop: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  wait: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(243, 242, 236, 0.75)',
    backgroundColor: 'rgba(243, 242, 236, 0.14)',
    justifyContent: 'center',
  },
  waitText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#ffffff' },
  close: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(243, 242, 236, 0.5)',
    backgroundColor: 'rgba(243, 242, 236, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: '#ffffff' },
  pressed: { opacity: 0.8 },
});
