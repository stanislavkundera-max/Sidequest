import type { Quest, QuestActionStep } from '@/src/types/quest';

/**
 * Default journey copy + steps for each catalog quest id (used when DB has empty action_steps).
 * Keep `scripts/quest-journeys-data.cjs` in sync for `supabase/seed.sql` generation.
 */
export const QUEST_JOURNEY_BY_ID: Record<
  string,
  { journeyIntro?: string; actionSteps: QuestActionStep[] }
> = {
  'q-w-01': {
    journeyIntro: 'A short walk with only the world as your soundtrack.',
    actionSteps: [
      {
        id: 's1',
        title: 'Leave podcasts and music behind',
        detail: 'Earbuds stay home or stay in your pocket for this walk.',
        tip: 'Choose a quieter stretch or a pocket park—let wind and distant voices be your opening track.',
        estimateMinutes: 1,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Walk at least 20 minutes outside',
        detail: 'Any loop or errand route counts.',
        tip: 'If you can, cut past a patch of green—pause once to watch birds or leaves before naming anything.',
        estimateMinutes: 20,
        interaction: {
          kind: 'timer',
          minSeconds: 20 * 60,
          runningHint: 'Lock your phone and walk — the timer keeps counting on its own.',
        },
      },
      {
        id: 's3',
        title: 'Notice three distinct sounds',
        detail: 'Before you finish, name them quietly to yourself.',
        tip: 'When a new sound arrives, stand still one breath—notice distance and texture before you label it.',
        estimateMinutes: 5,
        interaction: {
          kind: 'counter',
          prompt: 'Name the three sounds you noticed on the walk.',
          count: 3,
          itemLabel: 'sound',
        },
      },
    ],
  },
  'q-w-02': {
    journeyIntro: 'Ten minutes of stillness in public—no feed, just the scene.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find a bench with a view',
        tip: 'Pick a seat where sky or treeline meets buildings—soft horizons calm the eyes faster than walls.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Set a 10-minute timer',
        detail: 'No scrolling.',
        tip: 'Start the timer only after the phone is away; one slow exhale helps the switch feel kind.',
        estimateMinutes: 1,
        interaction: {
          kind: 'timer',
          minSeconds: 10 * 60,
          runningHint: 'This is the timer. Phone away now — just sit and watch.',
        },
      },
      {
        id: 's3',
        title: 'Watch light, people, and weather until the timer ends',
        tip: 'Let your gaze drift like a slow pan—fabric moving, light on skin, clouds reshaping.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'Describe one thing you watched — light, a person, weather.',
          minChars: 20,
          placeholder: 'A woman fed pigeons while the light turned orange…',
        },
      },
    ],
  },
  'q-w-03': {
    journeyIntro: 'Cook a real meal with your hands, not a kit.',
    actionSteps: [
      {
        id: 's1',
        title: 'Choose raw ingredients only',
        detail: 'Skip microwave-only shortcuts.',
        tip: 'Walk the produce table twice—color often suggests simpler meals than the recipe rabbit hole.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What are you cooking? List your main raw ingredients.',
          minChars: 15,
          placeholder: 'Tomato pasta: tomatoes, garlic, basil…',
        },
      },
      {
        id: 's2',
        title: 'Chop, heat, and plate one full meal',
        tip: 'Chop in silence for a few minutes—sizzling oil is its own small soundtrack.',
        estimateMinutes: 35,
        interaction: {
          kind: 'photo',
          prompt: 'Plate it, then snap a photo of the finished meal.',
        },
      },
      {
        id: 's3',
        title: 'Wash up when done',
        tip: 'Rinse with warm water only; treat closing the kitchen as a gentle chapter end, not a sprint.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-w-04': {
    journeyIntro: 'Stretch your route by one stop—see what you usually skip.',
    actionSteps: [
      {
        id: 's1',
        title: 'Ride or drive one stop farther',
        tip: 'Take the long curve around a block you usually shortcut—curiosity over efficiency for one leg.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Walk the extra stretch mindfully',
        tip: 'Match someone else’s pace for thirty seconds—borrow calm, then return to yours.',
        estimateMinutes: 15,
        interaction: {
          kind: 'timer',
          minSeconds: 10 * 60,
          runningHint: 'Walk it slowly. The timer runs even with the phone locked.',
        },
      },
      {
        id: 's3',
        title: 'Note one thing you never saw before',
        tip: 'Skip the photo; keep one image in memory first—writing it down seals it better.',
        estimateMinutes: 2,
        interaction: {
          kind: 'input',
          prompt: 'What did you see that you had never noticed before?',
          minChars: 20,
          placeholder: 'A blue door with a hand-painted number…',
        },
      },
    ],
  },
  'q-w-05': {
    journeyIntro: 'One honest message to someone you have not spoken to lately.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick one person',
        tip: 'Picture their face before typing—warmth hides in specifics, not in length.',
        estimateMinutes: 2,
        interaction: {
          kind: 'input',
          prompt: 'Who is it — and why them, right now?',
          minChars: 10,
          placeholder: 'Marta — she moved away and I keep thinking of her…',
        },
      },
      {
        id: 's2',
        title: 'Write 2–4 genuine sentences',
        detail: 'No mass forwards.',
        tip: 'Mention one ordinary shared detail—weather, food, a street—it bridges distance quietly.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'Draft the message here first — then copy it into your chat.',
          minChars: 40,
          placeholder: 'Hey, I walked past that bakery we loved and thought of you…',
        },
      },
      {
        id: 's3',
        title: 'Send it',
        tip: 'Send before you polish again; sincerity beats perfect wording.',
        estimateMinutes: 1,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-w-06': {
    journeyIntro: 'Learn the names of three plants on your block.',
    actionSteps: [
      {
        id: 's1',
        title: 'Walk your block once',
        tip: 'Walk the sunny side first—leaves are easier to meet in good light.',
        estimateMinutes: 10,
        interaction: {
          kind: 'timer',
          minSeconds: 8 * 60,
          runningHint: 'Slow lap. Look at green things, not the clock.',
        },
      },
      {
        id: 's2',
        title: 'Identify three plants',
        detail: 'Book or free ID app is fine.',
        tip: 'Sit once on a stoop or low wall—let plants come to you instead of hunting every verge.',
        estimateMinutes: 20,
        interaction: {
          kind: 'counter',
          prompt: 'Name each plant as you identify it.',
          count: 3,
          itemLabel: 'plant',
        },
      },
      {
        id: 's3',
        title: 'Write their common names down',
        tip: 'Read each name aloud once—your mouth remembers what the thumb forgets.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-w-07': {
    journeyIntro: 'Cross the threshold of a place you always pass.',
    actionSteps: [
      {
        id: 's1',
        title: 'Choose a shop you never entered',
        tip: 'Start small—a bakery line often feels gentler than a quiet boutique floor.',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'Which shop is it — and what kept you from entering before?',
          minChars: 15,
          placeholder: 'The tiny lamp store on the corner; it always looked too quiet…',
        },
      },
      {
        id: 's2',
        title: 'Stay inside at least 5 minutes',
        tip: 'Notice scent and sound before shelves—those orient you faster than scanning labels.',
        estimateMinutes: 5,
        interaction: {
          kind: 'timer',
          minSeconds: 5 * 60,
          runningHint: 'Inside? Lock the phone. Scent, sound, shelves.',
        },
      },
      {
        id: 's3',
        title: 'Browse or thank someone and leave',
        tip: 'Thank staff lightly; sometimes they were the best part of the errand.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-w-08': {
    journeyIntro: 'Start the day outside with your first drink.',
    actionSteps: [
      {
        id: 's1',
        title: 'Prepare your drink as usual',
        tip: 'Heat the mug the way you would for a guest—small rituals change taste more than beans.',
        estimateMinutes: 3,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Take the first cup outdoors',
        detail: 'Balcony counts.',
        tip: 'Step out before the first sip; let temperature and air hit your face before flavor.',
        estimateMinutes: 12,
        interaction: {
          kind: 'timer',
          minSeconds: 10 * 60,
          runningHint: 'Sip slowly. Look at something far away.',
        },
      },
      {
        id: 's3',
        title: 'Skip work email until the cup is empty',
        tip: 'Fix your eyes on one distant thing while the cup empties—depth reads as spaciousness.',
        estimateMinutes: 1,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-w-09': {
    journeyIntro: 'Hear a real voice for fifteen minutes.',
    actionSteps: [
      {
        id: 's1',
        title: 'Choose one person to call',
        tip: 'Queue the call like a walk: shoes on, lights softer, notifications already off.',
        estimateMinutes: 2,
        interaction: {
          kind: 'input',
          prompt: 'Who are you calling — and what do you want to ask them?',
          minChars: 15,
          placeholder: 'Dad — how the garden is doing this year…',
        },
      },
      {
        id: 's2',
        title: 'Talk live for at least 15 minutes',
        detail: 'Voice or video.',
        tip: 'Ask one follow-up before sharing your update—they feel heard before advice lands.',
        estimateMinutes: 15,
        interaction: {
          kind: 'timer',
          minSeconds: 15 * 60,
          runningHint: 'Start when the call starts. It counts while you talk.',
        },
      },
      {
        id: 's3',
        title: 'Stick to something concrete',
        detail: 'Plans, a book, a walk.',
        tip: 'Anchor the ending in something future-shaped—a small plan beats a vague goodbye.',
        estimateMinutes: 1,
        interaction: {
          kind: 'input',
          prompt: 'What concrete thing did you land on — a plan, a book, a walk?',
          minChars: 15,
          placeholder: 'We are walking the river loop next Saturday…',
        },
      },
    ],
  },
  'q-w-10': {
    journeyIntro: 'Leave a short stretch of path cleaner than you found it.',
    actionSteps: [
      {
        id: 's1',
        title: 'Bring gloves or a bag',
        tip: 'Tuck an extra bag inside the outer one—dry hands make kinder pickup.',
        estimateMinutes: 2,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Collect five pieces of litter on one walk',
        tip: 'Hunt one color only for a few minutes—white or silver catches plastic fastest.',
        estimateMinutes: 25,
        interaction: {
          kind: 'counter',
          prompt: 'Log each piece as you pick it up.',
          count: 5,
          itemLabel: 'piece',
        },
      },
      {
        id: 's3',
        title: 'Dispose or recycle properly',
        tip: 'Separate sharp from soft before the bin—future-you at the curb appreciates it.',
        estimateMinutes: 3,
        interaction: {
          kind: 'photo',
          prompt: 'Snap the haul before it goes in the bin — proof of a cleaner path.',
        },
      },
    ],
  },
  'q-m-01': {
    journeyIntro: 'Follow a signed trail you have not walked before.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick a marked trail ≥3 km or ~45 min',
        tip: 'Skim reviews for shade and water notes—heat shows up around mile two, not at the trailhead.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'Which trail did you pick — and roughly how long is it?',
          minChars: 10,
          placeholder: 'The ridge loop above the dam, about 5 km…',
        },
      },
      {
        id: 's2',
        title: 'Bring water and follow posted signs',
        tip: 'Pause at forks even when blazes look obvious—maps read clearer standing still.',
        estimateMinutes: 45,
        interaction: {
          kind: 'timer',
          minSeconds: 45 * 60,
          runningHint: 'Start at the trailhead, lock the phone, walk. It counts on its own.',
        },
      },
      {
        id: 's3',
        title: 'Pause once to read a map or sign aloud',
        tip: 'Read a sign aloud once—trail grammar sticks when your mouth learns the words.',
        estimateMinutes: 5,
        interaction: {
          kind: 'photo',
          prompt: 'A photo from the trail — the sign, the view, or your boots.',
        },
      },
    ],
  },
  'q-m-02': {
    journeyIntro: 'Real faces, real time—at least three people.',
    actionSteps: [
      {
        id: 's1',
        title: 'Plan a simple in-person gathering',
        tip: 'Choose food everyone can pick at with hands—shared bowls lower hosting pressure.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Who is coming — and what simple food will be on the table?',
          minChars: 20,
          placeholder: 'Jana, Tomáš, and the neighbors; bread, cheese, olives…',
        },
      },
      {
        id: 's2',
        title: 'Spend 60+ minutes together',
        detail: 'Phones away except photos.',
        tip: 'Halfway, toast to nothing formal—eye contact and one sentence about the table counts.',
        estimateMinutes: 60,
        interaction: {
          kind: 'timer',
          minSeconds: 60 * 60,
          runningHint: 'Start it, put the phone away. It counts while you are present.',
        },
      },
      {
        id: 's3',
        title: 'Say what you would repeat next month',
        tip: 'Ask what felt surprisingly easy—that flags repeats without planning theater.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What would you repeat next month?',
          minChars: 15,
          placeholder: 'The no-agenda part — people stayed longer than planned…',
        },
      },
    ],
  },
  'q-m-03': {
    journeyIntro: 'Taste a cuisine that is new to you.',
    actionSteps: [
      {
        id: 's1',
        title: 'Choose a restaurant or cuisine you have not tried',
        tip: 'Let staff pick one plate—trust lowers menu fatigue faster than scrolling photos.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Which cuisine — and where are you going?',
          minChars: 10,
          placeholder: 'Georgian — the little place behind the market…',
        },
      },
      {
        id: 's2',
        title: 'Order two unfamiliar dishes',
        tip: 'Taste sauces alone first—layers separate like tracks if you listen once cleanly.',
        estimateMinutes: 5,
        interaction: {
          kind: 'counter',
          prompt: 'Name each dish you ordered.',
          count: 2,
          itemLabel: 'dish',
        },
      },
      {
        id: 's3',
        title: 'Eat with attention—not desk lunch',
        tip: 'Phone in the bag, screen down—attention is the rarest seasoning.',
        estimateMinutes: 45,
        interaction: {
          kind: 'photo',
          prompt: 'One photo of the table before you start — then the phone goes away.',
        },
      },
    ],
  },
  'q-m-05': {
    journeyIntro: 'Show up for your community for two hours.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book a slot with an organization',
        tip: 'Arrive ten minutes early to read their bulletin wall—context steadies nerves.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Which organization — and when is your shift?',
          minChars: 10,
          placeholder: 'The food bank, Saturday morning…',
        },
      },
      {
        id: 's2',
        title: 'Arrive on time and complete the shift',
        tip: 'Introduce yourself twice—to peers and organizers; small repeats build trust fast.',
        estimateMinutes: 120,
        interaction: {
          kind: 'timer',
          minSeconds: 120 * 60,
          runningHint: 'Start when the shift starts. Lock the phone and be there.',
        },
      },
      {
        id: 's3',
        title: 'Name one task you did not expect',
        tip: 'Note muscle tiredness, not moral score—bodies measure service more honestly than pride.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What task did you not expect to be doing?',
          minChars: 20,
          placeholder: 'Sorting donated shoes by size for an hour…',
        },
      },
    ],
  },
  'q-m-06': {
    journeyIntro: 'Sleep somewhere that is not your usual bed.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book or arrange one night away',
        tip: 'Pack one familiar pillowcase—strange beds soften when scent stays partly yours.',
        estimateMinutes: 60,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Spend the full night there',
        tip: 'Open curtains before screens—foreign morning light resets the mind’s jetlag.',
        estimateMinutes: 480,
        interaction: {
          kind: 'photo',
          prompt: 'A photo from where you woke up — the view, the room, the light.',
        },
      },
      {
        id: 's3',
        title: 'Notice how waking up felt different',
        tip: 'Voice-note one sentence before coffee—groggy honesty ages into a good story later.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'How did waking up feel different?',
          minChars: 20,
          placeholder: 'Quieter — no traffic, just birds and unfamiliar curtains…',
        },
      },
    ],
  },
  'q-y-01': {
    journeyIntro: 'A short trip that breaks your everyday radius.',
    actionSteps: [
      {
        id: 's1',
        title: 'Plan transport and one night away',
        detail: '≥100 km from home.',
        tip: 'Sketch one loose route on paper—spatial memory likes ink more than GPS tiles.',
        estimateMinutes: 120,
        interaction: {
          kind: 'input',
          prompt: 'Where are you headed — and how are you getting there?',
          minChars: 15,
          placeholder: 'Train to the mountains, one night in a pension…',
        },
      },
      {
        id: 's2',
        title: 'Do one activity you cannot do at home',
        tip: 'Pick one slow ritual locals repeat—belonging souvenirs often come from repetition.',
        estimateMinutes: 180,
        interaction: {
          kind: 'photo',
          prompt: 'Capture the moment you cannot have at home.',
        },
      },
      {
        id: 's3',
        title: 'Bring back one detail you want to keep',
        tip: 'Pocket a pebble, ticket stub, or leaf—physical reminders age better than camera rolls alone.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'What detail are you keeping — an object, an image, a taste?',
          minChars: 15,
          placeholder: 'A flat river stone and the smell of pine at dusk…',
        },
      },
    ],
  },
  'q-y-02': {
    journeyIntro: 'Learn an outdoor skill with a real guide.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book a session with an instructor',
        tip: 'Skim reviews for kindness toward beginners—confidence transfers from how they teach.',
        estimateMinutes: 60,
        interaction: {
          kind: 'input',
          prompt: 'What skill — and who is teaching you?',
          minChars: 10,
          placeholder: 'Intro to climbing at the local wall…',
        },
      },
      {
        id: 's2',
        title: 'Show up with their prep list',
        tip: 'Dress slightly under your ego—layers you can add beat shivering in stiff new shells.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Finish the session and debrief yourself',
        tip: 'Debrief aloud walking to the car—motor memory locks reflections better than couch scrolling.',
        estimateMinutes: 240,
        interaction: {
          kind: 'input',
          prompt: 'What can you do now that you could not before the session?',
          minChars: 25,
          placeholder: 'Tie a figure-eight knot and trust the rope on an overhang…',
        },
      },
    ],
  },
  'q-y-03': {
    journeyIntro: 'Reconnect after a long silence.',
    actionSteps: [
      {
        id: 's1',
        title: 'Reach out and propose a real catch-up',
        tip: 'Open with logistics first—schedule sand settles people before hearts unload.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Meet or video call ≥45 minutes',
        tip: 'Silence your own story until halfway—lateness in listening reads as love.',
        estimateMinutes: 45,
        interaction: {
          kind: 'timer',
          minSeconds: 45 * 60,
          runningHint: 'Start when you meet. Be with them, not with the clock.',
        },
      },
      {
        id: 's3',
        title: 'Listen for the first half of the time',
        tip: 'Name one thing you appreciated aloud—closure likes spoken gratitude.',
        estimateMinutes: 1,
        interaction: {
          kind: 'input',
          prompt: 'What did you learn about them by listening first?',
          minChars: 20,
          placeholder: 'They changed jobs and never told anyone how scary it was…',
        },
      },
    ],
  },
  'q-y-04': {
    journeyIntro: 'One full day without productivity theater.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick a weekend or holiday day',
        tip: 'Declare the day aloud to an empty room—houseplants count as witness if roommates are out.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'No paid work, errands, or chores marathons',
        tip: 'Eat one meal very slowly—chewing pace drags time back into weekday scale.',
        estimateMinutes: 480,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Spend the day on rest, play, or people',
        tip: 'A nap on the agenda counts—rest is an activity here, not stolen time.',
        estimateMinutes: 480,
        interaction: {
          kind: 'input',
          prompt: 'What did the day hold? What did your body do when nothing was productive?',
          minChars: 30,
          placeholder: 'Slept in, long lunch, a walk with no destination. My shoulders dropped…',
        },
      },
    ],
  },
};

