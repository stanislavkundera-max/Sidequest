import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
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
          style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
          <Text style={styles.title}>{title}</Text>
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
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected ? <Ionicons name="checkmark" size={18} color={Theme.accent} /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  rowPressed: { opacity: 0.7 },
  rowText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Theme.text,
  },
  rowTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.accent,
  },
});
