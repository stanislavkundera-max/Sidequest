import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Theme } from '@/constants/Theme';
import {
  atHour,
  hourLabel,
  hoursFor,
  otherDayChoices,
  quickDayChoices,
  relativeDayLabel,
  sameDay,
  startOnDay,
} from '@/src/features/quests/questStartChoice';

type Props = {
  /** The start picked so far — preselected with the quest's suggested start. */
  value: Date;
  onChange: (start: Date) => void;
  /** The suggestion, so its day always has a chip. */
  suggested: Date;
};

/**
 * Day and time for a calendar step, picked in the app before the calendar opens — so the quest's
 * reminders can be scheduled right away, and the calendar opens on the same start
 * (src/features/quests/questStartChoice.ts says why). The suggestion is preselected: keeping it is
 * no extra tap. Whole hours only; the calendar is there to fine-tune minutes.
 */
export function CalendarStartPicker({ value, onChange, suggested }: Props) {
  const [otherOpen, setOtherOpen] = useState(false);
  // Fixed for the life of the step on screen, so the chips do not shift under a finger.
  const now = useMemo(() => new Date(), []);
  const quick = useMemo(() => quickDayChoices(now, suggested), [now, suggested]);
  const others = useMemo(() => otherDayChoices(now), [now]);
  const hours = hoursFor(value, now);
  const pickedElsewhere = !quick.some((d) => sameDay(d.day, value));

  const pickDay = (day: Date) => {
    const next = startOnDay(day, value, now);
    if (next) onChange(next);
  };

  return (
    <View style={styles.block}>
      <Text style={styles.label}>When</Text>
      <View style={styles.row}>
        {quick.map((d) => (
          <Chip
            key={d.key}
            label={d.label}
            selected={sameDay(d.day, value)}
            onPress={() => {
              setOtherOpen(false);
              pickDay(d.day);
            }}
          />
        ))}
        {pickedElsewhere ? (
          <Chip label={relativeDayLabel(value, now)} selected onPress={() => setOtherOpen((o) => !o)} />
        ) : null}
        <Chip
          label="Other day"
          trailingIcon={otherOpen ? 'chevron-up' : 'chevron-down'}
          onPress={() => setOtherOpen((o) => !o)}
          accessibilityLabel={otherOpen ? 'Hide other days' : 'Pick another day'}
        />
      </View>
      {otherOpen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.otherScroll}
          contentContainerStyle={styles.otherRow}>
          {others.map((d) => (
            <Chip
              key={d.key}
              label={d.label}
              selected={sameDay(d.day, value)}
              onPress={() => pickDay(d.day)}
            />
          ))}
        </ScrollView>
      ) : null}
      <Text style={styles.label}>Time</Text>
      <View style={styles.row}>
        {hours.map((h) => (
          <Chip
            key={h}
            label={hourLabel(h)}
            selected={value.getHours() === h && value.getMinutes() === 0}
            onPress={() => onChange(atHour(value, h))}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    marginTop: 4,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  otherScroll: { flexGrow: 0 },
  otherRow: { gap: 8, paddingVertical: 2 },
});
