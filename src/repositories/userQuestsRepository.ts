import { supabase } from '@/lib/supabase';
import { getWeeklyPeriodKey } from '@/lib/period';
import { countActiveQuestsGlobally, MAX_ACTIVE_QUESTS } from '@/src/features/quests/questHelpers';
import { deriveQuestPresentation } from '@/src/features/quests/questPresentation';
import type { Quest, QuestEnergyLevel, UserQuest, UserQuestStepProgress } from '@/src/types/quest';

export type AssignQuestResult =
  | { ok: true; userQuest: UserQuest }
  | { ok: false; reason: 'not_found' | 'already_active' | 'active_path_full' };

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

/** Any column `snapshotPayloadFromQuest` writes — used to trigger the slim fallback below. */
const SNAPSHOT_COLUMNS = [
  'snapshot_title',
  'snapshot_short',
  'snapshot_category_id',
  'snapshot_estimated_minutes',
  'energy_level',
  'anchor_moment',
  'updated_at',
  'saved_at',
];

function isMissingSnapshotColumnError(error: unknown): boolean {
  return SNAPSHOT_COLUMNS.some((column) => isMissingColumnError(error, column));
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

function parseStepProgressV2(raw: unknown): UserQuestStepProgress {
  if (!raw || typeof raw !== 'object') return {};
  const out: UserQuestStepProgress = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const vv = v as { completedAt?: unknown; evidence?: unknown };
    const completedAt = typeof vv.completedAt === 'string' ? vv.completedAt : '';
    if (!completedAt) continue;
    const ev = vv.evidence as any;
    if (ev && typeof ev === 'object') {
      if (ev.kind === 'calendar' && typeof ev.eventId === 'string' && ev.eventId.trim()) {
        out[k] = { completedAt, evidence: { kind: 'calendar', eventId: ev.eventId.trim() } };
        continue;
      }
      if (ev.kind === 'self_attest') {
        out[k] = { completedAt, evidence: { kind: 'self_attest' } };
        continue;
      }
      if (ev.kind === 'legacy_manual') {
        out[k] = { completedAt, evidence: { kind: 'legacy_manual' } };
        continue;
      }
      if (ev.kind === 'timer' && typeof ev.seconds === 'number' && ev.seconds >= 0) {
        out[k] = { completedAt, evidence: { kind: 'timer', seconds: ev.seconds } };
        continue;
      }
      if (ev.kind === 'text' && typeof ev.text === 'string') {
        out[k] = { completedAt, evidence: { kind: 'text', text: ev.text } };
        continue;
      }
      if (
        ev.kind === 'items' &&
        Array.isArray(ev.items) &&
        ev.items.every((it: unknown) => typeof it === 'string')
      ) {
        out[k] = { completedAt, evidence: { kind: 'items', items: ev.items } };
        continue;
      }
      if (ev.kind === 'photo' && typeof ev.photoUri === 'string' && ev.photoUri.trim()) {
        out[k] = { completedAt, evidence: { kind: 'photo', photoUri: ev.photoUri } };
        continue;
      }
      // Unknown-but-present evidence: keep completion, degrade to self_attest
      // so a future evidence kind never un-completes a step on older builds.
      out[k] = { completedAt, evidence: { kind: 'self_attest' } };
    }
  }
  return out;
}

function parseStepProgressLegacy(raw: unknown): UserQuestStepProgress {
  // Old shape: stepId -> ISO string. Convert to v2 with legacy evidence.
  if (!raw || typeof raw !== 'object') return {};
  const out: UserQuestStepProgress = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) {
      out[k] = { completedAt: v.trim(), evidence: { kind: 'legacy_manual' } };
    }
  }
  return out;
}

const USER_QUEST_STATUSES = new Set<UserQuest['status']>([
  'chosen',
  'active',
  'saved_for_later',
  'completed',
  'dismissed',
]);

