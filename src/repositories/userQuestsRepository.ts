import { supabase } from '@/lib/supabase';
import { getWeeklyPeriodKey } from '@/lib/period';
import {
  ACTIVE_LIMITS,
  countActiveForTimeframe,
} from '@/src/features/quests/questHelpers';
import type { Quest, UserQuest, UserQuestStepProgress } from '@/src/types/quest';

export type AssignQuestResult =
  | { ok: true; userQuest: UserQuest }
  | { ok: false; reason: 'not_found' | 'already_active' | 'timeframe_full' };

export type CompleteQuestResult =
  | { ok: true; userQuest: UserQuest }
  | { ok: false; reason: 'not_found' | 'not_active' };

type UserQuestTable = 'user_quests' | 'user_quest';
let userQuestTableCache: UserQuestTable = 'user_quests';
const MISSING_USER_QUEST_TABLE_MESSAGE =
  "Quest progress is not configured in Supabase yet. Run `supabase/schema.sql` and `supabase/production_prep.sql`, then try again.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : JSON.stringify(error);
  }
  return String(error);
}

function isMissingTableError(error: unknown, table: UserQuestTable): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes(`public.${table}`) &&
    (message.includes('could not find the table') ||
      message.includes('does not exist') ||
      message.includes('schema cache'))
  );
}

function isAnyUserQuestTableMissingError(error: unknown): boolean {
  return isMissingTableError(error, 'user_quests') || isMissingTableError(error, 'user_quest');
}

function missingUserQuestTableError(): Error {
  return new Error(MISSING_USER_QUEST_TABLE_MESSAGE);
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const columnLabel = column.toLowerCase();
  return (
    message.includes(columnLabel) &&
    (message.includes('does not exist') || message.includes('schema cache'))
  );
}

async function runUserQuestQuery(
  queryBuilder: (table: UserQuestTable) => any
): Promise<{ data: any; error: unknown }> {
  const primaryTable = userQuestTableCache;
  const primary = await queryBuilder(primaryTable);
  if (!primary.error) return primary;
  if (!isMissingTableError(primary.error, primaryTable)) return primary;

  const fallbackTable: UserQuestTable =
    primaryTable === 'user_quests' ? 'user_quest' : 'user_quests';
  const fallback = await queryBuilder(fallbackTable);
  if (!fallback.error) {
    userQuestTableCache = fallbackTable;
  }
  return fallback;
}

function parseStepProgress(raw: unknown): UserQuestStepProgress {
  if (!raw || typeof raw !== 'object') return {};
  const out: UserQuestStepProgress = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function mapUserQuestRow(row: any): UserQuest {
  const statusFromRow = row.status as UserQuest['status'] | undefined;
  const normalizedStatus: UserQuest['status'] =
    statusFromRow === 'active' || statusFromRow === 'completed'
      ? statusFromRow
      : row.completed_at
        ? 'completed'
        : 'active';

  return {
    id: row.id as string,
    questId: row.quest_id as string,
    status: normalizedStatus,
    startedAt:
      (row.started_at as string | null) ??
      (row.created_at as string | null) ??
      (row.completed_at as string | null) ??
      new Date().toISOString(),
    completedAt: (row.completed_at as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    photoUri: (row.photo_url as string | null) ?? null,
    stepProgress: parseStepProgress(row.step_progress),
  };
}

export async function fetchUserQuests(userId: string): Promise<UserQuest[]> {
  try {
    const primary = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
    );
    if (!primary.error) {
      return ((primary.data ?? []) as any[]).map(mapUserQuestRow);
    }
    if (isAnyUserQuestTableMissingError(primary.error)) {
      // Allow the app to load in environments where quest tracking schema
      // has not been provisioned yet.
      return [];
    }
    if (!isMissingColumnError(primary.error, 'started_at')) {
      throw primary.error;
    }

    const fallback = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
    );
    if (fallback.error) {
      if (isAnyUserQuestTableMissingError(fallback.error)) {
        return [];
      }
      throw fallback.error;
    }
    return ((fallback.data ?? []) as any[]).map(mapUserQuestRow);
  } catch (error) {
    throw error;
  }
}

export async function findLatestCompletedUserQuestForQuest(
  userId: string,
  questId: string
): Promise<UserQuest | null> {
  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (!primary.error) {
    return primary.data ? mapUserQuestRow(primary.data as any) : null;
  }
  if (isAnyUserQuestTableMissingError(primary.error)) {
    return null;
  }
  if (!isMissingColumnError(primary.error, 'status')) {
    throw primary.error;
  }

  const fallback = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (fallback.error) {
    if (isAnyUserQuestTableMissingError(fallback.error)) {
      return null;
    }
    throw fallback.error;
  }
  return fallback.data ? mapUserQuestRow(fallback.data as any) : null;
}

