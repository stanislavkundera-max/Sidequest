# Moderated usability session guide (Round 1: UX friction & bugs)

Scope for this round: **find where people get confused or stuck**, not whether the
product idea works long-term. That question belongs to a later, unmoderated
round — see [`stage-6-validation.md`](stage-6-validation.md) for the
hypotheses/metrics framework once you have more data to look at.

This round is **web preview only**. That means:
- Camera and calendar quest steps cannot be exercised — pick a quest for the
  session that only uses `timer` / `input` / `counter` / `confirm` steps
  (e.g. *"Walk 20 minutes without headphones"* or *"Sit on a bench for 10
  minutes"*). Native-only steps are a separate, later check.
- The web layout is already forced to a phone-width column, so desktop and
  mobile browsers look the same — no extra setup needed for that.

## 1) Recruiting

6 sessions is enough for round-1 usability signal (Nielsen's ~5-8 rule):
- **3 friends/family** — fast to book, good for catching outright bugs and
  confusing copy.
- **3 people closer to the target persona** (strangers or looser contacts) —
  slower to recruit, but their confusion is a truer signal than a friend
  being polite.

Book 30 minutes each; the script below runs ~25 minutes.

## 2) Before every session

1. **Reset the test account** so each tester starts from zero:
   - Sign in as the admin account (`stanislav.kundera@gmail.com`).
   - Progress tab → Account card → **Delete all progress** (wipes quests,
     memories, resets onboarding).
   - Toggle **Preview as user** on, so the tester never sees admin buttons.
2. **Make the local server reachable:**
   - In person: just hand them your laptop/keyboard, or mirror your screen.
   - Remote: expose the dev server with a tunnel so they can open it in
     their own browser on a call while sharing their screen:
     ```
     npx cloudflared tunnel --url http://localhost:8090
     ```
     (or `npx expo start --tunnel` and press `w` — same effect via Expo's
     own tunnel). Send them the printed `https://...trycloudflare.com` URL.
3. Have the Supabase `analytics_events` table open in another tab so you can
   cross-check afterwards (see §5).

## 3) Moderator script

Read the intro close to verbatim — it sets expectations and gets consent.

> "Díky, že si na tohle uděláváš čas. Testujeme appku, ne tebe — pokud se
> někde zaseknete, je to informace pro nás, ne vaše chyba. Prosím,
> přemýšlejte nahlas — cokoliv vás napadne, i 'tohle je matoucí' nebo 'tady
> bych čekal jinou reakci', klidně řekněte. Můžu si to nahrát/dělat si
> poznámky? Není tu nic tajného, klidně to zkoušejte i 'špatně'."

### Task 0 — Cold read (before opening the app)

Show just the app name/icon or say "Side Quest Life". Ask:
- "Co myslíte, že tahle appka dělá?"
- "Kdo by ji podle vás používal?"

*(Purpose: catches whether the name/positioning communicates anything before
the UI does the explaining for them.)*

### Task 1 — Onboarding

"Otevřete appku a projděte tím, čím vás provede."

Watch for, don't prompt unless stuck:
- Do they read the "How it works" step, or skip through?
- Any hesitation on the category / pace / focus questions — do they
  understand what's being asked?
- Reaction to the final summary screen ("Your map is ready") — do they
  notice the recommended quests are *for them*?

### Task 2 — Explore map

"Tady jste teď — co byste udělali dál?"

Watch for:
- Do they understand the map is tappable? Do they find a marker at all?
- Reaction to the "?" markers — confusing mystery, or intriguing?
- Once a marker is tapped: do they notice **In progress** vs **Recommended
  for you**? Do they read the one recommended quest, or just tap "Start
  now" immediately?
- Do they ever notice/use **Discover more**? If yes, do they understand it
  took them to Journey with that category preselected?

### Task 3 — Run a quest

Steer them (if they haven't already) to a quest with only web-safe steps.
"Začněte tenhle quest."

Watch for:
- Reaction to the step-by-step format vs. a simple checklist — do they
  expect to be able to skip ahead?
- **Timer step**: do they try to rush it, tab away, or get impatient? Do
  they understand *why* it's gated?
- **Input/counter step**: is the prompt clear? Do they write something
  genuine or a placeholder answer just to proceed?
- Ask directly at least once: "Kdybyste teď chtěli quest opustit, jak byste
  to udělali?" — see if they find the **Leave** button in the header
  unprompted before you ask.

### Task 4 — Wrap-up and memory

Let them finish the quest (or fast-forward narratively: "Představte si, že
jste dokončili všechny kroky").

Watch for:
- Reaction to the evidence summary on the done screen.
- If they open "Log memory": do they notice the draft was pre-filled from
  what they wrote/collected? Does that feel helpful or presumptuous?

### Task 5 — Progress tab

"Mrkněte na záložku Progress."

Watch for:
- Do they understand the trophy/medal framing, or does it feel childish /
  unclear?
- Does the empty or near-empty state (since they just started) feel
  motivating or discouraging?

### Closing questions (semi-structured)

- "Co vás nejvíc zmátlo?"
- "Bylo něco, co jste čekali, že appka udělá, a neudělala?"
- "Použili byste tohle příští týden sami od sebe? Proč / proč ne?"
- "Na škále 0–10, jak pravděpodobně byste tohle doporučili kamarádovi?"
- "Co appce podle vás chybí?"

## 4) Observation sheet (fill live, one row per notable moment)

| Time | Screen | What happened | Your read (confusion / friction / delight) | Severity (1–3) |
|---|---|---|---|---|
| | | | | |

Severity: **1** = cosmetic/nice-to-fix, **2** = caused hesitation but they
recovered, **3** = they got stuck or gave up without your help.

## 5) After each session — cross-check with analytics

```sql
select event_name, properties, occurred_at
from public.analytics_events
where user_id = '<the admin/test user id>'
order by occurred_at asc;
```

Compare the event stream to what you observed — gaps between "what they did"
and "what fired" can themselves be bugs (e.g. a tap that silently no-ops).

## 6) Synthesis (after all 6 sessions)

1. Pool every observation-sheet row across sessions into one list.
2. Group near-duplicates (same screen, same confusion) — frequency across
   testers matters more than any single session's severity rating.
3. Rank: **frequency × severity**. Fix the top of that list first.
4. Anything that's a bigger structural question ("do people even want
   this?") — park it for the later round using
   [`stage-6-validation.md`](stage-6-validation.md) and
   [`real-user-testing-checklist.md`](real-user-testing-checklist.md), which
   already cover multi-day retention and analytics-based validation once
   you have more testers using it unsupervised.

## Known gaps this round does not cover

- Camera and calendar quest steps (native-only).
- Multi-day return behavior / whether people actually finish a week-long
  quest — that's the diary-study / analytics round, not this one.
- Performance/stability on a real device (web preview only).
