/**
 * The daily journaling question (task 57, option A — Standa, 2026-10-17).
 *
 * One a day, the same for everyone, at the top of the Memories tab (DailyQuestionCard). Meant for paper
 * and pen — the card recommends it — but it can also be written in the app, where it is saved as a
 * memory (some people journal on the tram).
 *
 * Written against docs/quest-content-guidelines.md: every question is about something *noticed,
 * done or planned* in the real world, answerable in five minutes, never about giving something
 * up, no health claims, no therapy-speak. Plain words, second person.
 *
 * DRAFT for Standa to edit (2026-10-17). Order matters only loosely: neighbours are kept different
 * in kind, so two days in a row are not both about people or both about plans.
 */
export const DAILY_PROMPTS: readonly string[] = [
  'What did you notice on your way somewhere today that you usually walk past?',
  'Who made your day a little easier today, and how?',
  'What is one thing you would like to do outside this week? Write when.',
  'Describe the sky the last time you looked up properly.',
  'What did you eat today that you actually tasted?',
  'Which place near you have you never been inside? What do you imagine is there?',
  'What did you do today that you would like to remember in a year?',
  'Write down three sounds you heard outside today.',
  'Who have you not talked to in a while, and what would you ask them?',
  'What is something you are a beginner at — or would like to be?',
  'Describe a smell from today and where it was.',
  'What would a perfect free Saturday look like, hour by hour?',
  'What surprised you today, even a little?',
  'Which street, path or view near home do you like most? Why that one?',
  'What did you make, fix or tidy today with your hands?',
  'Write about the last time you laughed out loud. What was it?',
  'What is one small risk you could take this month?',
  'What was the weather doing today, and what did you do in it?',
  'Who taught you something you still use? Write what it was.',
  'If you had one free hour tomorrow, where would you go?',
  'What is something you saw today that was older than you?',
  'Describe the last place you sat down outside.',
  'What is a skill someone near you has that you admire?',
  'What did today feel like in one colour? Why that colour?',
  'Write down one thing you would like to see before the end of the year.',
  'What was the best ten minutes of your day?',
  'Which season is coming next? What do you want to do in it?',
  'Describe a conversation from today that went somewhere unexpected.',
  'What is a place you went as a child that you could visit again?',
  'What did you see from a window today?',
  'What is one thing you are looking forward to this week?',
  'Write about a stranger you noticed today.',
  'Which of your plans keeps getting postponed? What is its first small step?',
  'What did your body do today that you liked — walk, carry, stretch, climb?',
  'What is the most interesting thing within fifteen minutes of where you live?',
  'Who would you like to spend a whole day with soon? Doing what?',
  'What did you learn today, however small?',
  'Describe the light at the time of day you like best.',
  'What is something you own that has a story? Write the story.',
  'Where would you go if the next train left in ten minutes?',
  'What made you stop and look today?',
  'What is a meal you would like to cook for someone? Who?',
  'Write down the last thing that made you curious.',
  'What is one thing you did this week that took a bit of courage?',
  'Describe a tree, plant or animal you saw recently.',
  'What would you tell yourself from a year ago about now?',
  'Which friend would say yes to something spontaneous? What would you suggest?',
  'What did you hear today that you want to remember — a line, a song, a phrase?',
  'What is the furthest you have walked recently? Where to?',
  'What would make tomorrow slightly better than today?',
  'Describe a moment today when you were completely in what you were doing.',
  'What is a hill, roof or tower near you with a view? When could you go up?',
  'Who did you help today, even in a tiny way?',
  'What is something you used to love doing and have not done for ages?',
  'Write about the last time you were cold, wet or tired outside — and glad anyway.',
  'What is one question you would like to ask someone you know well?',
  'What did you notice about the people around you today?',
  'Which day this week had the most going on? Write it down.',
  'What is something you would like someone to teach you in person?',
  'Describe the inside of a place you went today — a shop, a café, a station.',
  'What did you do today purely because you wanted to?',
  'Write down a place in your town you have only ever passed in a car or on a tram.',
  'What was the first thing you saw this morning when you went outside?',
  'Who would you like to thank this week, and for what exactly?',
  'What is a small adventure you could have before Sunday?',
  'What texture did you touch today that you noticed — wood, stone, water, grass?',
  'Which memory from this year would you put on the first page of a book about it?',
  'What did you do today that nobody asked you to?',
  'Describe a building you like and what you like about it.',
  'What is one thing you could do this weekend that you have never done before?',
  'Who in your life always has a story? When did you last hear one?',
  'What did you notice about how the days are changing — light, temperature, colours?',
  'What is the best thing someone said to you recently?',
  'Write about a walk you would like to take with no destination.',
  'What did you finish today, big or small?',
  'Which place makes you feel far from routine? How long since you were there?',
  'What is something that made you smile on the way home?',
  'Describe a moment of quiet you had today.',
  'What would you like to be doing at this time next week?',
  'Who could you invite to something this month? What would it be?',
  'What is something you noticed today because you were not in a hurry?',
  'Write down three things in your bag or pockets and why each is there.',
  'What is a view you would like to see at sunrise?',
  'What did today teach you about what you enjoy?',
  'Describe the last time you were somewhere new.',
  'What is a small plan for tomorrow that would get you outside?',
  'Who made you think differently about something recently?',
  'What did the place you live sound like tonight?',
  'What is one thing from today you would like to do again?',
  'Write the first line of a story about your street.',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's question: one per calendar day in the phone's own time zone, the same for everyone. */
export function dailyPromptFor(date: Date = new Date()): string {
  const localDay = Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / DAY_MS);
  return DAILY_PROMPTS[((localDay % DAILY_PROMPTS.length) + DAILY_PROMPTS.length) % DAILY_PROMPTS.length];
}