function mapUserQuestRow(row: any): UserQuest {
  let statusFromRow = row.status as string | undefined;
  if (!statusFromRow && row.completed_at) statusFromRow = 'completed';
  if (!statusFromRow) statusFromRow = 'active';
  const normalizedStatus: UserQuest['status'] = USER_QUEST_STATUSES.has(
    statusFromRow as UserQuest['status']
  )
    ? (statusFromRow as UserQuest['status'])
    : row.completed_at
      ? 'completed'
      : 'active';

  const energyRaw = row.energy_level as string | null | undefined;
  const energyLevel: QuestEnergyLevel | null | undefined =
    energyRaw === 'low' || energyRaw === 'medium' || energyRaw === 'high' ? energyRaw : null;

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
    updatedAt: (row.updated_at as string | null | undefined) ?? undefined,
    savedAt: (row.saved_at as string | null | undefined) ?? null,
    dismissedAt: (row.dismissed_at as string | null | undefined) ?? null,
    memoryId: (row.memory_id as string | null | undefined) ?? null,
    note: (row.note as string | null) ?? null,
    photoUri: (row.photo_url as string | null) ?? null,
    snapshotTitle: (row.snapshot_title as string | null | undefined) ?? null,
    snapshotShort: (row.snapshot_short as string | null | undefined) ?? null,
    snapshotCategoryId: (row.snapshot_category_id as string | null | undefined) ?? null,
    snapshotEstimatedMinutes:
      typeof row.snapshot_estimated_minutes === 'number'
        ? row.snapshot_estimated_minutes
        : null,
    energyLevel: energyLevel ?? null,
    anchorMoment: (row.anchor_moment as string | null | undefined) ?? null,
    stepProgress: (() => {
      const v2 = parseStepProgressV2(row.step_progress_v2);
      if (Object.keys(v2).length > 0) return v2;
      return parseStepProgressLegacy(row.step_progress);
    })(),
  };
}

function snapshotPayloadFromQuest(quest: Quest, nowIso: string) {
  const pres = deriveQuestPresentation(quest);
  return {
    snapshot_title: quest.title,
    snapshot_short: quest.shortDescription,
    snapshot_category_id: quest.categoryId,
    snapshot_estimated_minutes: quest.estimatedDurationMinutes,
    energy_level: pres.energyLevel,
    anchor_moment: pres.anchorMoment,
    updated_at: nowIso,
  };
}

