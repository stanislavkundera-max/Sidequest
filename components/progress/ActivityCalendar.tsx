import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Every local day this month when you did something: a step done, a quest finished, a memory kept. */
export function useDaysOutThisMonth(): Set<string> {
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const memories = useMemoryStore((s) => s.memories);
  return useMemo(() => {
    const now = new Date();
    const days = new Set<string>();
    const add = (iso: string | null | undefined) => {
      if (!iso) return;
      const d = new Date(iso);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) days.add(dayKey(d));
    };
    for (const uq of userQuests) {
      add(uq.completedAt);
      for (const entry of Object.values(uq.stepProgress ?? {})) add(entry?.completedAt);
    }
    for (const m of memories) add(m.createdAt);
    return days;
  }, [userQuests, memories]);
}

/**
 * This month, the days you did something filled in (redesign screen 34 — Standa: "ten kalendář
 * mi připadá super"). Nothing counts a streak or marks a missed day: an empty day is just a day.
 */
export function ActivityCalendar() {
  const lived = useDaysOutThisMonth();
  const { cells, monthName } = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday first
    const out: ({ day: number; key: string; future: boolean; today: boolean } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      out.push({ day: d, key: dayKey(date), future: d > now.getDate(), today: d === now.getDate() });
    }
    return { cells: out, monthName: now.toLocaleDateString(undefined, { month: 'long' }) };
  }, []);

  return (
    <View style={styles.card} accessibilityLabel={`${monthName}: ${lived.size} days you did something`}>
      <View style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <View key={`h${i}`} style={styles.cell}>
            <Text style={styles.weekday}>{w}</Text>
          </View>
        ))}
        {cells.map((c, i) =>
          c ? (
            <View key={c.key} style={styles.cell}>
              <View style={[styles.day, lived.has(c.key) && styles.dayLived, c.today && styles.dayToday]}>
                <Text
                  style={[
                    styles.dayText,
                    c.future && styles.dayFuture,
                    lived.has(c.key) && styles.dayTextLived,
                    c.today && styles.dayTextToday,
                  ]}>
                  {c.day}
                </Text>
              </View>
            </View>
          ) : (
            <View key={`e${i}`} style={styles.cell} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 34, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#bfb69c' },
  day: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayLived: { backgroundColor: '#e0823d' },
  dayToday: { borderWidth: 2, borderColor: Theme.accentWarm },
  dayText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  dayFuture: { color: '#8c8468' },
  dayTextLived: { color: Dawn.creamText, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  dayTextToday: { color: Theme.text, fontFamily: 'Inter_700Bold', fontWeight: '700' },
});
