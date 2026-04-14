import { supabase } from '@/lib/supabase';
import { SEED_CATEGORIES } from '@/src/constants/categories';
import { enrichQuestWithJourney } from '@/src/constants/questJourneys';
import { SEED_QUESTS } from '@/src/constants/quests';
import type { Category } from '@/src/types/category';
import type { Quest, QuestActionStep } from '@/src/types/quest';

function mapCategoryRow(row: any): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
  };
}

function parseActionSteps(raw: unknown): QuestActionStep[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (s): s is QuestActionStep =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as QuestActionStep).id === 'string' &&
        typeof (s as QuestActionStep).title === 'string'
    );
  }
  return [];
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