function stepProgressToLegacyColumn(progress: UserQuestStepProgress): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(progress)) {
    if (!v || typeof v !== 'object') continue;
    if (typeof (v as any).completedAt === 'string' && (v as any).completedAt.trim()) {
      out[k] = (v as any).completedAt.trim();
    }
  }
  return out;
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
    params.userQuests.some((uq) => uq.status === 'active' && uq.questId === params.questId)
  ) {
    return { ok: false, reason: 'already_active' };
  }

  if (countActiveQuestsGlobally(params.userQuests) >= MAX_ACTIVE_QUESTS) {
    return { ok: false, reason: 'active_path_full' };
  }

  const nowIso = new Date().toISOString();
  const snap = snapshotPayloadFromQuest(quest, nowIso);

  const reopen = params.userQuests.find(
    (uq) =>
      uq.questId === params.questId &&
      (uq.status === 'saved_for_later' || uq.status === 'chosen')
  );

  if (reopen) {
    const primary = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .update({
          status: 'active',
          started_at: nowIso,
          saved_at: null,
          dismissed_at: null,
          ...snap,
        })
        .eq('user_id', params.userId)
        .eq('id', reopen.id)
        .select('*')
        .single()
    );
    if (!primary.error) {
      return { ok: true, userQuest: mapUserQuestRow(primary.data as any) };
    }
    if (isAnyUserQuestTableMissingError(primary.error)) {
      throw missingUserQuestTableError();
    }
    if (isMissingSnapshotColumnError(primary.error)) {
      const slim = await runUserQuestQuery((table) =>
        supabase
          .from(table)
          .update({
            status: 'active',
            started_at: nowIso,
          })
          .eq('user_id', params.userId)
          .eq('id', reopen.id)
          .select('*')
          .single()
      );
      if (slim.error) throw slim.error;
      return { ok: true, userQuest: mapUserQuestRow(slim.data as any) };
    }
    throw primary.error;
  }

  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .insert({
        user_id: params.userId,
        quest_id: params.questId,
        status: 'active',
        started_at: nowIso,
        ...snap,
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
  if (isMissingSnapshotColumnError(primary.error)) {
    const legacy = await runUserQuestQuery((table) =>
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
    if (!legacy.error) {
      return { ok: true, userQuest: mapUserQuestRow(legacy.data as any) };
    }
    if (
      !isMissingColumnError(legacy.error, 'status') &&
      !isMissingColumnError(legacy.error, 'started_at')
    ) {
      throw legacy.error;
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
  throw primary.error;
}

export async function saveQuestForLater(params: {
  userId: string;
  questId: string;
  catalog: Quest[];
  userQuests: UserQuest[];
}): Promise<{ ok: true; userQuest: UserQuest } | { ok: false; reason: string }> {
  const quest = params.catalog.find((q) => q.id === params.questId);
  if (!quest) return { ok: false, reason: 'not_found' };

  if (params.userQuests.some((uq) => uq.status === 'active' && uq.questId === params.questId)) {
    return { ok: false, reason: 'already_active' };
  }

  const nowIso = new Date().toISOString();
  const snap = snapshotPayloadFromQuest(quest, nowIso);

  const existing = params.userQuests.find(
    (uq) => uq.questId === params.questId && uq.status === 'saved_for_later'
  );
  if (existing) {
    const upd = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .update({
          saved_at: nowIso,
          dismissed_at: null,
          ...snap,
        })
        .eq('user_id', params.userId)
        .eq('id', existing.id)
        .select('*')
        .single()
    );
    if (!upd.error) {
      return { ok: true, userQuest: mapUserQuestRow(upd.data as any) };
    }
    if (isAnyUserQuestTableMissingError(upd.error)) throw missingUserQuestTableError();
    if (isMissingSnapshotColumnError(upd.error)) {
      const slim = await runUserQuestQuery((table) =>
        supabase
          .from(table)
          .update({ saved_at: nowIso, dismissed_at: null })
          .eq('user_id', params.userId)
          .eq('id', existing.id)
          .select('*')
          .single()
      );
      if (slim.error) throw slim.error;
      return { ok: true, userQuest: mapUserQuestRow(slim.data as any) };
    }
    throw upd.error;
  }

  const ins = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .insert({
        user_id: params.userId,
        quest_id: params.questId,
        status: 'saved_for_later',
        started_at: nowIso,
        saved_at: nowIso,
        ...snap,
      })
      .select('*')
      .single()
  );
  if (!ins.error) {
    return { ok: true, userQuest: mapUserQuestRow(ins.data as any) };
  }
  if (isAnyUserQuestTableMissingError(ins.error)) {
    throw missingUserQuestTableError();
  }
  if (isMissingSnapshotColumnError(ins.error)) {
    const slim = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .insert({
          user_id: params.userId,
          quest_id: params.questId,
          status: 'saved_for_later',
        })
        .select('*')
        .single()
    );
    if (slim.error) throw slim.error;
    return { ok: true, userQuest: mapUserQuestRow(slim.data as any) };
  }
  throw ins.error;
}

/** Un-like: removes a `saved_for_later` row outright (it only ever existed to record the like). */
export async function removeSavedForLaterQuest(params: {
  userId: string;
  userQuestId: string;
}): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_saved_for_later' }> {
  const { data: current, error: findError } = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .select('id, status')
      .eq('user_id', params.userId)
      .eq('id', params.userQuestId)
      .maybeSingle()
  );
  if (findError) {
    if (!isAnyUserQuestTableMissingError(findError)) throw findError;
    throw missingUserQuestTableError();
  }
  if (!current) return { ok: false, reason: 'not_found' };
  const row = current as { status?: string | null };
  if (row.status !== 'saved_for_later') return { ok: false, reason: 'not_saved_for_later' };

  const del = await runUserQuestQuery((table) =>
    supabase.from(table).delete().eq('user_id', params.userId).eq('id', params.userQuestId)
  );
  if (del.error) {
    if (isAnyUserQuestTableMissingError(del.error)) throw missingUserQuestTableError();
    throw del.error;
  }
  return { ok: true };
}

export async function dismissSuggestedQuest(params: {
  userId: string;
  questId: string;
  catalog: Quest[];
  userQuests: UserQuest[];
}): Promise<{ ok: true; userQuest: UserQuest } | { ok: false; reason: string }> {
  const quest = params.catalog.find((q) => q.id === params.questId);
  if (!quest) return { ok: false, reason: 'not_found' };

  if (
    params.userQuests.some(
      (uq) =>
        uq.questId === params.questId &&
        (uq.status === 'active' || uq.status === 'saved_for_later' || uq.status === 'chosen')
    )
  ) {
    return { ok: false, reason: 'has_engagement' };
  }

  const nowIso = new Date().toISOString();
  const snap = snapshotPayloadFromQuest(quest, nowIso);

  const ins = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .insert({
        user_id: params.userId,
        quest_id: params.questId,
        status: 'dismissed',
        started_at: nowIso,
        dismissed_at: nowIso,
        ...snap,
      })
      .select('*')
      .single()
  );
  if (!ins.error) {
    return { ok: true, userQuest: mapUserQuestRow(ins.data as any) };
  }
  if (isAnyUserQuestTableMissingError(ins.error)) {
    throw missingUserQuestTableError();
  }
  if (isMissingColumnError(ins.error, 'dismissed_at') || isMissingSnapshotColumnError(ins.error)) {
    const slim = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .insert({
          user_id: params.userId,
          quest_id: params.questId,
          status: 'dismissed',
        })
        .select('*')
        .single()
    );
    if (slim.error) throw slim.error;
    return { ok: true, userQuest: mapUserQuestRow(slim.data as any) };
  }
  throw ins.error;
}

