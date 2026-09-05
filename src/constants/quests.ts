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

  // —— Added 2026-09-05 ——————————————————————————————————————————————
  // Written to bring every category/timeframe bucket to at least three, after
  // round-1 testers called the catalogue thin. Relax/monthly was empty
  // entirely. `createdAt` is deliberately omitted here: the local catalogue is
  // the offline fallback, and the Supabase rows carry the real dates that drive
  // the "newly added first" ordering.

  // —— Nature ——
  {
    id: 'q-w-11',
    title: 'Eat one meal outside, whatever the weather',
    shortDescription: 'A step, a bench, a wall — anywhere with sky above it.',
    fullDescription:
      'Take one meal you were going to eat anyway and eat it outdoors. A doorstep counts. Rain counts. Bring the coat instead of changing the plan.',
    categoryId: 'cat-nature',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 30,
    promptForReflection: 'What did you notice that the kitchen table never shows you?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-w-12',
    title: 'Find the oldest tree on your street',
    shortDescription: 'Look up. Decide which one was here first.',
    fullDescription:
      'Walk your street and pick the tree that has been there longest — thickest trunk, highest crown, most stubborn roots in the pavement. You do not need to be right, only to look properly.',
    categoryId: 'cat-nature',
    timeframe: 'weekly',
    difficulty: 'medium',
    estimatedDurationMinutes: 30,
    promptForReflection: 'How long had you walked past it without seeing it?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-m-07',
    title: 'Watch the sun come up somewhere outdoors',
    shortDescription: 'Be in place before the light is.',
    fullDescription:
      'Pick somewhere with an open view — a hill, a field, a bridge, a long street facing east — and be there before the sun clears the horizon. Stay until it is fully up.',
    categoryId: 'cat-nature',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 90,
    promptForReflection: 'What was the place like before the light reached it?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-m-08',
    title: 'Walk a river from one bridge to the next',
    shortDescription: 'Follow moving water instead of a route.',
    fullDescription:
      'Find a river, canal or stream and walk its bank from one crossing to the next. Let the water decide the direction — you are following it, not navigating.',
    categoryId: 'cat-nature',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 120,
    promptForReflection: 'What was on the bank that you would never have driven past?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-y-05',
    title: 'Spend a night somewhere with no street lights',
    shortDescription: 'Far enough out that the sky actually has stars in it.',
    fullDescription:
      'Get far enough from a town that the sky goes properly dark — a cabin, a campsite, a friend’s place in the middle of nowhere. Go outside after dark and stay out long enough for your eyes to adjust.',
    categoryId: 'cat-nature',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 720,
    promptForReflection: 'How long did it take before you could see more than you expected?',
    suggestedProofType: 'text',
    suggestedGroup: 'weekend',
  },

  // —— Adventure ——
  {
    id: 'q-w-13',
    title: 'Get off two stops early and walk the rest',
    shortDescription: 'Same journey, different last mile.',
    fullDescription:
      'On a trip you were making anyway, get off two stops before yours and walk. Take whichever way looks more interesting rather than the shortest.',
    categoryId: 'cat-adventure',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 35,
    promptForReflection: 'What was on that stretch you had only ever seen through a window?',
    suggestedProofType: 'photo',
    suggestedGroup: 'do_now',
  },
  {
    id: 'q-w-14',
    title: 'Order the thing you cannot pronounce',
    shortDescription: 'Point at the menu and find out.',
    fullDescription:
      'In any café, bakery or restaurant, order the item you do not recognise instead of your usual. Ask what it is only after it arrives.',
    categoryId: 'cat-adventure',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 45,
    promptForReflection: 'Was it better or worse than the thing you would have ordered?',
    suggestedProofType: 'photo',
    suggestedGroup: 'do_now',
  },
  {
    id: 'q-w-15',
    title: 'Take the first turn you have never taken',
    shortDescription: 'Leave your door and turn the wrong way on purpose.',
    fullDescription:
      'Walk out and take the first turning you have never been down. Follow it as far as it stays interesting, then find your own way back.',
    categoryId: 'cat-adventure',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 40,
    promptForReflection: 'How close to home was something you had never seen?',
    suggestedProofType: 'photo',
    suggestedGroup: 'outside',
  },
  {
    id: 'q-m-09',
    title: 'Swim in a river you had to walk to reach',
    shortDescription: 'Moving water, trees around it, no car park.',
    fullDescription:
      'Find wild water you have to walk to — a river, a stream pool, a forest lake — and get in. Not a swimming pool and not a beach you can park at. Check the depth and the current before you commit, and take someone with you.',
    categoryId: 'cat-adventure',
    timeframe: 'monthly',
    difficulty: 'hard',
    estimatedDurationMinutes: 180,
    promptForReflection: 'How long did it take to get in?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-y-06',
    title: 'Travel somewhere by a way you have never used',
    shortDescription: 'Night train, ferry, bike, on foot — anything but your default.',
    fullDescription:
      'Make a real journey using a means of transport you have never taken: a sleeper train, a ferry, a long ride, two days of walking. The destination matters less than how you get there.',
    categoryId: 'cat-adventure',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 1440,
    promptForReflection: 'What did the slower way show you that flying would have skipped?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },

  // —— Social ——
  {
    id: 'q-w-16',
    title: 'Ask someone how they ended up doing what they do',
    shortDescription: 'One real question instead of small talk.',
    fullDescription:
      'With anyone you talk to this week — a colleague, a neighbour, someone behind a counter — ask how they got into what they do. Then let them answer properly.',
    categoryId: 'cat-social',
    timeframe: 'weekly',
    difficulty: 'medium',
    estimatedDurationMinutes: 20,
    promptForReflection: 'What did you learn that you would never have guessed?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },
  {
    id: 'q-w-17',
    title: 'Eat with someone, phones away',
    shortDescription: 'One meal, two people, nothing on the table.',
    fullDescription:
      'Share a meal with someone and put both phones somewhere else — a bag, a shelf, another room. Face down on the table does not count.',
    categoryId: 'cat-social',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 60,
    promptForReflection: 'What did you end up talking about?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },
  {
    id: 'q-w-18',
    title: 'Thank someone specifically, out loud',
    shortDescription: 'Name the actual thing, to their face or on the phone.',
    fullDescription:
      'Pick someone who did something for you and tell them exactly what it was and what it meant. In person or by voice — not a message.',
    categoryId: 'cat-social',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 15,
    promptForReflection: 'How did they react to being told the specific thing?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },
  {
    id: 'q-m-10',
    title: 'Invite someone you barely know to do something',
    shortDescription: 'The person you always say “we should” to.',
    fullDescription:
      'Think of someone you like but have never actually made plans with, and propose something specific with a date attached. A walk, a coffee, a match — anything with a time on it.',
    categoryId: 'cat-social',
    timeframe: 'monthly',
    difficulty: 'hard',
    estimatedDurationMinutes: 120,
    promptForReflection: 'What made it easier or harder than you expected to ask?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },
  {
    id: 'q-y-07',
    title: 'Spend a whole day with someone you usually see for an hour',
    shortDescription: 'The same person, without the clock.',
    fullDescription:
      'Take someone you normally see in short bursts — a parent, a sibling, an old friend — and spend a full day together. No agenda beyond being there for the length of it.',
    categoryId: 'cat-social',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 480,
    promptForReflection: 'What came up once you were past the first two hours?',
    suggestedProofType: 'text',
    suggestedGroup: 'social',
  },

  // —— Relax ——
  {
    id: 'q-w-19',
    title: 'Read on paper somewhere that is not home',
    shortDescription: 'A book, a café or a park, thirty minutes.',
    fullDescription:
      'Take something printed — book, magazine, newspaper — somewhere that is not your flat, and read it there for half an hour.',
    categoryId: 'cat-relax',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 40,
    promptForReflection: 'Did reading somewhere else change how much of it stuck?',
    suggestedProofType: 'text',
    suggestedGroup: 'low_energy',
  },
  {
    id: 'q-w-20',
    title: 'Take the long way home',
    shortDescription: 'Add fifteen minutes to a journey you make anyway.',
    fullDescription:
      'On a trip home you were making regardless, deliberately take a longer route. No destination, no errand attached — just the extra distance.',
    categoryId: 'cat-relax',
    timeframe: 'weekly',
    difficulty: 'easy',
    estimatedDurationMinutes: 30,
    promptForReflection: 'What did the extra fifteen minutes give you?',
    suggestedProofType: 'text',
    suggestedGroup: 'low_energy',
  },
  {
    id: 'q-m-11',
    title: 'Book two hours at a sauna, bathhouse, or pool',
    shortDescription: 'Somewhere you can sit in the heat and do nothing useful.',
    fullDescription:
      'Find a public sauna, bathhouse or thermal pool within reach and book two hours. Go with nothing planned for afterwards.',
    categoryId: 'cat-relax',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 150,
    promptForReflection: 'How long before you stopped checking the time?',
    suggestedProofType: 'text',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-m-12',
    title: 'Take yourself out for a slow breakfast',
    shortDescription: 'A table, alone, and nowhere to be after.',
    fullDescription:
      'Go out for breakfast on your own with an hour of nothing after it. Bring something to read if you want, but leave the laptop.',
    categoryId: 'cat-relax',
    timeframe: 'monthly',
    difficulty: 'easy',
    estimatedDurationMinutes: 90,
    promptForReflection: 'What was it like eating somewhere without waiting for anyone?',
    suggestedProofType: 'photo',
    suggestedGroup: 'low_energy',
  },
  {
    id: 'q-m-13',
    title: 'Make something with your hands and give it away',
    shortDescription: 'Bread, a shelf, a drawing — then hand it over.',
    fullDescription:
      'Make one physical thing from start to finish and give it to someone. It does not need to be good. It needs to be finished and gone.',
    categoryId: 'cat-relax',
    timeframe: 'monthly',
    difficulty: 'medium',
    estimatedDurationMinutes: 180,
    promptForReflection: 'What was harder — making it, or handing it over?',
    suggestedProofType: 'photo',
    suggestedGroup: 'weekend',
  },
  {
    id: 'q-y-08',
    title: 'Go somewhere quiet for a whole weekend',
    shortDescription: 'Two nights somewhere with less going on than home.',
    fullDescription:
      'Book two nights somewhere quieter than where you live — a village, a cabin, a coast out of season. Arrive with no list of things to see.',
    categoryId: 'cat-relax',
    timeframe: 'yearly',
    difficulty: 'hard',
    estimatedDurationMinutes: 2880,
    promptForReflection: 'Which day did you actually start to slow down?',
    suggestedProofType: 'photo',
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
