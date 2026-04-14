-- Stage 6 validation queries
-- Run in Supabase SQL editor after applying schema.sql.

-- 1) Onboarding completion rate
select
  count(*) filter (where onboarding_completed) as completed_users,
  count(*) as total_users,
  round(
    100.0 * count(*) filter (where onboarding_completed) / nullif(count(*), 0),
    2
  ) as onboarding_completion_rate_pct
from public.profiles;

-- 2) % users activating at least 1 quest
with activated_users as (
  select distinct user_id
  from public.user_quests
)
select
  count(*) as users_with_activation,
  (select count(*) from public.profiles) as total_users,
  round(
    100.0 * count(*) / nullif((select count(*) from public.profiles), 0),
    2
  ) as quest_activation_rate_pct
from activated_users;

-- 3) % users completing at least 1 quest
with completed_users as (
  select distinct user_id
  from public.user_quests
  where status = 'completed'
)
select
  count(*) as users_with_completion,
  (select count(*) from public.profiles) as total_users,
  round(
    100.0 * count(*) / nullif((select count(*) from public.profiles), 0),
    2
  ) as quest_completion_rate_pct
from completed_users;

-- 4) % users creating at least 1 memory
with memory_users as (
  select distinct user_id
  from public.memory_entries
)
select
  count(*) as users_with_memory,
  (select count(*) from public.profiles) as total_users,
  round(
    100.0 * count(*) / nullif((select count(*) from public.profiles), 0),
    2
  ) as memory_creation_rate_pct
from memory_users;

-- 5) Average active quests by timeframe
with active_quests as (
  select
    uq.user_id,
    q.timeframe,
    count(*) as active_count
  from public.user_quests uq
  join public.quests q on q.id = uq.quest_id
  where uq.status = 'active'
  group by uq.user_id, q.timeframe
)
select
  timeframe,
  round(avg(active_count)::numeric, 2) as avg_active_quests_per_user
from active_quests
group by timeframe
order by timeframe;

-- 6) D2 return rate from app_opened events
with first_open as (
  select user_id, min(occurred_at) as first_opened_at
  from public.analytics_events
  where event_name = 'app_opened'
    and user_id is not null
  group by user_id
),
day_2_return as (
  select distinct f.user_id
  from first_open f
  join public.analytics_events e
    on e.user_id = f.user_id
   and e.event_name = 'app_opened'
   and e.occurred_at >= f.first_opened_at + interval '2 days'
)
select
  count(*) as users_returned_day_2,
  (select count(*) from first_open) as users_with_first_open,
  round(
    100.0 * count(*) / nullif((select count(*) from first_open), 0),
    2
  ) as d2_return_rate_pct
from day_2_return;

-- 7) D7 return rate from app_opened events
with first_open as (
  select user_id, min(occurred_at) as first_opened_at
  from public.analytics_events
  where event_name = 'app_opened'
    and user_id is not null
  group by user_id
),
day_7_return as (
  select distinct f.user_id
  from first_open f
  join public.analytics_events e
    on e.user_id = f.user_id
   and e.event_name = 'app_opened'
   and e.occurred_at >= f.first_opened_at + interval '7 days'
)
select
  count(*) as users_returned_day_7,
  (select count(*) from first_open) as users_with_first_open,
  round(
    100.0 * count(*) / nullif((select count(*) from first_open), 0),
    2
  ) as d7_return_rate_pct
from day_7_return;
