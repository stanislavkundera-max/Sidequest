export type QuestCategory = 'nature' | 'adventure' | 'social';
export type QuestCadence = 'daily' | 'weekly';

export type Quest = {
  id: string;
  title: string;
  body: string;
  category: QuestCategory;
  cadence: QuestCadence;
  sort_order: number;
  created_at: string;
};

export type UserQuest = {
  id: string;
  user_id: string;
  quest_id: string;
  completed_at: string;
  period_key: string;
};

export type Memory = {
  id: string;
  user_id: string;
  quest_id: string | null;
  body: string;
  photo_path: string | null;
  created_at: string;
};