const CALENDAR_STEP_ID = 'calendar_reminder';

const CALENDAR_REMINDER_STEP: QuestActionStep = {
  id: CALENDAR_STEP_ID,
  title: 'Put it on your calendar',
  detail: 'Choose a date/time and set a reminder so it actually happens.',
  tip: 'Pick a specific slot you will defend like a quiet coffee—vague someday rarely ships.',
  estimateMinutes: 2,
  action: { kind: 'calendar' },
};

/** Used when a step has no catalog match (custom DB journeys). */
export const DEFAULT_JOURNEY_STEP_TIP =
  'Go gently—notice one small real-world detail before you mark the step done.';

function mergeCatalogStepTips(quest: Quest): Quest {
  const bundle = QUEST_JOURNEY_BY_ID[quest.id];
  const catalogTipById = new Map<string, string>();
  const catalogInteractionById = new Map<string, NonNullable<QuestActionStep['interaction']>>();
  if (bundle) {
    for (const s of bundle.actionSteps) {
      if (s.tip) catalogTipById.set(s.id, s.tip);
      if (s.interaction) catalogInteractionById.set(s.id, s.interaction);
    }
  }
  if (CALENDAR_REMINDER_STEP.tip) {
    catalogTipById.set(CALENDAR_REMINDER_STEP.id, CALENDAR_REMINDER_STEP.tip);
  }
  return {
    ...quest,
    actionSteps: quest.actionSteps.map((s) => {
      const next: QuestActionStep = { ...s };
      if (!next.tip) next.tip = catalogTipById.get(s.id) ?? DEFAULT_JOURNEY_STEP_TIP;
      // Catalog interactions win over missing DB ones — content lives in TS.
      if (!next.interaction) {
        const fromCatalog = catalogInteractionById.get(s.id);
        if (fromCatalog) next.interaction = fromCatalog;
      }
      return next;
    }),
  };
}

