insert into public.categories (id, slug, name, description)
values
  ('cat-nature', 'nature', 'Nature', 'Get outside, notice plants, weather, and light.'),
  ('cat-adventure', 'adventure', 'Adventure', 'Small trips, new routes, and light exploration.'),
  ('cat-social', 'social', 'Social', 'Real conversations and low-pressure connection.'),
  ('cat-relax', 'relax', 'Relax', 'Slow down with something simple and restorative.')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description;

insert into public.quests (
  id,
  title,
  short_description,
  full_description,
  category_id,
  timeframe,
  difficulty,
  estimated_duration_minutes,
  prompt_for_reflection,
  suggested_proof_type,
  is_active
)
values
  ('q-w-01', 'Walk 20 minutes without headphones', 'Leave earbuds at home; listen to the street or birds.', 'Pick any outdoor loop or errand route. Walk at least 20 minutes with no podcasts or music. Notice three distinct sounds before you return.', 'cat-nature', 'weekly', 'easy', 25, 'Which sound stuck with you after you stopped?', 'text', true),
  ('q-w-02', 'Sit on a bench for 10 minutes', 'Find a public bench; sit and watch people pass.', 'No scrolling. Set a timer for 10 minutes on any park or street bench. Observe movement, light, and weather.', 'cat-relax', 'weekly', 'easy', 15, 'What detail would you not have noticed if you had kept walking?', 'none', true),
  ('q-w-03', 'Cook one meal from scratch', 'No kits: chop vegetables and use the stove yourself.', 'Make one full plate (breakfast, lunch, or dinner) using raw ingredients only—no microwave-only meals. Wash up when done.', 'cat-relax', 'weekly', 'medium', 45, 'Did the process feel slower or more satisfying than usual?', 'photo', true),
  ('q-w-04', 'Take a bus or train one stop past your usual', 'Ride transit one stop farther, then walk back.', 'Use public transit if available. Get off one stop after your normal stop and walk home or to your destination. If you drive, park 10 minutes farther once.', 'cat-adventure', 'weekly', 'easy', 30, 'What did you see on the extra stretch that you usually skip?', 'text', true),
  ('q-w-05', 'Message someone you have not texted in 30 days', 'Send one genuine check-in—no mass forwards.', 'Choose one person. Write 2–4 sentences asking how they are or referencing something specific you remember about them.', 'cat-social', 'weekly', 'easy', 10, 'How did it feel to reach out without an agenda?', 'none', true),
  ('q-w-06', 'Identify three plants on your block', 'Use a book or app; write their common names.', 'Walk your block once. Name three plants (trees, weeds, or flowers). If unsure, use a free plant ID app or a field guide from the library.', 'cat-nature', 'weekly', 'medium', 35, 'Did knowing the names change how you looked at the street?', 'text', true),
  ('q-w-07', 'Visit a shop you have never entered', 'Step inside; stay at least 5 minutes.', 'Pick any local store, bakery, or shop you always pass. Go in, browse, and optionally buy one small item or thank the staff and leave.', 'cat-adventure', 'weekly', 'easy', 25, 'What surprised you once you crossed the threshold?', 'text', true),
  ('q-w-08', 'Drink morning coffee or tea outside', 'First cup of the day on a balcony, stoop, or yard.', 'Prepare your drink as usual. Consume the first cup outdoors (balcony counts). No work email during the cup.', 'cat-relax', 'weekly', 'easy', 15, 'How did outdoor light change the start of your day?', 'photo', true),
  ('q-w-09', 'Have a 15-minute voice or video call', 'Real-time talk with one person—no voice notes.', 'Schedule or place a spontaneous call. Talk about something concrete (weekend plans, a book, a walk) for at least 15 minutes.', 'cat-social', 'weekly', 'medium', 20, 'What was easier live than in text?', 'none', true),
  ('q-w-10', 'Pick up five pieces of litter on one walk', 'Bring a bag; dispose of trash properly.', 'On any walk, collect five small pieces of litter wearing gloves or using a bag as a barrier. Recycle if possible; otherwise bin.', 'cat-nature', 'weekly', 'easy', 30, 'Did the place feel different after you left it cleaner?', 'text', true),
  ('q-m-01', 'Hike or walk a marked trail you have not done', 'Use an official trail; follow posted signs.', 'Choose a trail or signed path at least 3 km total (or 45 minutes). Bring water. Stop once to read the map or a sign aloud.', 'cat-nature', 'monthly', 'medium', 120, 'Where on the trail did you feel most away from routine?', 'photo', true),
  ('q-m-02', 'Host or attend one in-person gathering', 'At least three people including you; not a work meeting.', 'Coffee, potluck, board games, or a walk with friends counts. Aim for 60+ minutes together. Phones away except for photos.', 'cat-social', 'monthly', 'hard', 90, 'What would you repeat next month?', 'photo', true),
  ('q-m-03', 'Try a new cuisine at a sit-down restaurant', 'Order two dishes you have never tried from that tradition.', 'Pick a cuisine that is new to you (Ethiopian, regional Chinese, etc.). Eat in or proper takeout with time to taste—not desk lunch.', 'cat-adventure', 'monthly', 'medium', 90, 'Which flavor or texture will you remember?', 'photo', true),
  ('q-m-05', 'Volunteer one shift of 2+ hours', 'Sign up with an organization; show up on time.', 'Food bank, park cleanup, animal shelter, or community fridge. Complete one scheduled session of at least two hours.', 'cat-social', 'monthly', 'hard', 150, 'What task did you not expect to do?', 'text', true),
  ('q-m-06', 'Sleep outside your home one night', 'Camping, cabin, or trusted friend''s guest room counts.', 'Spend one full night away from your usual bed—tent, hostel, or overnight train in a sleeper berth counts if booked in advance.', 'cat-adventure', 'monthly', 'hard', 720, 'What felt different when you woke up?', 'photo', true),
  ('q-y-01', 'Take a trip at least 100 km from home', 'Stay overnight; plan transport and lodging ahead.', 'Travel by any mode to a place at least 100 km away, stay at least one night, and do one activity there you cannot do at home.', 'cat-adventure', 'yearly', 'hard', 2880, 'What from the trip do you want to keep in daily life?', 'photo', true),
  ('q-y-02', 'Learn one outdoor skill in a class or with a guide', 'Examples: climbing intro, kayaking, navigation, foraging.', 'Book a single session with an instructor or guided group. Show up prepared per their list and complete the session.', 'cat-nature', 'yearly', 'hard', 240, 'Would you do it again without the instructor?', 'photo', true),
  ('q-y-03', 'Reconnect with someone you lost touch with for a year+', 'In-person meet preferred; otherwise video call 45+ min.', 'Reach out, explain you want to catch up, and meet or call for at least 45 minutes. Listen more than you talk for the first half.', 'cat-social', 'yearly', 'hard', 60, 'What felt restored—or honestly closed?', 'none', true),
  ('q-y-04', 'Do a full day with no work or chores', 'One waking day: no email, errands, or house projects.', 'Pick a weekend or holiday. No paid work, no cleaning marathons, no "quick" fixes. Spend the day on rest, play, or people.', 'cat-relax', 'yearly', 'medium', 960, 'What did your body do when nothing was "productive"?', 'text', true)
