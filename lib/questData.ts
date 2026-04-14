import { getDailyPeriodKey, getWeeklyPeriodKey } from '@/lib/period';
import { supabase } from '@/lib/supabase';
import type { Quest, QuestCadence } from '@/types/database';

export type QuestWithStatus = {
  quest: Quest;
  completed: boolean;
};

async function fetchQuestsByCadence(cadence: QuestCadence): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('cadence', cadence)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Quest[];
}

async function fetchCompletedQuestIds(
  userId: string,
  periodKey: string,
  questIds: string[]
): Promise<Set<string>> {
  if (questIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('user_quests')
    .select('quest_id')
    .eq('user_id', userId)
    .eq('period_key', periodKey)
    .in('quest_id', questIds);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.quest_id as string));
}

/**
 * Picks the first quest in sort order not completed for this period;
 * if all are completed, returns the first quest marked completed.
 */
export async function loadActiveQuest(
  userId: string,
  cadence: QuestCadence,
  periodKey: string
): Promise<QuestWithStatus | null> {
  const quests = await fetchQuestsByCadence(cadence);
  if (quests.length === 0) return null;

  const ids = quests.map((q) => q.id);
  const completedIds = await fetchCompletedQuestIds(userId, periodKey, ids);

  const firstOpen = quests.find((q) => !completedIds.has(q.id));
  if (firstOpen) {
    return { quest: firstOpen, completed: false };
  }

  return { quest: quests[0], completed: true };
}

export function currentPeriodKeys() {
  const now = new Date();
  return {
    daily: getDailyPeriodKey(now),
    weekly: getWeeklyPeriodKey(now),
  };
}

export async function completeQuest(
  userId: string,
  questId: string,
  periodKey: string
) {
  const { error } = await supabase.from('user_quests').insert({
    user_id: userId,
    quest_id: questId,
    period_key: periodKey,
  });
  if (error) throw error;
}

export async function fetchQuestById(id: string): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Quest | null;
}

export async function isQuestCompletedForPeriod(
  userId: string,
  questId: string,
  periodKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_quests')
    .select('id')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('period_key', periodKey)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