function hasCalendarReminderStep(steps: QuestActionStep[]): boolean {
  return steps.some(
    (s) =>
      s.id === CALENDAR_STEP_ID ||
      /calendar/i.test(s.title) ||
      (typeof s.detail === 'string' && /calendar/i.test(s.detail))
  );
}

function shouldAddCalendarReminderStep(quest: Quest): boolean {
  if (quest.timeframe === 'monthly' || quest.timeframe === 'yearly') return true;

  // Weekly: be strict and only add this when the quest is
  // (a) long enough that it's easy to postpone, or
  // (b) clearly requires coordination/booking or a multi-day commitment.
  const duration = quest.estimatedDurationMinutes;
  if (typeof duration === 'number' && duration >= 30) return true;

  const text = [
    quest.title,
    quest.shortDescription,
    quest.fullDescription,
    ...quest.actionSteps.map((s) => `${s.title} ${s.detail ?? ''}`),
  ]
    .join(' ')
    .toLowerCase();

  const coordinationOrBooking =
    /\b(book|booking|reservation|reserve|sign up|slot|organization|class|instructor|guide|session)\b/.test(
      text
    );
  if (coordinationOrBooking) return true;

  const commitmentOverTime =
    /\b(three nights|consecutive|weeknights|overnight|one night|trip|travel|gathering|meet|meet up|meetup|call|video call|voice call|host)\b/.test(
      text
    );
  if (commitmentOverTime) return true;

  const explicitPlanning =
    /\b(schedule|scheduled|plan|planning|pick a day|choose a day|set a date|set a time)\b/.test(
      text
    );
  return explicitPlanning;
}