on conflict (id) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  category_id = excluded.category_id,
  timeframe = excluded.timeframe,
  difficulty = excluded.difficulty,
  estimated_duration_minutes = excluded.estimated_duration_minutes,
  prompt_for_reflection = excluded.prompt_for_reflection,
  suggested_proof_type = excluded.suggested_proof_type,
  is_active = excluded.is_active;

-- Journey copy: mirrors `src/constants/questJourneys.ts`. Regenerate with:
--   node scripts/emit-journey-seed-sql.cjs
-- (source data: `scripts/quest-journeys-data.cjs`)

update public.quests set journey_intro = 'A short walk with only the world as your soundtrack.', action_steps = $json$[{"id":"s1","title":"Leave podcasts and music behind","detail":"Earbuds stay home or stay in your pocket for this walk.","estimateMinutes":1},{"id":"s2","title":"Walk at least 20 minutes outside","detail":"Any loop or errand route counts.","estimateMinutes":20},{"id":"s3","title":"Notice three distinct sounds","detail":"Before you finish, name them quietly to yourself.","estimateMinutes":5}]$json$::jsonb where id = 'q-w-01';
update public.quests set journey_intro = 'Ten minutes of stillness in public—no feed, just the scene.', action_steps = $json$[{"id":"s1","title":"Find a bench with a view","estimateMinutes":5},{"id":"s2","title":"Set a 10-minute timer","detail":"No scrolling.","estimateMinutes":1},{"id":"s3","title":"Watch light, people, and weather until the timer ends","estimateMinutes":10}]$json$::jsonb where id = 'q-w-02';
update public.quests set journey_intro = 'Cook a real meal with your hands, not a kit.', action_steps = $json$[{"id":"s1","title":"Choose raw ingredients only","detail":"Skip microwave-only shortcuts.","estimateMinutes":5},{"id":"s2","title":"Chop, heat, and plate one full meal","estimateMinutes":35},{"id":"s3","title":"Wash up when done","estimateMinutes":5}]$json$::jsonb where id = 'q-w-03';
update public.quests set journey_intro = 'Stretch your route by one stop—see what you usually skip.', action_steps = $json$[{"id":"s1","title":"Ride or drive one stop farther","estimateMinutes":15},{"id":"s2","title":"Walk the extra stretch mindfully","estimateMinutes":15},{"id":"s3","title":"Note one thing you never saw before","estimateMinutes":2}]$json$::jsonb where id = 'q-w-04';
update public.quests set journey_intro = 'One honest message to someone you have not spoken to lately.', action_steps = $json$[{"id":"s1","title":"Pick one person","estimateMinutes":2},{"id":"s2","title":"Write 2–4 genuine sentences","detail":"No mass forwards.","estimateMinutes":5},{"id":"s3","title":"Send it","estimateMinutes":1}]$json$::jsonb where id = 'q-w-05';
update public.quests set journey_intro = 'Learn the names of three plants on your block.', action_steps = $json$[{"id":"s1","title":"Walk your block once","estimateMinutes":10},{"id":"s2","title":"Identify three plants","detail":"Book or free ID app is fine.","estimateMinutes":20},{"id":"s3","title":"Write their common names down","estimateMinutes":5}]$json$::jsonb where id = 'q-w-06';
update public.quests set journey_intro = 'Cross the threshold of a place you always pass.', action_steps = $json$[{"id":"s1","title":"Choose a shop you never entered","estimateMinutes":3},{"id":"s2","title":"Stay inside at least 5 minutes","estimateMinutes":5},{"id":"s3","title":"Browse or thank someone and leave","estimateMinutes":5}]$json$::jsonb where id = 'q-w-07';
update public.quests set journey_intro = 'Start the day outside with your first drink.', action_steps = $json$[{"id":"s1","title":"Prepare your drink as usual","estimateMinutes":3},{"id":"s2","title":"Take the first cup outdoors","detail":"Balcony counts.","estimateMinutes":12},{"id":"s3","title":"Skip work email until the cup is empty","estimateMinutes":1}]$json$::jsonb where id = 'q-w-08';
update public.quests set journey_intro = 'Hear a real voice for fifteen minutes.', action_steps = $json$[{"id":"s1","title":"Choose one person to call","estimateMinutes":2},{"id":"s2","title":"Talk live for at least 15 minutes","detail":"Voice or video.","estimateMinutes":15},{"id":"s3","title":"Stick to something concrete","detail":"Plans, a book, a walk.","estimateMinutes":1}]$json$::jsonb where id = 'q-w-09';
update public.quests set journey_intro = 'Leave a short stretch of path cleaner than you found it.', action_steps = $json$[{"id":"s1","title":"Bring gloves or a bag","estimateMinutes":2},{"id":"s2","title":"Collect five pieces of litter on one walk","estimateMinutes":25},{"id":"s3","title":"Dispose or recycle properly","estimateMinutes":3}]$json$::jsonb where id = 'q-w-10';
update public.quests set journey_intro = 'Follow a signed trail you have not walked before.', action_steps = $json$[{"id":"s1","title":"Pick a marked trail ≥3 km or ~45 min","estimateMinutes":10},{"id":"s2","title":"Bring water and follow posted signs","estimateMinutes":45},{"id":"s3","title":"Pause once to read a map or sign aloud","estimateMinutes":5}]$json$::jsonb where id = 'q-m-01';
update public.quests set journey_intro = 'Real faces, real time—at least three people.', action_steps = $json$[{"id":"s1","title":"Plan a simple in-person gathering","estimateMinutes":30},{"id":"s2","title":"Spend 60+ minutes together","detail":"Phones away except photos.","estimateMinutes":60},{"id":"s3","title":"Say what you would repeat next month","estimateMinutes":5}]$json$::jsonb where id = 'q-m-02';
update public.quests set journey_intro = 'Taste a cuisine that is new to you.', action_steps = $json$[{"id":"s1","title":"Choose a restaurant or cuisine you have not tried","estimateMinutes":15},{"id":"s2","title":"Order two unfamiliar dishes","estimateMinutes":5},{"id":"s3","title":"Eat with attention—not desk lunch","estimateMinutes":45}]$json$::jsonb where id = 'q-m-03';
update public.quests set journey_intro = 'Show up for your community for two hours.', action_steps = $json$[{"id":"s1","title":"Book a slot with an organization","estimateMinutes":30},{"id":"s2","title":"Arrive on time and complete the shift","estimateMinutes":120},{"id":"s3","title":"Name one task you did not expect","estimateMinutes":5}]$json$::jsonb where id = 'q-m-05';
update public.quests set journey_intro = 'Sleep somewhere that is not your usual bed.', action_steps = $json$[{"id":"s1","title":"Book or arrange one night away","estimateMinutes":60},{"id":"s2","title":"Spend the full night there","estimateMinutes":480},{"id":"s3","title":"Notice how waking up felt different","estimateMinutes":10}]$json$::jsonb where id = 'q-m-06';
update public.quests set journey_intro = 'A short trip that breaks your everyday radius.', action_steps = $json$[{"id":"s1","title":"Plan transport and one night away","detail":"≥100 km from home.","estimateMinutes":120},{"id":"s2","title":"Do one activity you cannot do at home","estimateMinutes":180},{"id":"s3","title":"Bring back one detail you want to keep","estimateMinutes":15}]$json$::jsonb where id = 'q-y-01';
update public.quests set journey_intro = 'Learn an outdoor skill with a real guide.', action_steps = $json$[{"id":"s1","title":"Book a session with an instructor","estimateMinutes":60},{"id":"s2","title":"Show up with their prep list","estimateMinutes":30},{"id":"s3","title":"Finish the session and debrief yourself","estimateMinutes":240}]$json$::jsonb where id = 'q-y-02';
update public.quests set journey_intro = 'Reconnect after a long silence.', action_steps = $json$[{"id":"s1","title":"Reach out and propose a real catch-up","estimateMinutes":30},{"id":"s2","title":"Meet or video call ≥45 minutes","estimateMinutes":45},{"id":"s3","title":"Listen for the first half of the time","estimateMinutes":1}]$json$::jsonb where id = 'q-y-03';
update public.quests set journey_intro = 'One full day without productivity theater.', action_steps = $json$[{"id":"s1","title":"Pick a weekend or holiday day","estimateMinutes":5},{"id":"s2","title":"No paid work, errands, or chores marathons","estimateMinutes":480},{"id":"s3","title":"Spend the day on rest, play, or people","estimateMinutes":480}]$json$::jsonb where id = 'q-y-04';

