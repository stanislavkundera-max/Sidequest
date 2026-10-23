import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gradientStyle } from '@/components/ui/DawnBackground';
import { SubtleButton } from '@/components/ui/SubtleButton';
import { Dawn, Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';

type Props = {
  categoryId: string;
  categoryName: string;
  title: string;
  stepDone: number;
  stepTotal: number;
  /** "Next: …" under the title (the place sheet shows it, the map carousel doesn't). */
  nextLabel?: string;
  paused?: boolean;
  /** One line, for the carousel above the tab bar. */
  compact?: boolean;
  actionLabel: string;
  onPress: () => void;
  onAction: () => void;
  disabled?: boolean;
};

const CREAM = `linear-gradient(110deg, ${Dawn.cream} 0%, ${Dawn.cream} 55%, #f3c99a 85%, ${Dawn.creamEnd} 100%)`;

/**
 * A quest you have going (redesign screens 15–16). In motion: the cream card, the one warm
 * bright thing on the screen, with a subtle Continue (never a black pill inside cream). Paused:
 * a quiet translucent card with a cream Resume. Quests in motion live only on Explore now.
 */
export function InMotionCard({
  categoryId,
  categoryName,
  title,
  stepDone,
  stepTotal,
  nextLabel,
  paused = false,
  compact = false,
  actionLabel,
  onPress,
  onAction,
  disabled = false,
}: Props) {
  const step = stepTotal > 0 ? `Step ${Math.min(stepDone + 1, stepTotal)} of ${stepTotal}` : 'In motion';
  const meta = paused ? `Paused · ${step}` : compact ? `${categoryName} · ${step}` : `In motion · ${step}`;
  const ink = paused ? Theme.text : Dawn.creamText;
  const muted = paused ? Theme.textMuted : Dawn.creamMuted;

  return (
    // No button role on the card: Continue / Resume inside is the real button, and a button
    // inside a button is invalid markup that screen readers trip over. Tapping the card is a
    // shortcut to the quest; the label below names the action and where it stands.
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        paused ? styles.paused : [styles.cream, gradientStyle(CREAM)],
        pressed && styles.pressed,
      ]}>
      {compact ? (
        <View style={[styles.dot, { backgroundColor: categoryAccentForCategoryId(categoryId) }]} />
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.meta, { color: muted }]} numberOfLines={1}>
          {meta}
        </Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: ink }]} numberOfLines={compact ? 1 : 2}>
          {title}
        </Text>
        {!compact && nextLabel ? (
          <Text style={[styles.next, { color: muted }]} numberOfLines={1}>
            Next: {nextLabel}
          </Text>
        ) : null}
        {!compact && !paused && stepTotal > 0 ? (
          <View style={styles.steps} accessible={false}>
            {Array.from({ length: stepTotal }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.stepBar,
                  i < stepDone ? styles.stepDone : i === stepDone ? styles.stepNow : styles.stepTodo,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
      {paused ? (
        <Pressable
          onPress={onAction}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}, ${meta}`}
          style={({ pressed }) => [styles.resume, pressed && styles.pressed, disabled && styles.disabled]}>
          <Text style={styles.resumeText}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <SubtleButton
          label={actionLabel}
          onPress={onAction}
          disabled={disabled}
          accessibilityLabel={`${actionLabel}: ${title}, ${meta}`}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compact: { borderRadius: 22, minHeight: 76, paddingVertical: 10, paddingHorizontal: 14 },
  cream: {
    backgroundColor: Dawn.cream,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 248, 232, 0.9)',
    boxShadow: '0 8px 22px rgba(20, 18, 10, 0.5)',
  },
  paused: {
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    boxShadow: '0 6px 16px rgba(20, 18, 10, 0.25)',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(246, 234, 214, 0.9)',
  },
  body: { flex: 1, minWidth: 0 },
  meta: { fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  title: { marginTop: 2, fontSize: 16, lineHeight: 20, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  titleCompact: { fontSize: 15 },
  next: { marginTop: 4, fontSize: 13, fontFamily: 'Inter_400Regular' },
  steps: { flexDirection: 'row', gap: 4, marginTop: 10, width: 128 },
  stepBar: { flex: 1, height: 5, borderRadius: 3 },
  stepDone: { backgroundColor: '#a34f25' },
  stepNow: { backgroundColor: '#e0823d' },
  stepTodo: { backgroundColor: 'rgba(40, 40, 31, 0.18)' },
  resume: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Dawn.cream,
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(20, 18, 10, 0.3)',
  },
  resumeText: { color: Dawn.primaryText, fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700' },
});
