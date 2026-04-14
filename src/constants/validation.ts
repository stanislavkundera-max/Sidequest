export const VALIDATION_EVENT_NAMES = [
  'app_opened',
  'home_viewed',
  'profile_viewed',
  'onboarding_started',
  'onboarding_completed',
  'onboarding_skipped',
  'category_preferences_selected',
  'intensity_selected',
  'quest_list_viewed',
  'quest_detail_viewed',
  'quest_activated',
  'quest_activation_failed_limit_reached',
  'quest_deactivated',
  'quest_completed',
  'quest_completion_abandoned',
  'memory_creation_started',
  'memory_created',
  'memory_creation_failed',
  'memory_viewed',
  'memories_timeline_viewed',
  'returned_day_2',
  'returned_day_7',
  'quest_feedback_submitted',
  'quest_step_completed',
] as const;

export type ValidationEventName = (typeof VALIDATION_EVENT_NAMES)[number];

export const STAGE_6_HYPOTHESES = [
  'Users will activate at least one quest in their first session.',
  'Users will complete at least one quest in their first week.',
  'Users will create memories for completed quests.',
  'Memory logging increases return behavior.',
] as const;

export const STAGE_6_SUCCESS_METRICS = [
  'onboarding_completion_rate',
  'quest_activation_rate',
  'quest_completion_rate',
  'memory_creation_rate',
  'd2_return_rate',
  'd7_return_rate',
] as const;
