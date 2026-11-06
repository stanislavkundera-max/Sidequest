-- Analytics dashboard (#67) — saved queries for the Supabase SQL editor.
--
-- HOW TO USE
--
-- 1. Run SECTION 0 once. It makes a private schema `insights`, with
--    • insights.excluded_users — your own and test accounts, left out of every number
--    • insights.events          — analytics_events without those accounts and without
--                                 deleted accounts (user_id null)
--    The schema is not exposed through the API and anon/authenticated get no
--    access to it, so app users still cannot read anyone's events (the RLS rule
--    in analytics_rls_own_only.sql stays as it is).
-- 2. Add your own accounts to insights.excluded_users (0b below).
-- 3. Save each numbered query below as its own snippet in the SQL editor
--    ("Save" → name it e.g. "1 Overview"). Run it whenever you want; switch the
--    result to "Chart" where a chart helps.
--
-- READ THE NUMBERS AS PEOPLE, NOT PERCENTAGES. A few dozen people a week: one
-- person more or less moves a rate by several points. Look for where *most*
-- people stop, not for a 3 % change.
--
-- What exists since when:
--   screen_viewed, quest_completion_abandoned, appVersion, otaUpdateId
--     → from the OTA of 2026-11-06 onwards. Older rows do not have them.
--   everything else → since the closed test (September 2026).

-- ===========================================================================
-- SECTION 0 — run once
-- ===========================================================================

-- 0a) The private schema and the two objects in it. Safe to re-run.
create schema if not exists insights;
revoke all on schema insights from public, anon, authenticated;

create table if not exists insights.excluded_users (
  user_id uuid primary key,
  note    text
);
-- Belt and braces: with RLS on and no policy, the API could not read it even if the schema were
-- exposed one day. The SQL editor runs as postgres and is not affected.
alter table insights.excluded_users enable row level security;

create or replace view insights.events as
select e.*
  from public.analytics_events e
 where e.user_id is not null
   and not exists (select 1 from insights.excluded_users x where x.user_id = e.user_id);

revoke all on all tables in schema insights from public, anon, authenticated;

-- 0b) Leave yourself out. List the accounts with an e-mail and pick yours:
select id, email, created_at, last_sign_in_at
  from auth.users
 where email is not null
 order by created_at;

-- …then put their ids here and run it (add the guest/test accounts from
-- cleanup_test_accounts.sql step 1 the same way):
-- insert into insights.excluded_users (user_id, note) values
--   ('00000000-0000-0000-0000-000000000000', 'Standa — phone'),
--   ('00000000-0000-0000-0000-000000000000', 'dev account (web)')
-- on conflict (user_id) do nothing;


-- ===========================================================================
-- 1) OVERVIEW — last 7 and last 30 days
-- ===========================================================================
-- "Active" = did something: started a quest, finished a step or a quest, saved
-- a memory (#68). Opening the app is not counted as active.
with windows(label, since) as (
  values ('last 7 days',  now() - interval '7 days'),
         ('last 30 days', now() - interval '30 days')
),
first_seen as (
  select user_id, min(occurred_at) as first_at from insights.events group by user_id
)
select w.label,
       count(distinct e.user_id) filter (where e.event_name = 'app_opened')              as opened_app,
       count(distinct e.user_id) filter (where e.event_name in
         ('quest_activated', 'quest_step_completed', 'quest_completed', 'memory_created')) as active,
       (select count(*) from first_seen f where f.first_at >= w.since)                    as new_people,
       count(*) filter (where e.event_name = 'quest_completed')                           as quests_finished,
       count(*) filter (where e.event_name = 'memory_created')                            as memories_saved
  from windows w
  left join insights.events e on e.occurred_at >= w.since
 group by w.label, w.since
 order by w.since desc;


-- ===========================================================================
-- 2) ONBOARDING — where people stop
-- ===========================================================================
-- People who started onboarding in the last 30 days, and how far each got.
-- `onboarding_edit` (changing preferences later) is left out.
with starters as (
  select user_id, min(occurred_at) as started_at
    from insights.events
   where event_name = 'onboarding_started'
     and properties->>'sourceScreen' = 'onboarding'
     and occurred_at >= now() - interval '30 days'
   group by user_id
),
reached as (
  select s.user_id,
         bool_or(e.event_name = 'category_preferences_selected') as picked_categories,
         bool_or(e.event_name = 'intensity_selected')            as picked_intensity,
         bool_or(e.event_name = 'onboarding_completed'
                 and e.properties->>'sourceScreen' = 'onboarding') as completed,
         bool_or(e.event_name = 'onboarding_skipped')            as skipped
    from starters s
    left join insights.events e
      on e.user_id = s.user_id and e.occurred_at >= s.started_at
   group by s.user_id
)
select count(*)                                   as started,
       count(*) filter (where picked_categories)  as picked_categories,
       count(*) filter (where picked_intensity)   as picked_intensity,
       count(*) filter (where completed)          as completed,
       count(*) filter (where skipped)            as skipped,
       count(*) filter (where not completed and not skipped) as left_midway
  from reached;


