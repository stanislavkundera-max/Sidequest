import { supabase } from '@/lib/supabase';
import type { MemoryEntry } from '@/src/types/memory';

type MemoryRowWithJoin = {
  id: string;
  user_quest_id: string | null;
  title: string;
  body: string;
  photo_url: string | null;
  created_at: string;
  user_quests?: { quest_id: string | null }[] | { quest_id: string | null } | null;
};

function mapMemoryRow(row: MemoryRowWithJoin): MemoryEntry {
  const relation = Array.isArray(row.user_quests)
    ? row.user_quests[0]
    : row.user_quests;
  return {
    id: row.id,
    questId: relation?.quest_id ?? null,
    userQuestId: row.user_quest_id,
    title: row.title,
    body: row.body,
    photoUri: row.photo_url,
    createdAt: row.created_at,
  };
}

export async function fetchMemoryTimeline(userId: string): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id,user_quest_id,title,body,photo_url,created_at,user_quests(quest_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as MemoryRowWithJoin[]).map(mapMemoryRow);
}

export async function createMemoryEntry(params: {
  userId: string;
  userQuestId: string | null;
  questId: string | null;
  title: string;
  body: string;
  photoUrl: string | null;
}): Promise<MemoryEntry> {
  const { data, error } = await supabase
    .from('memory_entries')
    .insert({
      user_id: params.userId,
      user_quest_id: params.userQuestId,
      title: params.title,
      body: params.body,
      photo_url: params.photoUrl,
    })
    .select('id,user_quest_id,title,body,photo_url,created_at')
    .single();
  if (error) throw error;

  return {
    id: data.id as string,
    userQuestId: (data.user_quest_id as string | null) ?? null,
    questId: params.questId,
    title: data.title as string,
    body: data.body as string,
    photoUri: (data.photo_url as string | null) ?? null,
    createdAt: data.created_at as string,
  };
}

/** Admin tool: wipes every memory entry for a user (row data only; storage photos are left orphaned). */
export async function deleteAllMemoriesForUser(userId: string): Promise<void> {
  const { error } = await supabase.from('memory_entries').delete().eq('user_id', userId);
  if (error) throw error;
}
