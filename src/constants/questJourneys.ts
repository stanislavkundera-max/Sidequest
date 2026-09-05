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
    journeyIntro: 'Up the wall until your forearms quit.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find a climbing gym and book a beginner slot',
        detail: 'Bouldering needs no partner; ropes usually come with an instructor.',
        tip: 'Go on a weekday evening if you can. Weekend gyms are queues, and queues are where nerve leaks away.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Where are you going, and when?',
          placeholder: 'The wall by the station, Thursday after work…',
        },
      },
      {
        id: 's2',
        title: 'Take the safety briefing properly',
        detail: 'How to fall, where to land, what the mats do and do not do.',
        tip: 'Falling is the skill worth having on day one. Everything else is just pulling.',
        estimateMinutes: 20,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Climb until your arms stop working',
        detail: 'Easy routes first, then keep going up the grades.',
        estimateMinutes: 60,
        interaction: {
          kind: 'timer',
          minSeconds: 40 * 60,
          runningHint: 'Climb. The timer keeps running with the phone in your bag.',
        },
      },
      {
        id: 's4',
        title: 'Get on one route you think you cannot do',
        detail: 'You do not have to finish it. You have to start it.',
        tip: 'Pick it before you are tired, not after — that is the difference between trying it and excusing it.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's5',
        title: 'Say where you wanted to come down',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'Where on the wall did you want to come down?',
          placeholder: 'Third move on the overhang. Hands were fine, head was not…',
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
    journeyIntro: 'The departure board decides.',
    actionSteps: [
      {
        id: 's1',
        title: 'Get to the station with the day free',
        detail: 'Bring a charger, something to eat, and no destination.',
        tip: 'Set yourself a budget and a last train home before you go. Two limits are what make the rest of it open.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Take the next train you can afford',
        detail: 'Whatever is leaving soonest. Do not read about where it goes.',
        tip: 'The urge to check the place first is the whole quest, arriving early. Let it pass.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Get off and stay a few hours',
        detail: 'End of the line, or anywhere out the window that looked worth it.',
        estimateMinutes: 180,
        interaction: {
          kind: 'timer',
          minSeconds: 90 * 60,
          runningHint: 'Walk around. The timer runs with the phone in your pocket.',
        },
      },
      {
        id: 's4',
        title: 'Photograph the place you did not choose',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Wherever the train left you.' },
      },
      {
        id: 's5',
        title: 'Say where you ended up',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'Where did you end up, and would you have ever chosen it?',
          placeholder: 'A town with one square and a closed museum. Never in a hundred years…',
        },
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
    journeyIntro: 'Ninety seconds on the platform, then it is done.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find a licensed operator and book a date',
        detail: 'A bridge, a tower, a crane. A tandem skydive counts if there is no bungee near you.',
        tip: 'Book the earliest slot of the day. The longer you wait in the queue, the more time there is to reconsider.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Where are you jumping, and on what date?',
          placeholder: 'The bridge at Zvíkov, second Saturday of next month…',
        },
      },
      {
        id: 's2',
        title: 'Tell someone, and take them with you',
        detail: 'Someone who will not let you quietly cancel.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Turn up and get harnessed',
        detail: 'Listen to the crew. They do this every weekend; you do not.',
        estimateMinutes: 90,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Go',
        detail: 'Do not count down more than once.',
        tip: 'Everyone stands there longer than they meant to. That part is not failure, it is the quest.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's5',
        title: 'Photograph the drop from the ground',
        estimateMinutes: 2,
        interaction: { kind: 'photo', prompt: 'What you jumped off, seen from below.' },
      },
      {
        id: 's6',
        title: 'Say what was in your head on the edge',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What went through your head on the edge, before you went?',
          placeholder: 'Nothing useful. Then somebody said three and my legs did it…',
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
    journeyIntro: 'No tent. Just the bag, the mat, and whatever the sky does.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find a spot you are allowed to sleep on',
        detail: 'Many national parks forbid it. A friend with land, or a shelter, solves it in one message.',
        tip: 'Look for flat, dry, and slightly off the path. Under trees is warmer than open ground and keeps the dew off.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Where are you sleeping, and whose land or rules cover it?',
          placeholder: 'The meadow above Tomáš’s cottage — asked him, he said fine…',
        },
      },
      {
        id: 's2',
        title: 'Pack for colder than the forecast',
        detail: 'Warm bag, mat off the ground, hat, water, head torch.',
        tip: 'The mat matters more than the bag. Most of the cold comes up from underneath.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Walk out and lie down with nothing over your face',
        estimateMinutes: 480,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Photograph the first thing you see when you open your eyes',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Whatever is above you in the morning.' },
      },
      {
        id: 's5',
        title: 'Say what the night was like',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What woke you, and what was the sky doing?',
          placeholder: 'Something small in the grass at about three. Then all of the stars…',
        },
      },
    ],
  },
  'q-y-01': {
    journeyIntro: 'Three days, one bag, and only tonight decided.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book the first night and nothing else',
        detail: 'A direction and one bed. That is the whole plan.',
        tip: 'Booking the return leg is fine — knowing you can get home is what makes the middle open rather than anxious.',
        estimateMinutes: 45,
        interaction: {
          kind: 'input',
          prompt: 'Which direction, and where is the first night?',
          placeholder: 'South, hostel in Ljubljana. After that, no idea…',
        },
      },
      {
        id: 's2',
        title: 'Tell one person at home roughly where you will be',
        detail: 'Not an itinerary. A country and a check-in time.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Pack one bag you can walk all day with',
        tip: 'Whatever you pack, take a third of it out. You will be carrying it up stairs you have not seen yet.',
        estimateMinutes: 45,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Decide each morning where you are going next',
        detail: 'Three days of it. Ask people rather than searching.',
        estimateMinutes: 2880,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's5',
        title: 'Photograph the place you had not heard of before you left',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Somewhere no plan would have sent you.' },
      },
      {
        id: 's6',
        title: 'Say what the plan would have missed',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What happened that no plan of yours would have included?',
          placeholder: 'Got talking to a man on a bus and ended up at a village festival…',
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

  // —— Added 2026-09-05 ——————————————————————————————————————————————

  'q-w-11': {
    journeyIntro: 'The same meal, with weather in it.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick the meal and grab it to go',
        detail: 'Breakfast, lunch, whatever was already happening.',
        tip: 'Do not upgrade the food. The point is the location, not the menu.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Find somewhere outside to sit',
        detail: 'A step, a low wall, a bench, the edge of a planter.',
        tip: 'Closer than you think is fine — this is not a picnic expedition.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Eat there, without hurrying',
        detail: 'Stay until the food is gone.',
        estimateMinutes: 15,
        interaction: {
          kind: 'timer',
          minSeconds: 10 * 60,
          runningHint: 'Put the phone down — the timer runs on its own.',
        },
      },
      {
        id: 's4',
        title: 'Take one photo of the view from where you sat',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Whatever you were looking at while you ate.' },
      },
    ],
  },

  'q-w-12': {
    journeyIntro: 'Every street has one that was here first.',
    actionSteps: [
      {
        id: 's1',
        title: 'Walk your street looking up',
        detail: 'The whole length of it, at least once.',
        tip: 'Trunk width tells you more than height — a tall thin tree is usually younger than a fat short one.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Pick the one you think is oldest',
        detail: 'Commit to a single tree.',
        tip: 'Look for roots lifting the pavement, bark that has gone deeply grooved, or a crown wider than the ones beside it.',
        estimateMinutes: 5,
        interaction: { kind: 'photo', prompt: 'Photograph your candidate.' },
      },
      {
        id: 's3',
        title: 'Say why you picked it',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What made you choose that one?',
          placeholder: 'Trunk twice as thick as the rest, and the pavement has given up around it…',
        },
      },
    ],
  },

  'q-m-07': {
    journeyIntro: 'Being somewhere before the light gets there.',
    actionSteps: [
      {
        id: 's1',
        title: 'Look up when the sun rises tomorrow',
        detail: 'Then decide where you need to be, and when to leave.',
        tip: 'Aim to be in place twenty minutes early — the sky does most of its work before the sun appears.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'Where are you going, and what time do you need to leave?',
          placeholder: 'The hill behind the allotments, out the door by 05:40…',
        },
      },
      {
        id: 's2',
        title: 'Get there in the dark',
        detail: 'Somewhere with an open view to the east.',
        tip: 'Take a warm layer more than you think you need. Standing still at dawn is colder than walking at midnight.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Stay until the sun is fully up',
        detail: 'Not just the first edge — all of it.',
        estimateMinutes: 30,
        interaction: {
          kind: 'timer',
          minSeconds: 20 * 60,
          runningHint: 'Watch the colour change. The timer keeps counting.',
        },
      },
      {
        id: 's4',
        title: 'Photograph it once the light has arrived',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'The view, with the sun in it.' },
      },
    ],
  },

  'q-m-08': {
    journeyIntro: 'Let the water pick the route.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find water and a bridge to start from',
        detail: 'A river, canal, or stream — anything with a bank you can walk.',
        tip: 'Map apps show blue lines clearly. Pick a crossing you have driven over but never stood on.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Walk the bank to the next crossing',
        detail: 'Follow the water, not a planned route.',
        tip: 'If the bank runs out, cross and carry on the other side — that counts.',
        estimateMinutes: 75,
        interaction: {
          kind: 'timer',
          minSeconds: 40 * 60,
          runningHint: 'Keep the water on one side. The timer runs on its own.',
        },
      },
      {
        id: 's3',
        title: 'Photograph the bridge you finished at',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Where the walk ended.' },
      },
      {
        id: 's4',
        title: 'Note one thing on the bank you would have missed',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What was down there that you never see from the road?',
          placeholder: 'A heron that let me get closer than it should have…',
        },
      },
    ],
  },

  'q-y-05': {
    journeyIntro: 'Somewhere the sky still gets properly dark.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find somewhere far enough from town',
        detail: 'A cabin, a campsite, a friend’s place out in the nowhere.',
        tip: 'Light-pollution maps make this easy — you usually need less distance than you would guess.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Where are you going, and when?',
          placeholder: 'The cottage in October, once the clocks change…',
        },
      },
      {
        id: 's2',
        title: 'Get there and stay the night',
        estimateMinutes: 600,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Go outside after dark and let your eyes adjust',
        detail: 'Twenty minutes with no torch and no screen.',
        tip: 'The first five minutes look like nothing. Stay past that — it keeps arriving.',
        estimateMinutes: 20,
        interaction: {
          kind: 'timer',
          minSeconds: 15 * 60,
          runningHint: 'Let your eyes do the work. Keep the screen face down.',
        },
      },
      {
        id: 's4',
        title: 'Write down what you could see by the end',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What was visible once your eyes had adjusted?',
          placeholder: 'The Milky Way, faintly. And the outline of the hills I could not see at all at first…',
        },
      },
    ],
  },

  'q-w-13': {
    journeyIntro: 'Be standing up there when the light arrives.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick the hill and work backwards from sunrise',
        detail: 'Look up the sunrise time, then subtract the walk, then subtract twenty minutes.',
        tip: 'Twenty minutes early is the whole trick. Arriving as it happens means watching it through your own breathing.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Where are you walking up, and what time are you setting off?',
          placeholder: 'The ridge behind the quarry, leaving at 04:40…',
        },
      },
      {
        id: 's2',
        title: 'Pack the night before and tell someone',
        detail: 'Head torch, warm layer, something hot, charged phone.',
        tip: 'Send one person your route and your expected time back. It costs a message and it is the difference between adventure and stupidity.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Walk up in the dark',
        estimateMinutes: 90,
        interaction: {
          kind: 'timer',
          minSeconds: 30 * 60,
          runningHint: 'Keep walking. The timer runs with the phone away.',
        },
      },
      {
        id: 's4',
        title: 'Stand still and watch the whole thing',
        detail: 'From first colour to the sun clear of the horizon. Do not leave early.',
        estimateMinutes: 25,
        interaction: {
          kind: 'timer',
          minSeconds: 15 * 60,
          runningHint: 'Sit down. Hands round the cup. Watch it.',
        },
      },
      {
        id: 's5',
        title: 'Photograph it from where you stood',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'The view you walked up for.' },
      },
      {
        id: 's6',
        title: 'Say what the dark walk was like',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What was the walk up like before there was any light?',
          placeholder: 'Quieter than I expected. Heard the deer before I saw anything…',
        },
      },
    ],
  },

  'q-w-14': {
    journeyIntro: 'Put money on a version of yourself that does not exist yet.',
    actionSteps: [
      {
        id: 's1',
        title: 'Name the thing you would need months to be ready for',
        detail: 'A distance, a route, a stage, a competition.',
        tip: 'If you could do it next weekend, it is the wrong one. It should sit just past believable.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'What is it, and why is it out of reach today?',
          placeholder: 'A half marathon in April. Longest I have run is 7k…',
        },
      },
      {
        id: 's2',
        title: 'Find one with a real date and open entries',
        detail: 'A date on a calendar is what makes this different from a plan.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Pay the entry fee',
        detail: 'The fee is the point. It makes quitting cost something.',
        tip: 'Do it now, in this sitting. Every hour you leave it, the reasons get better.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Tell one person you have entered',
        detail: 'Someone who will ask you about it in a month.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's5',
        title: 'Say what it felt like',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What did you feel the moment the confirmation arrived?',
          placeholder: 'Slightly sick, and then oddly calm about the whole thing…',
        },
      },
    ],
  },

  'q-w-15': {
    journeyIntro: 'Somewhere it is legal to go flat out.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book a track session',
        detail: 'Karts are the cheap way in. A rally school or a race sim day counts too.',
        tip: 'Ask whether they time the laps. Being timed is what turns a ride into a session.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Where are you driving, and when?',
          placeholder: 'Indoor karting out by the airport, Saturday morning…',
        },
      },
      {
        id: 's2',
        title: 'Listen to the briefing and take the flags seriously',
        detail: 'Helmet on properly, marshals obeyed, no heroics on lap one.',
        tip: 'The people who go fastest are the ones still on track at the end.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Drive it properly',
        detail: 'Brake later each lap until it stops working, then back off one notch.',
        estimateMinutes: 45,
        interaction: {
          kind: 'timer',
          minSeconds: 20 * 60,
          runningHint: 'Drive. Come back to the phone after.',
        },
      },
      {
        id: 's4',
        title: 'Photograph the timing sheet',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Your lap times, or the track.' },
      },
      {
        id: 's5',
        title: 'Say how much you found',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'How much faster were you at the end than the first lap?',
          placeholder: 'Three and a half seconds. All of it in one corner…',
        },
      },
    ],
  },

  'q-m-09': {
    journeyIntro: 'Water you have to walk to.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find wild water within reach',
        detail: 'A river, a stream pool, a forest lake — somewhere with no car park.',
        tip: 'Ask locally or check a map for blue lines with footpaths beside them. Swimming spots are usually known.',
        estimateMinutes: 20,
        interaction: {
          kind: 'input',
          prompt: 'Where are you going, and who is coming with you?',
          placeholder: 'The pool below the weir, with Tom, Saturday morning…',
        },
      },
      {
        id: 's2',
        title: 'Check it before you get in',
        detail: 'Depth, current, and how you will get out again.',
        tip: 'Cold water takes your breath for the first thirty seconds — that is normal, and it passes. Get in slowly and never alone.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Get in',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Photograph the water once you are out',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'The spot you swam in.' },
      },
      {
        id: 's5',
        title: 'Say how long it took to commit',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'How long did it take to get in?',
          placeholder: 'Stood on the rock for about ten minutes talking myself into it…',
        },
      },
    ],
  },

  'q-y-06': {
    journeyIntro: 'Feet off the ground, on purpose.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick how you want to leave the ground',
        detail: 'Tandem paraglide, tandem skydive, or a balloon at dawn.',
        tip: 'Paragliding gives you the longest time in the air for the least money. A jump gives you the most fear per minute. Both count.',
        estimateMinutes: 20,
        interaction: {
          kind: 'input',
          prompt: 'Which one, and with whom?',
          placeholder: 'Tandem paraglide off Raná, the school with the red wings…',
        },
      },
      {
        id: 's2',
        title: 'Book with a licensed operator and take a weather window',
        detail: 'Ask about their licence and their weather policy in the same message.',
        tip: 'Do not pin it to one fixed date. The good flights are the ones that waited for the right morning.',
        estimateMinutes: 30,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Go up',
        estimateMinutes: 240,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Photograph the ground from above',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Down, from up there.' },
      },
      {
        id: 's5',
        title: 'Say what it looked like',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What did the ground look like from up there?',
          placeholder: 'Smaller and much more organised than it feels from inside it…',
        },
      },
    ],
  },

  'q-w-16': {
    journeyIntro: 'One real question instead of the weather.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick who you will ask',
        detail: 'Anyone you will speak to anyway this week.',
        tip: 'It works best with people you see often but know almost nothing about.',
        estimateMinutes: 2,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Ask how they got into it',
        detail: 'Then stop talking.',
        tip: 'The good part usually arrives after the first pause. Let the silence sit rather than filling it.',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Write down the part you did not expect',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What surprised you about their answer?',
          placeholder: 'Turns out he trained as a vet before any of this…',
        },
      },
    ],
  },

  'q-w-17': {
    journeyIntro: 'A meal with nothing else on the table.',
    actionSteps: [
      {
        id: 's1',
        title: 'Arrange to eat with someone',
        detail: 'At home or out, cooked or bought.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Put both phones somewhere else',
        detail: 'A bag, a shelf, the next room — not face down on the table.',
        tip: 'Say why you are doing it. It lands better than quietly disappearing your phone.',
        estimateMinutes: 1,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Eat, and stay at the table afterwards',
        estimateMinutes: 45,
        interaction: {
          kind: 'timer',
          minSeconds: 30 * 60,
          runningHint: 'Leave this running and go back to the table.',
        },
      },
      {
        id: 's4',
        title: 'Note where the conversation went',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What did you end up talking about?',
          placeholder: 'Started with work, ended somewhere near his dad…',
        },
      },
    ],
  },

  'q-w-18': {
    journeyIntro: 'Say the specific thing, not the general one.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick the person and the exact thing',
        detail: 'Not "thanks for everything" — one identifiable act.',
        tip: 'The more specific it is, the harder it is for them to wave it off.',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'Who, and what did they do?',
          placeholder: 'Milan — he drove out at eleven at night when the car died…',
        },
      },
      {
        id: 's2',
        title: 'Tell them, in person or by voice',
        detail: 'A message does not count for this one.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Note how they took it',
        estimateMinutes: 2,
        interaction: {
          kind: 'input',
          prompt: 'How did they react?',
          placeholder: 'Went a bit awkward, then said nobody had mentioned it since…',
        },
      },
    ],
  },

  'q-m-10': {
    journeyIntro: 'The person you always say "we should" to.',
    actionSteps: [
      {
        id: 's1',
        title: 'Name the person and the thing',
        detail: 'Something specific, with a date on it.',
        tip: '"Coffee sometime" gets nowhere. "Coffee Thursday morning?" gets an answer either way.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'Who are you asking, and to do what, when?',
          placeholder: 'Petra from the climbing gym — the Saturday market, this weekend…',
        },
      },
      {
        id: 's2',
        title: 'Send the invitation',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Go, if they say yes',
        detail: 'And if they cannot, ask someone else rather than shelving it.',
        estimateMinutes: 90,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Say how the asking felt',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What made it easier or harder than you expected?',
          placeholder: 'Took three goes to send it. She replied in about a minute…',
        },
      },
    ],
  },

  'q-y-07': {
    journeyIntro: 'The same person, without the clock.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick the person and find the day',
        detail: 'Someone you normally see in short bursts.',
        tip: 'Say it is a whole day up front. Half of what makes it different is them knowing there is no cut-off.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Who, and when?',
          placeholder: 'Dad, the second Saturday in November…',
        },
      },
      {
        id: 's2',
        title: 'Spend the day',
        detail: 'No agenda beyond being there for the length of it.',
        estimateMinutes: 420,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Write down what came up late in the day',
        detail: 'The part that would not have fitted into an hour.',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'What came up once you were past the first two hours?',
          placeholder: 'He talked about the year after the divorce. I had never heard any of it…',
        },
      },
    ],
  },

  'q-w-19': {
    journeyIntro: 'Paper, and somewhere that is not your flat.',
    actionSteps: [
      {
        id: 's1',
        title: 'Take something printed and go out',
        detail: 'Café, park, library, a bench.',
        tip: 'Anything on paper counts — an old magazine off the shelf is fine.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Read for half an hour',
        estimateMinutes: 30,
        interaction: {
          kind: 'timer',
          minSeconds: 25 * 60,
          runningHint: 'Screen down, page open. The timer runs on its own.',
        },
      },
      {
        id: 's3',
        title: 'Note one thing that stayed with you',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What stuck?',
          placeholder: 'One line about how rivers get their names…',
        },
      },
    ],
  },

  'q-w-20': {
    journeyIntro: 'Fifteen minutes you were not going to have.',
    actionSteps: [
      {
        id: 's1',
        title: 'On a journey home, pick the longer way',
        detail: 'No errand attached — just the extra distance.',
        tip: 'Decide before you set off. The long way never wins an argument made halfway.',
        estimateMinutes: 2,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Walk it without rushing',
        estimateMinutes: 25,
        interaction: {
          kind: 'timer',
          minSeconds: 15 * 60,
          runningHint: 'No destination but home. The timer keeps counting.',
        },
      },
      {
        id: 's3',
        title: 'Say what the extra time gave you',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'What did the extra fifteen minutes do?',
          placeholder: 'Arrived home already finished with the day instead of bringing it in…',
        },
      },
    ],
  },

  'q-m-11': {
    journeyIntro: 'Heat, water, and nothing useful to do.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find somewhere and book two hours',
        detail: 'Public sauna, bathhouse, thermal pool.',
        tip: 'Book a slot rather than planning to drop in — a booking survives a busy week, an intention does not.',
        estimateMinutes: 15,
        interaction: {
          kind: 'input',
          prompt: 'Where, and when?',
          placeholder: 'The old baths on the other side of town, Sunday afternoon…',
        },
      },
      {
        id: 's2',
        title: 'Go, with nothing planned afterwards',
        detail: 'The empty hour after is part of it.',
        estimateMinutes: 120,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Note when you stopped checking the time',
        estimateMinutes: 3,
        interaction: {
          kind: 'input',
          prompt: 'How long before you stopped checking the time?',
          placeholder: 'About forty minutes, somewhere in the second round…',
        },
      },
    ],
  },

  'q-m-12': {
    journeyIntro: 'A table, alone, and nowhere to be after.',
    actionSteps: [
      {
        id: 's1',
        title: 'Pick a morning with nothing after it',
        detail: 'The empty hour afterwards matters as much as the meal.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's2',
        title: 'Go out and order properly',
        detail: 'Sit in. Leave the laptop at home.',
        tip: 'Bring something to read if eating alone feels exposed — but try the first ten minutes without it.',
        estimateMinutes: 60,
        interaction: {
          kind: 'timer',
          minSeconds: 40 * 60,
          runningHint: 'Stay at the table. The timer runs on its own.',
        },
      },
      {
        id: 's3',
        title: 'Photograph the table',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'What was in front of you.' },
      },
    ],
  },

  'q-m-13': {
    journeyIntro: 'Finished, and then gone.',
    actionSteps: [
      {
        id: 's1',
        title: 'Decide what you are making and who gets it',
        detail: 'Bread, a shelf, a drawing, a jar of something.',
        tip: 'Choosing the person first makes it much likelier to get finished.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'What are you making, and for whom?',
          placeholder: 'Sourdough for the neighbours who keep taking our parcels in…',
        },
      },
      {
        id: 's2',
        title: 'Make it, start to finish',
        detail: 'It does not need to be good.',
        estimateMinutes: 150,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Photograph it before it leaves',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'The finished thing.' },
      },
      {
        id: 's4',
        title: 'Give it away',
        estimateMinutes: 15,
        interaction: { kind: 'confirm' },
      },
    ],
  },
  'q-m-14': {
    journeyIntro: 'An hour of breathing without pauses, and whatever that brings up.',
    actionSteps: [
      {
        id: 's1',
        title: 'Find a facilitator running sessions near you',
        detail: 'Listed as continuous connected breathing, conscious connected breathing, or rebirthing.',
        tip: 'Ask how long they have been facilitating and what training they did. Anyone good will answer plainly.',
        estimateMinutes: 20,
        interaction: {
          kind: 'input',
          prompt: 'Who are you booking with, and when?',
          placeholder: 'The studio above the bike shop, Sunday afternoon group session…',
        },
      },
      {
        id: 's2',
        title: 'Tell them anything they need to know first',
        detail: 'Pregnancy, heart or blood-pressure conditions, epilepsy, or serious mental-health history.',
        tip: 'This is not a formality. Some of those are reasons to sit this one out, and the facilitator is the person who can tell you which.',
        estimateMinutes: 10,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Keep the rest of the day soft',
        detail: 'Do not book anything sharp afterwards. Bring water and a blanket.',
        tip: 'People come out of these quiet, or wrung out, or unexpectedly cheerful. Leave room for whichever it is.',
        estimateMinutes: 5,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's4',
        title: 'Go and breathe',
        estimateMinutes: 90,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's5',
        title: 'Write it down before it fades',
        detail: 'Within the hour, while it is still close.',
        estimateMinutes: 10,
        interaction: {
          kind: 'input',
          prompt: 'What came up while you were breathing?',
          placeholder: 'Hands went strange first. Then I was somewhere in a car with my dad…',
        },
      },
    ],
  },

  'q-y-08': {
    journeyIntro: 'Two nights somewhere with less going on.',
    actionSteps: [
      {
        id: 's1',
        title: 'Book two nights somewhere quieter than home',
        detail: 'A village, a cabin, a coast out of season.',
        tip: 'Out of season is the trick — the same place in November costs less and asks less of you.',
        estimateMinutes: 30,
        interaction: {
          kind: 'input',
          prompt: 'Where, and when?',
          placeholder: 'The cottage near the lake, first weekend of March…',
        },
      },
      {
        id: 's2',
        title: 'Go without a list of things to see',
        detail: 'Arriving with no plan is the whole exercise.',
        estimateMinutes: 2400,
        interaction: { kind: 'confirm' },
      },
      {
        id: 's3',
        title: 'Photograph the view you kept coming back to',
        estimateMinutes: 1,
        interaction: { kind: 'photo', prompt: 'Wherever you ended up sitting most.' },
      },
      {
        id: 's4',
        title: 'Note when you actually slowed down',
        estimateMinutes: 5,
        interaction: {
          kind: 'input',
          prompt: 'Which day did you start to slow down?',
          placeholder: 'Not until Sunday morning, honestly…',
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