-- ===========================================================================
-- 3) FROM FIRST QUEST TO FIRST MEMORY — the main loop
-- ===========================================================================
-- Everyone first seen in the last 90 days, and the first time each reached
-- each stage. `days_to_*` is the median wait for those who got there.
with people as (
  select user_id,
         min(occurred_at)                                                     as first_seen,
         min(occurred_at) filter (where event_name = 'quest_detail_viewed')   as viewed,
         min(occurred_at) filter (where event_name = 'quest_activated')       as started,
         min(occurred_at) filter (where event_name = 'quest_step_completed')  as first_step,
         min(occurred_at) filter (where event_name = 'quest_completed')       as finished,
         min(occurred_at) filter (where event_name = 'memory_created')        as memory
    from insights.events
   group by user_id
  having min(occurred_at) >= now() - interval '90 days'
)
select count(*)          as people,
       count(viewed)     as opened_a_quest,
       count(started)    as started_a_quest,
       count(first_step) as finished_a_step,
       count(finished)   as finished_a_quest,
       count(memory)     as saved_a_memory,
       round((percentile_cont(0.5) within group (
         order by extract(epoch from started - first_seen) / 86400))::numeric, 1)  as median_days_to_start,
       round((percentile_cont(0.5) within group (
         order by extract(epoch from finished - first_seen) / 86400))::numeric, 1) as median_days_to_finish
  from people;


-- ===========================================================================
-- 4) PER QUEST — started but not finished, "can't do it here"
-- ===========================================================================
-- Counted in people, not taps. Sorted by how many started it.
select e.properties->>'questId'                                                            as quest_id,
       q.title,
       count(distinct e.user_id) filter (where e.event_name = 'quest_detail_viewed')        as opened,
       count(distinct e.user_id) filter (where e.event_name = 'quest_activated')            as started,
       count(distinct e.user_id) filter (where e.event_name = 'quest_step_completed')       as did_a_step,
       count(distinct e.user_id) filter (where e.event_name = 'quest_completed')            as finished,
       count(distinct e.user_id) filter (where e.event_name = 'quest_deactivated')          as paused_or_left,
       count(distinct e.user_id) filter (where e.event_name = 'quest_unavailable_here')     as cant_do_here,
       count(distinct e.user_id) filter (where e.event_name = 'quest_dismissed')            as not_for_me
  from insights.events e
  left join public.quests q on q.id = e.properties->>'questId'
 where e.properties ? 'questId'
 group by 1, 2
 order by started desc, opened desc;


-- ===========================================================================
-- 5) LEAVING THE QUEST RUNNER — which step people walk away on
-- ===========================================================================
-- quest_completion_abandoned = the runner was closed with the quest still
-- open (not paused, not finished). `came_back_and_finished` = how many of those
-- people finished that quest later anyway. Data from 2026-11-06 on.
with exits as (
  select user_id,
         properties->>'questId'                    as quest_id,
         (properties->>'stepNumber')::int          as step_number,
         (properties->>'totalSteps')::int          as total_steps,
         (properties->>'secondsOnScreen')::numeric as seconds,
         occurred_at
    from insights.events
   where event_name = 'quest_completion_abandoned'
)
select x.quest_id,
       q.title,
       x.step_number || ' / ' || x.total_steps                              as step,
       count(*)                                                             as exits,
       count(distinct x.user_id)                                            as people,
       round((percentile_cont(0.5) within group (order by x.seconds))::numeric) as median_seconds,
       count(distinct x.user_id) filter (where exists (
         select 1 from insights.events f
          where f.user_id = x.user_id
            and f.event_name = 'quest_completed'
            and f.properties->>'questId' = x.quest_id
            and f.occurred_at > x.occurred_at))                             as came_back_and_finished
  from exits x
  left join public.quests q on q.id = x.quest_id
 group by x.quest_id, q.title, x.step_number, x.total_steps
 order by people desc, exits desc;


