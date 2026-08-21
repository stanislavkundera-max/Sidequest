/**
 * Mirror of `src/constants/questJourneys.ts` QUEST_JOURNEY_BY_ID (keep in sync when editing journeys).
 * Used by `emit-journey-seed-sql.cjs` to generate `supabase/seed.sql` updates.
 */
module.exports = {
  'q-w-01': {
    journeyIntro: 'A short walk with only the world as your soundtrack.',
    actionSteps: [
      {
        id: 's1',
        title: 'Leave podcasts and music behind',
        detail: 'Earbuds stay home or stay in your pocket for this walk.',
        estimateMinutes: 1,
      },
      {
        id: 's2',
        title: 'Walk at least 20 minutes outside',
        detail: 'Any loop or errand route counts.',
        estimateMinutes: 20,
      },
      {
        id: 's3',
        title: 'Notice three distinct sounds',
        detail: 'Before you finish, name them quietly to yourself.',
        estimateMinutes: 5,
      },
    ],
  },
  'q-w-02': {
    journeyIntro: 'Ten minutes of stillness in public—no feed, just the scene.',
    actionSteps: [
      { id: 's1', title: 'Find a bench with a view', estimateMinutes: 5 },
      { id: 's2', title: 'Set a 10-minute timer', detail: 'No scrolling.', estimateMinutes: 1 },
      {
        id: 's3',
        title: 'Watch light, people, and weather until the timer ends',
        estimateMinutes: 10,
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
        estimateMinutes: 5,
      },
      { id: 's2', title: 'Chop, heat, and plate one full meal', estimateMinutes: 35 },
      { id: 's3', title: 'Wash up when done', estimateMinutes: 5 },
    ],
  },
  'q-w-04': {
    journeyIntro: 'Stretch your route by one stop—see what you usually skip.',
    actionSteps: [
      { id: 's1', title: 'Ride or drive one stop farther', estimateMinutes: 15 },
      { id: 's2', title: 'Walk the extra stretch mindfully', estimateMinutes: 15 },
      { id: 's3', title: 'Note one thing you never saw before', estimateMinutes: 2 },
    ],
  },
  'q-w-05': {
    journeyIntro: 'One honest message to someone you have not spoken to lately.',
    actionSteps: [
      { id: 's1', title: 'Pick one person', estimateMinutes: 2 },
      {
        id: 's2',
        title: 'Write 2–4 genuine sentences',
        detail: 'No mass forwards.',
        estimateMinutes: 5,
      },
      { id: 's3', title: 'Send it', estimateMinutes: 1 },
    ],
  },
  'q-w-06': {
    journeyIntro: 'Learn the names of three plants on your block.',
    actionSteps: [
      { id: 's1', title: 'Walk your block once', estimateMinutes: 10 },
      {
        id: 's2',
        title: 'Identify three plants',
        detail: 'Book or free ID app is fine.',
        estimateMinutes: 20,
      },
      { id: 's3', title: 'Write their common names down', estimateMinutes: 5 },
    ],
  },
  'q-w-07': {
    journeyIntro: 'Cross the threshold of a place you always pass.',
    actionSteps: [
      { id: 's1', title: 'Choose a shop you never entered', estimateMinutes: 3 },
      { id: 's2', title: 'Stay inside at least 5 minutes', estimateMinutes: 5 },
      { id: 's3', title: 'Browse or thank someone and leave', estimateMinutes: 5 },
    ],
  },
  'q-w-08': {
    journeyIntro: 'Start the day outside with your first drink.',
    actionSteps: [
      { id: 's1', title: 'Prepare your drink as usual', estimateMinutes: 3 },
      {
        id: 's2',
        title: 'Take the first cup outdoors',
        detail: 'Balcony counts.',
        estimateMinutes: 12,
      },
      { id: 's3', title: 'Skip work email until the cup is empty', estimateMinutes: 1 },
    ],
  },
  'q-w-09': {
    journeyIntro: 'Hear a real voice for fifteen minutes.',
    actionSteps: [
      { id: 's1', title: 'Choose one person to call', estimateMinutes: 2 },
      {
        id: 's2',
        title: 'Talk live for at least 15 minutes',
        detail: 'Voice or video.',
        estimateMinutes: 15,
      },
      {
        id: 's3',
        title: 'Stick to something concrete',
        detail: 'Plans, a book, a walk.',
        estimateMinutes: 1,
      },
    ],
  },
  'q-w-10': {
    journeyIntro: 'Leave a short stretch of path cleaner than you found it.',
    actionSteps: [
      { id: 's1', title: 'Bring gloves or a bag', estimateMinutes: 2 },
      { id: 's2', title: 'Collect five pieces of litter on one walk', estimateMinutes: 25 },
      { id: 's3', title: 'Dispose or recycle properly', estimateMinutes: 3 },
    ],
  },
  'q-m-01': {
    journeyIntro: 'Follow a signed trail you have not walked before.',
    actionSteps: [
      { id: 's1', title: 'Pick a marked trail ≥3 km or ~45 min', estimateMinutes: 10 },
      { id: 's2', title: 'Bring water and follow posted signs', estimateMinutes: 45 },
      { id: 's3', title: 'Pause once to read a map or sign aloud', estimateMinutes: 5 },
    ],
  },
  'q-m-02': {
    journeyIntro: 'Real faces, real time—at least three people.',
    actionSteps: [
      { id: 's1', title: 'Plan a simple in-person gathering', estimateMinutes: 30 },
      {
        id: 's2',
        title: 'Spend 60+ minutes together',
        detail: 'Phones away except photos.',
        estimateMinutes: 60,
      },
      { id: 's3', title: 'Say what you would repeat next month', estimateMinutes: 5 },
    ],
  },
  'q-m-03': {
    journeyIntro: 'Taste a cuisine that is new to you.',
    actionSteps: [
      {
        id: 's1',
        title: 'Choose a restaurant or cuisine you have not tried',
        estimateMinutes: 15,
      },
      { id: 's2', title: 'Order two unfamiliar dishes', estimateMinutes: 5 },
      { id: 's3', title: 'Eat with attention—not desk lunch', estimateMinutes: 45 },
    ],
  },
  'q-m-05': {
    journeyIntro: 'Show up for your community for two hours.',
    actionSteps: [
      { id: 's1', title: 'Book a slot with an organization', estimateMinutes: 30 },
      { id: 's2', title: 'Arrive on time and complete the shift', estimateMinutes: 120 },
      { id: 's3', title: 'Name one task you did not expect', estimateMinutes: 5 },
    ],
  },
  'q-m-06': {
    journeyIntro: 'Sleep somewhere that is not your usual bed.',
    actionSteps: [
      { id: 's1', title: 'Book or arrange one night away', estimateMinutes: 60 },
      { id: 's2', title: 'Spend the full night there', estimateMinutes: 480 },
      { id: 's3', title: 'Notice how waking up felt different', estimateMinutes: 10 },
    ],
  },
  'q-y-01': {
    journeyIntro: 'A short trip that breaks your everyday radius.',
    actionSteps: [
      {
        id: 's1',
        title: 'Plan transport and one night away',
        detail: '≥100 km from home.',
        estimateMinutes: 120,
      },
      { id: 's2', title: 'Do one activity you cannot do at home', estimateMinutes: 180 },
      { id: 's3', title: 'Bring back one detail you want to keep', estimateMinutes: 15 },
    ],
  },
  'q-y-02': {
    journeyIntro: 'Learn an outdoor skill with a real guide.',
    actionSteps: [
      { id: 's1', title: 'Book a session with an instructor', estimateMinutes: 60 },
      { id: 's2', title: 'Show up with their prep list', estimateMinutes: 30 },
      { id: 's3', title: 'Finish the session and debrief yourself', estimateMinutes: 240 },
    ],
  },
  'q-y-03': {
    journeyIntro: 'Reconnect after a long silence.',
    actionSteps: [
      { id: 's1', title: 'Reach out and propose a real catch-up', estimateMinutes: 30 },
      { id: 's2', title: 'Meet or video call ≥45 minutes', estimateMinutes: 45 },
      { id: 's3', title: 'Listen for the first half of the time', estimateMinutes: 1 },
    ],
  },
  'q-y-04': {
    journeyIntro: 'One full day without productivity theater.',
    actionSteps: [
      { id: 's1', title: 'Pick a weekend or holiday day', estimateMinutes: 5 },
      { id: 's2', title: 'No paid work, errands, or chores marathons', estimateMinutes: 480 },
      { id: 's3', title: 'Spend the day on rest, play, or people', estimateMinutes: 480 },
    ],
  },
};
