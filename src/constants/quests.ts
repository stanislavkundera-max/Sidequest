import type { Quest } from '@/src/types/quest';

import { SEED_CATEGORIES } from '@/src/constants/categories';
import { enrichQuestWithJourney } from '@/src/constants/questJourneys';

export { SEED_CATEGORIES };

/** Catalog rows before journey enrichment (see `questJourneys.ts`). */
const SEED_QUESTS_RAW: Array<Omit<Quest, 'journeyIntro' | 'actionSteps'>> = [
  // —— Weekly (10) ——
  {
    id: 'q-w-01',
    title: 'Walk 20 minutes without headphones',
    shortDescription: 'Leave earbuds at home; listen to the street or birds.',
    fullDescription:
      'Pick any outdoor loop or errand route. Walk at least 20 minutes with no podcasts or music. Notice three distinct sounds before you return.',
    categoryId: 'cat-nature',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 25,
    promptForReflection: 'Which sound stuck with you after you stopped?',
    suggestedProofType: 'text',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-w-02',
    title: 'Sit on a bench for 10 minutes',
    shortDescription: 'Find a public bench; sit and watch people pass.',
    fullDescription:
      'No scrolling. Set a timer for 10 minutes on any park or street bench. Observe movement, light, and weather.',
    categoryId: 'cat-relax',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 15,
    promptForReflection: 'What detail would you not have noticed if you had kept walking?',
    suggestedProofType: 'none',
    suggestedGroup: 'do_now',
  },
  {
    id: 'q-w-03',
    title: 'Cook one meal from scratch',
    shortDescription: 'No kits: chop vegetables and use the stove yourself.',
    fullDescription:
      'Make one full plate (breakfast, lunch, or dinner) using raw ingredients only—no microwave-only meals. Wash up when done.',
    categoryId: 'cat-relax',
    timeframe: 'weekly',
    difficulty: 'medium',
    estimatedDurationMinutes: 45,
    promptForReflection: 'Did the process feel slower or more satisfying than usual?',
    suggestedProofType: 'photo',
    suggestedGroup: 'low_energy',
  },
  {
    id: 'q-w-04',
    title: 'Take a bus or train one stop past your usual',
    shortDescription: 'Ride transit one stop farther, then walk back.',
    fullDescription:
      'Use public transit if available. Get off one stop after your normal stop and walk home or to your destination. If you drive, park 10 minutes farther once.',
    categoryId: 'cat-adventure',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 30,
    promptForReflection: 'What did you see on the extra stretch that you usually skip?',
    suggestedProofType: 'text',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-w-05',
    title: 'Message someone you have not texted in 30 days',
    shortDescription: 'Send one genuine check-in—no mass forwards.',
    fullDescription:
      'Choose one person. Write 2–4 sentences asking how they are or referencing something specific you remember about them.',
    categoryId: 'cat-social',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 10,
    promptForReflection: 'How did it feel to reach out without an agenda?',
    suggestedProofType: 'none',
    suggestedGroup: 'social',
  },
  {
    id: 'q-w-06',
    title: 'Identify three plants on your block',
    shortDescription: 'Use a book or app; write their common names.',
    fullDescription:
      'Walk your block once. Name three plants (trees, weeds, or flowers). If unsure, use a free plant ID app or a field guide from the library.',
    categoryId: 'cat-nature',
    timeframe: 'weekly',
    difficulty: 'medium',
    estimatedDurationMinutes: 35,
    promptForReflection: 'Did knowing the names change how you looked at the street?',
    suggestedProofType: 'text',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-w-07',
    title: 'Visit a shop you have never entered',
    shortDescription: 'Step inside; stay at least 5 minutes.',
    fullDescription:
      'Pick any local store, bakery, or shop you always pass. Go in, browse, and optionally buy one small item or thank the staff and leave.',
    categoryId: 'cat-adventure',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 25,
    promptForReflection: 'What surprised you once you crossed the threshold?',
    suggestedProofType: 'text',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-w-08',
    title: 'Drink morning coffee or tea outside',
    shortDescription: 'First cup of the day on a balcony, stoop, or yard.',
    fullDescription:
      'Prepare your drink as usual. Consume the first cup outdoors (balcony counts). No work email during the cup.',
    categoryId: 'cat-relax',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 15,
    promptForReflection: 'How did outdoor light change the start of your day?',
    suggestedProofType: 'photo',
    suggestedGroup: 'do_now',
  },
  {
    id: 'q-w-09',
    title: 'Have a 15-minute voice or video call',
    shortDescription: 'Real-time talk with one person—no voice notes.',
    fullDescription:
      'Schedule or place a spontaneous call. Talk about something concrete (weekend plans, a book, a walk) for at least 15 minutes.',
    categoryId: 'cat-social',
    timeframe: 'weekly',
    difficulty: 'medium',
    estimatedDurationMinutes: 20,
    promptForReflection: 'What was easier live than in text?',
    suggestedProofType: 'none',
    suggestedGroup: 'social',
  },
  {
    id: 'q-w-10',
    title: 'Pick up five pieces of litter on one walk',
    shortDescription: 'Bring a bag; dispose of trash properly.',
    fullDescription:
      'On any walk, collect five small pieces of litter wearing gloves or using a bag as a barrier. Recycle if possible; otherwise bin.',
    categoryId: 'cat-nature',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 30,
    promptForReflection: 'Did the place feel different after you left it cleaner?',
    suggestedProofType: 'text',
    suggestedGroup: 'outside',
  },

  // —— Monthly (6) ——
  {
    id: 'q-m-01',
    title: 'Hike or walk a marked trail you have not done',
    shortDescription: 'Use an official trail; follow posted signs.',
    fullDescription:
      'Choose a trail or signed path at least 3 km total (or 45 minutes). Bring water. Stop once to read the map or a sign aloud.',
    categoryId: 'cat-nature',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 120,
    promptForReflection: 'Where on the trail did you feel most away from routine?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-m-02',
    title: 'Host or attend one in-person gathering',
    shortDescription: 'At least three people including you; not a work meeting.',
    fullDescription:
      'Coffee, potluck, board games, or a walk with friends counts. Aim for 60+ minutes together. Phones away except for photos.',
    categoryId: 'cat-social',
    timeframe: 'monthly',
    difficulty: 'hard',
    estimatedDurationMinutes: 90,
    promptForReflection: 'What would you repeat next month?',
    suggestedProofType: 'photo',
    suggestedGroup: 'social',
  },
  {
    id: 'q-m-03',
    title: 'Try a new cuisine at a sit-down restaurant',
    shortDescription: 'Order two dishes you have never tried from that tradition.',
    fullDescription:
      'Pick a cuisine that is new to you (Ethiopian, regional Chinese, etc.). Eat in or proper takeout with time to taste—not desk lunch.',
    categoryId: 'cat-adventure',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 90,
    promptForReflection: 'Which flavor or texture will you remember?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-m-05',
    title: 'Volunteer one shift of 2+ hours',
    shortDescription: 'Sign up with an organization; show up on time.',
    fullDescription:
      'Food bank, park cleanup, animal shelter, or community fridge. Complete one scheduled session of at least two hours.',
    categoryId: 'cat-social',
    timeframe: 'monthly',
    difficulty: 'hard',
    estimatedDurationMinutes: 150,
    promptForReflection: 'What task did you not expect to do?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },
  {
    id: 'q-m-06',
    title: 'Sleep outside your home one night',
    shortDescription: 'Camping, cabin, or trusted friend’s guest room counts.',
    fullDescription:
      'Spend one full night away from your usual bed—tent, hostel, or overnight train in a sleeper berth counts if booked in advance.',
    categoryId: 'cat-adventure',
    timeframe: 'monthly',
    difficulty: 'hard',
    estimatedDurationMinutes: 720,
    promptForReflection: 'What felt different when you woke up?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },

  // —— Yearly (4) ——
  {
    id: 'q-y-01',
    title: 'Take a trip at least 100 km from home',
    shortDescription: 'Stay overnight; plan transport and lodging ahead.',
    fullDescription:
      'Travel by any mode to a place at least 100 km away, stay at least one night, and do one activity there you cannot do at home.',
    categoryId: 'cat-adventure',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 2880,
    promptForReflection: 'What from the trip do you want to keep in daily life?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-y-02',
    title: 'Learn one outdoor skill in a class or with a guide',
    shortDescription: 'Examples: climbing intro, kayaking, navigation, foraging.',
    fullDescription:
      'Book a single session with an instructor or guided group. Show up prepared per their list and complete the session.',
    categoryId: 'cat-nature',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 240,
    promptForReflection: 'Would you do it again without the instructor?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-y-03',
    title: 'Reconnect with someone you lost touch with for a year+',
    shortDescription: 'In-person meet preferred; otherwise video call 45+ min.',
    fullDescription:
      'Reach out, explain you want to catch up, and meet or call for at least 45 minutes. Listen more than you talk for the first half.',
    categoryId: 'cat-social',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 60,
    promptForReflection: 'What felt restored—or honestly closed?',
    suggestedProofType: 'none',
    suggestedGroup: 'social',
  },
  {
    id: 'q-y-04',
    title: 'Do a full day with no work or chores',
    shortDescription: 'One waking day: no email, errands, or house projects.',
    fullDescription:
      'Pick a weekend or holiday. No paid work, no cleaning marathons, no “quick” fixes. Spend the day on rest, play, or people.',
    categoryId: 'cat-relax',
    timeframe: 'yearly',
    difficulty: 'medium',
    estimatedDurationMinutes: 960,
    promptForReflection: 'What did your body do when nothing was “productive”?',
    suggestedProofType: 'text',
    suggestedGroup: 'weekend',
  },
];

/** Local catalog: 10 weekly, 6 monthly, 4 yearly — concrete, executable quests. */
export const SEED_QUESTS: Quest[] = SEED_QUESTS_RAW.map((q) =>
  enrichQuestWithJourney({ ...q, actionSteps: [] })
);

export function getQuestById(id: string): Quest | undefined {
  return SEED_QUESTS.find((q) => q.id === id);
}

export function getQuestsByTimeframe(
  timeframe: Quest['timeframe']
): Quest[] {
  return SEED_QUESTS.filter((q) => q.timeframe === timeframe);
}