function insertCalendarReminderStep(steps: QuestActionStep[]): QuestActionStep[] {
  if (steps.length === 0) return [CALENDAR_REMINDER_STEP];
  if (hasCalendarReminderStep(steps)) return steps;

  const firstTitle = steps[0]?.title ?? '';
  const firstText = `${firstTitle} ${steps[0]?.detail ?? ''}`.toLowerCase();
  const putAfterFirst =
    /\b(pick|choose|plan|book|schedule|arrange)\b/.test(firstText) ||
    /\b(pick|choose|plan|book|schedule|arrange)\b/.test(firstTitle.toLowerCase());

  if (putAfterFirst) {
    return [steps[0], CALENDAR_REMINDER_STEP, ...steps.slice(1)];
  }
  return [CALENDAR_REMINDER_STEP, ...steps];
}

export function enrichQuestWithJourney(quest: Quest): Quest {
  const extra = quest.actionSteps.length === 0 ? QUEST_JOURNEY_BY_ID[quest.id] : undefined;
  const base: Quest = extra
    ? {
        ...quest,
        journeyIntro: extra.journeyIntro ?? quest.journeyIntro,
        actionSteps: extra.actionSteps,
      }
    : quest;

  const merged = !shouldAddCalendarReminderStep(base)
    ? base
    : { ...base, actionSteps: insertCalendarReminderStep(base.actionSteps) };
  return mergeCatalogStepTips(merged);
}
