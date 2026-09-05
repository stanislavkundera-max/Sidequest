import { supabase } from '@/lib/supabase';
import { SEED_CATEGORIES } from '@/src/constants/categories';
import { enrichQuestWithJourney } from '@/src/constants/questJourneys';
import { SEED_QUESTS } from '@/src/constants/quests';
import type { Category } from '@/src/types/category';
import type {
  Quest,
  QuestActionStep,
  QuestStepInteraction,
  QuestSuggestedGroup,
} from '@/src/types/quest';

function parseSuggestedGroup(raw: unknown): QuestSuggestedGroup | undefined {
  if (
    raw === 'do_now' ||
    raw === 'low_energy' ||
    raw === 'outside' ||
    raw === 'social' ||
    raw === 'weekend'
  ) {
    return raw;
  }
  return undefined;
}

function mapCategoryRow(row: any): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
  };
}

/** Validates a step interaction from DB jsonb; unknown shapes are dropped. */
function parseInteraction(raw: unknown): QuestStepInteraction | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const i = raw as Record<string, unknown>;
  switch (i.kind) {
    case 'confirm':
      return { kind: 'confirm' };
    case 'timer':
      if (typeof i.minSeconds === 'number' && i.minSeconds > 0) {
        return {
          kind: 'timer',
          minSeconds: i.minSeconds,
          runningHint: typeof i.runningHint === 'string' ? i.runningHint : undefined,
        };
      }
      return undefined;
    case 'input':
      if (typeof i.prompt === 'string') {
        return {
          kind: 'input',
          prompt: i.prompt,
          minChars: typeof i.minChars === 'number' ? i.minChars : undefined,
          placeholder: typeof i.placeholder === 'string' ? i.placeholder : undefined,
        };
      }
      return undefined;
    case 'counter':
      if (typeof i.prompt === 'string' && typeof i.count === 'number' && i.count > 0) {
        return {
          kind: 'counter',
          prompt: i.prompt,
          count: i.count,
          itemLabel: typeof i.itemLabel === 'string' ? i.itemLabel : undefined,
        };
      }
      return undefined;
    case 'photo':
      return {
        kind: 'photo',
        prompt: typeof i.prompt === 'string' ? i.prompt : undefined,
      };
    default:
      return undefined;
  }
}

function parseActionSteps(raw: unknown): QuestActionStep[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is Record<string, unknown> =>
        typeof s === 'object' &&
        s !== null &&
        typeof s.id === 'string' &&
        typeof s.title === 'string'
    )
    .map((s) => {
      const step: QuestActionStep = {
        id: s.id as string,
        title: s.title as string,
      };
      if (typeof s.detail === 'string') step.detail = s.detail;
      if (typeof s.tip === 'string') step.tip = s.tip;
      if (typeof s.estimateMinutes === 'number') step.estimateMinutes = s.estimateMinutes;
      if (s.action && typeof s.action === 'object' && s.action !== null) {
        const kind = (s.action as { kind?: unknown }).kind;
        if (kind === 'calendar') {
          step.action = s.action as NonNullable<QuestActionStep['action']>;
        }
      }
      const interaction = parseInteraction(s.interaction);
      if (interaction) step.interaction = interaction;
      return step;
    });
}

function mapQuestRow(row: any): Quest {
  const base: Quest = {
    id: row.id as string,
    title: row.title as string,
    shortDescription: row.short_description as string,
    fullDescription: row.full_description as string,
    categoryId: row.category_id as string,
    timeframe: row.timeframe as Quest['timeframe'],
    difficulty: row.difficulty as Quest['difficulty'],
    estimatedDurationMinutes: row.estimated_duration_minutes as number,
    promptForReflection: row.prompt_for_reflection as string,
    suggestedProofType: row.suggested_proof_type as Quest['suggestedProofType'],
    journeyIntro: (row.journey_intro as string | null | undefined) ?? undefined,
    actionSteps: parseActionSteps(row.action_steps),
    isActive: row.is_active !== false,
    suggestedGroup: parseSuggestedGroup(row.suggested_group) ?? null,
    createdAt: (row.created_at as string | null | undefined) ?? undefined,
  };
  return enrichQuestWithJourney(base);
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []).map(mapCategoryRow);
    return rows.length > 0 ? rows : SEED_CATEGORIES;
  } catch (error) {
    console.warn('Falling back to local categories:', error);
    return SEED_CATEGORIES;
  }
}

export async function fetchQuestCatalog(): Promise<Quest[]> {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('timeframe', { ascending: true })
      .order('title', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []).map(mapQuestRow);
    return rows.length > 0 ? rows : SEED_QUESTS.map(enrichQuestWithJourney);
  } catch (error) {
    console.warn('Falling back to local quest catalog:', error);
    return SEED_QUESTS;
  }
}