-- ===========================================================================
-- 6) SAVING A MEMORY — opened the form but did not save
-- ===========================================================================
-- memory_new = the "New memory" screen; quest_runner_auto = saved automatically
-- when a quest is finished (has no "started" event of its own).
select coalesce(properties->>'sourceScreen', '?')                        as source,
       count(*) filter (where event_name = 'memory_creation_started')    as opened_form,
       count(*) filter (where event_name = 'memory_created')             as saved,
       count(*) filter (where event_name = 'memory_created'
                          and (properties->>'hasPhoto')::boolean)        as saved_with_photo,
       count(*) filter (where event_name = 'memory_creation_failed')     as failed
  from insights.events
 where event_name in ('memory_creation_started', 'memory_created', 'memory_creation_failed')
   and occurred_at >= now() - interval '30 days'
 group by 1
 order by 2 desc;


-- ===========================================================================
-- 7) SCREENS — most visited, and where a visit ends
-- ===========================================================================
-- A visit ends after 30 minutes without a screen change. `last_screen_of_visit`
-- is where people put the phone down: high on a screen that is not an obvious
-- end point (a form, a quest step) is worth a look. Data from 2026-11-06 on.
with screens as (
  select user_id, occurred_at, properties->>'route' as route,
         lead(occurred_at) over (partition by user_id order by occurred_at) as next_at
    from insights.events
   where event_name = 'screen_viewed'
     and occurred_at >= now() - interval '30 days'
)
select route,
       count(*)                                                        as views,
       count(distinct user_id)                                         as people,
       count(*) filter (where next_at is null
                           or next_at - occurred_at > interval '30 minutes') as last_screen_of_visit
  from screens
 group by route
 order by views desc;


-- ===========================================================================
-- 8) RETENTION — of each week's newcomers, how many still do something
-- ===========================================================================
-- Rows: the week people were first seen. Columns: share of them active
-- (as in query 1) in week 1, 2, 4, 8 and 12 after. Empty = that week has not
-- happened yet.
with first_seen as (
  select user_id, date_trunc('week', min(occurred_at)) as cohort
    from insights.events
   group by user_id
),
activity as (
  select distinct e.user_id,
         floor(extract(epoch from date_trunc('week', e.occurred_at) - f.cohort) / 604800)::int as week_n
    from insights.events e
    join first_seen f using (user_id)
   where e.event_name in ('quest_activated', 'quest_step_completed', 'quest_completed', 'memory_created')
)
select to_char(f.cohort, 'YYYY-MM-DD')                                                   as week_of,
       count(distinct f.user_id)                                                         as people,
       count(distinct a.user_id) filter (where a.week_n = 0)                             as active_week_0,
       case when f.cohort + interval '1 week'  <= now() then round(100.0 * count(distinct a.user_id) filter (where a.week_n = 1)  / count(distinct f.user_id)) end as pct_week_1,
       case when f.cohort + interval '2 weeks' <= now() then round(100.0 * count(distinct a.user_id) filter (where a.week_n = 2)  / count(distinct f.user_id)) end as pct_week_2,
       case when f.cohort + interval '4 weeks' <= now() then round(100.0 * count(distinct a.user_id) filter (where a.week_n = 4)  / count(distinct f.user_id)) end as pct_week_4,
       case when f.cohort + interval '8 weeks' <= now() then round(100.0 * count(distinct a.user_id) filter (where a.week_n = 8)  / count(distinct f.user_id)) end as pct_week_8,
       case when f.cohort + interval '12 weeks' <= now() then round(100.0 * count(distinct a.user_id) filter (where a.week_n = 12) / count(distinct f.user_id)) end as pct_week_12
  from first_seen f
  left join activity a using (user_id)
 group by f.cohort
 order by f.cohort desc;


-- ===========================================================================
-- 9) WHICH APP VERSION PEOPLE RUN — did the OTA arrive?
-- ===========================================================================
-- otaUpdateId null = the bundle the build shipped with (no OTA applied yet).
-- Rows without appVersion are from before the 2026-11-06 OTA.
select coalesce(properties->>'appVersion', '(before 2026-11-06)')  as app_version,
       coalesce(properties->>'otaUpdateId', '(build bundle)')       as ota_update,
       count(distinct user_id)                                       as people,
       max(occurred_at)                                              as last_seen
  from insights.events
 where occurred_at >= now() - interval '7 days'
 group by 1, 2
 order by last_seen desc;
