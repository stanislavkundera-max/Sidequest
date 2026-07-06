import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import type { Quest, UserQuest } from '@/src/types/quest';

type Props = {
  visible: boolean;
  activeForModal: UserQuest[];
  getQuestById: (id: string) => Quest | undefined;
  onLetWait: (userQuestId: string) => void;
  onClose: () => void;
};

/** "Your path is full" chooser — shared by Explore and Journey. */
export function PathFullModal({
  visible,
  activeForModal,
  getQuestById,
  onLetWait,
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{QUEST_COPY.activePathFullTitle}</Text>
          <Text style={styles.modalBody}>{QUEST_COPY.activePathFullBody}</Text>
          <Text style={styles.modalSub}>Let one of these wait:</Text>
          <ScrollView style={styles.modalList} contentContainerStyle={{ gap: 10 }}>
            {activeForModal.map((uq) => {
              const q = getQuestById(uq.questId);
              const title = uq.snapshotTitle?.trim() || q?.title || 'Side quest';
              return (
                <Pressable
                  key={uq.id}
                  onPress={() => onLetWait(uq.id)}
                  style={({ pressed }) => [styles.modalRow, pressed && styles.pressed]}>
                  <Text style={styles.modalRowTitle}>{title}</Text>
                  <Text style={styles.modalRowAction}>{QUEST_COPY.moveToLater}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
