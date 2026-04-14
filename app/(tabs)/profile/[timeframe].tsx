import { Redirect, useLocalSearchParams } from 'expo-router';

import type { QuestTimeframe } from '@/src/types/quest';

import { ProgressOverview } from './ProgressOverview';

const VALID = new Set<string>(['weekly', 'monthly', 'yearly']);

export default function ProfileTimeframeScreen() {
  const { timeframe } = useLocalSearchParams<{ timeframe: string }>();
  const raw = typeof timeframe === 'string' ? timeframe : '';
  if (!VALID.has(raw)) {
    return <Redirect href="/(tabs)/profile" />;
  }
  if (raw === 'weekly') {
    return <Redirect href="/(tabs)/profile" />;
  }
  return <ProgressOverview focusedTimeframe={raw as QuestTimeframe} />;
}
