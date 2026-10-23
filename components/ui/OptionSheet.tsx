import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradientStyle } from '@/components/ui/DawnBackground';
import { Dawn, Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  /** Omit for a plain menu of actions where nothing is "currently chosen". */
  selected?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * A short list of choices in a bottom sheet — for a filter that is secondary
 * enough to live behind one chip rather than take a row of its own.
 * Tapping outside closes it; choosing closes it.
 */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable
          // Swallow taps on the sheet itself so they don't reach the backdrop.
          onPress={() => undefined}
          style={[styles.sheet, gradientStyle(SHEET_BG), { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.grabber} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                style={({ pressed }) => [styles.row, isSelected && styles.rowSelected, pressed && styles.rowPressed]}>
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected ? <Ionicons name="checkmark" size={18} color={Theme.accent} /> : null}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.rowPressed]}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SHEET_BG = `radial-gradient(90% 60% at 100% 100%, rgba(240, 150, 120, 0.2) 0%, rgba(240, 150, 120, 0) 72%), linear-gradient(180deg, ${Dawn.ground[0]} 0%, ${Dawn.ground[2]} 100%)`;

// Dawn (canvas screen 22): a sheet of the warm ground, each choice its own card, a neutral Close.
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24, 22, 14, 0.62)',
  },
  sheet: {
    backgroundColor: Theme.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(240, 178, 122, 0.35)',
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 10,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(243, 242, 236, 0.25)', marginBottom: 6 },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 4,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET + 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: Dawn.card,
    borderWidth: 1.5,
    borderColor: Dawn.cardBorder,
  },
  rowSelected: { borderColor: Theme.accent },
  rowPressed: { opacity: 0.7 },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.text,
  },
  rowTextSelected: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  close: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(246, 234, 214, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
});