export async function updateUserQuestStepProgress(params: {
  userId: string;
  userQuestId: string;
  stepProgress: UserQuestStepProgress;
}): Promise<UserQuest | null> {
  // Prefer v2 column for evidence-capable progress.
  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({ step_progress_v2: params.stepProgress })
      .eq('id', params.userQuestId)
      .eq('user_id', params.userId)
      .select('*')
      .single()
  );
  if (!primary.error) return mapUserQuestRow(primary.data as any);

  if (isMissingColumnError(primary.error, 'step_progress_v2')) {
    // Backwards-compat: write the legacy column if v2 doesn't exist yet.
    const fallback = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .update({ step_progress: stepProgressToLegacyColumn(params.stepProgress) })
        .eq('id', params.userQuestId)
        .eq('user_id', params.userId)
        .select('*')
        .single()
    );
    if (!fallback.error) return mapUserQuestRow(fallback.data as any);
    if (isMissingColumnError(fallback.error, 'step_progress')) return null;
    if (isAnyUserQuestTableMissingError(fallback.error)) throw missingUserQuestTableError();
    throw fallback.error;
  }
  if (isAnyUserQuestTableMissingError(primary.error)) throw missingUserQuestTableError();
  throw primary.error;
}

/**
 * Move an active quest to For later — preserves journey progress; does not delete the row.
 */
export async function moveActiveQuestToLater(params: {
  userId: string;
  userQuestId: string;
}): Promise<{ ok: true; userQuest: UserQuest } | { ok: false; reason: 'not_found' | 'not_active' }> {
  const nowIso = new Date().toISOString();
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

  const upd = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({
        status: 'saved_for_later',
        saved_at: nowIso,
        updated_at: nowIso,
      })
      .eq('user_id', params.userId)
      .eq('id', params.userQuestId)
      .select('*')
      .single()
  );
  if (!upd.error) {
    return { ok: true, userQuest: mapUserQuestRow(upd.data as any) };
  }
  if (isAnyUserQuestTableMissingError(upd.error)) {
    throw missingUserQuestTableError();
  }
  if (isMissingColumnError(upd.error, 'saved_at') || isMissingColumnError(upd.error, 'updated_at')) {
    const slim = await runUserQuestQuery((table) =>
      supabase
        .from(table)
        .update({
          status: 'saved_for_later',
        })
        .eq('user_id', params.userId)
        .eq('id', params.userQuestId)
        .select('*')
        .single()
    );
    if (slim.error) throw slim.error;
    return { ok: true, userQuest: mapUserQuestRow(slim.data as any) };
  }
  throw upd.error;
}

/** @deprecated Prefer `moveActiveQuestToLater` — kept for call sites during transition. */
export async function deactivateActiveUserQuest(params: {
  userId: string;
  userQuestId: string;
}): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'not_active' }> {
  const r = await moveActiveQuestToLater(params);
  if (!r.ok) return r;
  return { ok: true };
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
  const mapped = mapUserQuestRow(currentRow);
  if (mapped.status !== 'active') return { ok: false, reason: 'not_active' };

  const nowIso = new Date().toISOString();
  const primary = await runUserQuestQuery((table) =>
    supabase
      .from(table)
      .update({
        status: 'completed',
        completed_at: nowIso,
        updated_at: nowIso,
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

/** Admin tool: wipes every quest engagement row (active/saved/completed/dismissed) for a user. */
export async function deleteAllUserQuestsForUser(userId: string): Promise<void> {
  const primary = await runUserQuestQuery((table) =>
    supabase.from(table).delete().eq('user_id', userId)
  );
  if (primary.error && !isAnyUserQuestTableMissingError(primary.error)) {
    throw primary.error;
  }
}