-- Suggested hub grouping (see `pickSuggestedQuests` in app)
update public.quests set suggested_group = 'outside' where id = 'q-w-01';
update public.quests set suggested_group = 'do_now' where id = 'q-w-02';
update public.quests set suggested_group = 'low_energy' where id = 'q-w-03';
update public.quests set suggested_group = 'outside' where id = 'q-w-04';
update public.quests set suggested_group = 'social' where id = 'q-w-05';
update public.quests set suggested_group = 'outside' where id = 'q-w-06';
update public.quests set suggested_group = 'weekend' where id = 'q-w-07';
update public.quests set suggested_group = 'do_now' where id = 'q-w-08';
update public.quests set suggested_group = 'social' where id = 'q-w-09';
update public.quests set suggested_group = 'outside' where id = 'q-w-10';
update public.quests set suggested_group = 'outside' where id = 'q-m-01';
update public.quests set suggested_group = 'social' where id = 'q-m-02';
update public.quests set suggested_group = 'weekend' where id = 'q-m-03';
update public.quests set suggested_group = 'social' where id = 'q-m-05';
update public.quests set suggested_group = 'weekend' where id = 'q-m-06';
update public.quests set suggested_group = 'weekend' where id = 'q-y-01';
update public.quests set suggested_group = 'outside' where id = 'q-y-02';
update public.quests set suggested_group = 'social' where id = 'q-y-03';
update public.quests set suggested_group = 'weekend' where id = 'q-y-04';