export async function assignQuestToUser(params: {
  userId: string;
  questId: string;
  catalog: Quest[];
  userQuests: UserQuest[];
}): Promise<AssignQuestResult> {
  const quest = params.catalog.find((q) => q.id === params.questId);
  if (!quest) return { ok: false, reason: 'not_found' };

  if (
    params.userQuests.some(
      (uq) => uq.status === 'active' && uq.questId === params.questId
    )
  ) {
    return { ok: false, reason: 'already_active' };
  }

  const catalogMap = new Map(params.catalog.map((q) => [q.id, q]));
  const activeCount = countActiveForTimeframe(
    params.userQuests,
    quest.timeframe,
    catalogMap
  );
  if (activeCount >= ACTIVE_LIMITS[quest.timeframe]) {
    return { ok: false, reason: 'timeframe_full' };
  }

  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .insert({
        user_id: params.userId,
        quest_id: params.questId,
        status: 'active',
      })
      .select('*')
      .single()
  );

  if (!primary.error) {
    return { ok: true, userQuest: mapUserQuestRow(primary.data as any) };
  }
  if (isAnyUserQuestTableMissingError(primary.error)) {
    throw missingUserQuestTableError();
  }
  if (
    !isMissingColumnError(primary.error, 'status') &&
    !isMissingColumnError(primary.error, 'started_at')
  ) {
    throw primary.error;
  }

  const fallback = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .insert({
        user_id: params.userId,
        quest_id: params.questId,
        completed_at: null,
        period_key: getWeeklyPeriodKey(),
      })
      .select('*')
      .single()
  );
  if (fallback.error) throw fallback.error;
  return { ok: true, userQuest: mapUserQuestRow(fallback.data as any) };
}

export async function updateUserQuestStepProgress(params: {
  userId: string;
  userQuestId: string;
  stepProgress: UserQuestStepProgress;
}): Promise<UserQuest | null> {
  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({ step_progress: params.stepProgress })
      .eq('id', params.userQuestId)
      .eq('user_id', params.userId)
      .select('*')
      .single()
  );
  if (!primary.error) {
    return mapUserQuestRow(primary.data as any);
  }
  if (isMissingColumnError(primary.error, 'step_progress')) {
    return null;
  }
  if (isAnyUserQuestTableMissingError(primary.error)) {
    throw missingUserQuestTableError();
  }
  throw primary.error;
}

/**
 * Remove an active side quest so the user can activate a different one (frees the timeframe slot).
 * Deletes the row; journey progress for this activation is discarded.
 */
export async function deactivateActiveUserQuest(params: {
  userId: string;
  userQuestId: string;
}): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' }> {
  const { data: current, error: findError } = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .select('id, status, completed_at')
      .eq('user_id', params.userId)
      .eq('id', params.userQuestId)
      .maybeSingle()
  );
  if (findError) {
    if (!isAnyUserQuestTableMissingError(findError)) {
      throw findError;
    }
    throw missingUserQuestTableError();
  }
  if (!current) return { ok: false, reason: 'not_found' };
  const row = current as { status?: string | null; completed_at?: string | null };
  const isCompleted =
    row.status === 'completed' ||
    (row.completed_at != null && row.completed_at !== '');
  if (isCompleted) return { ok: false, reason: 'not_active' };
  const isActive = row.status === 'active' || (!row.status && !row.completed_at);
  if (!isActive) return { ok: false, reason: 'not_active' };

  const del = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .delete()
      .eq('user_id', params.userId)
      .eq('id', params.userQuestId)
  );
  if (!del.error) {
    return { ok: true };
  }
  if (isAnyUserQuestTableMissingError(del.error)) {
    throw missingUserQuestTableError();
  }
  throw del.error;
}

export async function completeUserQuest(params: {
  userId: string;
  userQuestId: string;
  note?: string | null;
  photoUrl?: string | null;
}): Promise<CompleteQuestResult> {
  const { data: current, error: findError } = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .select('*')
      .eq('user_id', params.userId)
      .eq('id', params.userQuestId)
      .maybeSingle()
  );
  if (findError) {
    if (!isAnyUserQuestTableMissingError(findError)) {
      throw findError;
    }
    throw missingUserQuestTableError();
  }

  if (!current) return { ok: false, reason: 'not_found' };
  const currentRow = current as any;
  const resolvedStatus =
    currentRow.status === 'active' || currentRow.status === 'completed'
      ? (currentRow.status as UserQuest['status'])
      : currentRow.completed_at
        ? 'completed'
        : 'active';
  if (resolvedStatus !== 'active') return { ok: false, reason: 'not_active' };

  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        note: params.note ?? null,
        photo_url: params.photoUrl ?? null,
      })
      .eq('id', params.userQuestId)
      .eq('user_id', params.userId)
      .select('*')
      .single()
  );
  if (!primary.error) {
    return { ok: true, userQuest: mapUserQuestRow(primary.data as any) };
  }
  if (
    !isMissingColumnError(primary.error, 'status') &&
    !isMissingColumnError(primary.error, 'note') &&
    !isMissingColumnError(primary.error, 'photo_url')
  ) {
    throw primary.error;
  }

  const fallback = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.userQuestId)
      .eq('user_id', params.userId)
      .select('*')
      .single()
  );
  if (fallback.error) throw fallback.error;
  return { ok: true, userQuest: mapUserQuestRow(fallback.data as any) };
}
