import type { ImageSourcePropType } from 'react-native';

import type { QuestTimeframe } from '@/src/types/quest';

const JOURNEY_VALLEY = require('@/assets/images/journey-valley-background.png');
const WEEKLY = require('@/assets/images/journey-timeframe-weekly.png');
const MONTHLY = require('@/assets/images/journey-timeframe-monthly.png');
const YEARLY = require('@/assets/images/journey-timeframe-yearly.png');

const BY_TF: Record<QuestTimeframe, ImageSourcePropType> = {
  weekly: WEEKLY,
  monthly: MONTHLY,
  yearly: YEARLY,
};

/** Background art for quest cards by cadence (shared across categories; tint comes from category accent). */
export function journeyBackgroundForTimeframe(timeframe: QuestTimeframe): ImageSourcePropType {
  return BY_TF[timeframe];
}

/** Hub chrome (empty liked strip, category-empty hero) — neutral valley only. */
export function journeyNeutralBackground(): ImageSourcePropType {
  return JOURNEY_VALLEY;
}
