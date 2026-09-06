# Quest content guidelines

Rules for writing Side Quest Life quests. These sit under the product vision in
[`AGENTS.md`](../AGENTS.md) — read that first for tone, positioning, and the
"what not to build" list. This file is specifically about **what makes a good quest**.

---

## 1. Quests are about *doing*, never *abstaining*

A quest must ask the person to **do something real in the world** — go somewhere,
make something, meet someone, notice something. Never frame a quest as *not* doing
something.

**Not allowed** (abstention / negation quests):

- "Don't look at your phone after 8pm"
- "Don't go to sleep after midnight"
- "Don't eat after 8"
- any "avoid / quit / resist / stop X" framing

**Why:** those are digital-wellbeing / habit-restriction goals. Side Quest Life
connects technology with real life and *adds* experiences — it is not a screen-time
blocker or a rules-based restriction tracker. Testers read the abstention framing as a
mismatch for this app (Martin, round-1 feedback — see
[`docs/feedback/round-1-synthesis.md`](feedback/round-1-synthesis.md)).

**If the underlying intent is good, flip it to a positive real-world action:**

| Instead of (abstention) | Write (positive action) |
|---|---|
| "Don't use your phone tonight" | "Take a 20-minute walk with your phone left at home" |
| "Don't eat out this week" | "Cook one new dish from scratch" |
| "Stop doomscrolling" | "Read 10 pages of a paper book in a café" |

*Origin: product-owner decision, 2026-07-26.*

---

## 2. A quest is not finished until it has a journey

A catalogue row on its own gives the runner nothing to run. Every quest also needs
an entry in [`src/constants/questJourneys.ts`](../src/constants/questJourneys.ts):
a `journeyIntro` and three to five steps, each with its own title, detail, tip,
time estimate and interaction (`confirm`, `timer`, `input`, `counter`, `photo`).

**Why:** a half-written quest is worse than a missing one — it looks available in
the hub and then does nothing when someone picks it.

*Origin: content pass, 2026-09-05.*

---

## 3. Write every quest to both sources

The catalogue exists twice: [`src/constants/quests.ts`](../src/constants/quests.ts)
is the offline fallback, and the Supabase `quests` table is what the app actually
serves. Write the quest in TypeScript, then regenerate the SQL:

```
npx tsx scripts/export-quests-sql.cjs > supabase/quests_catalogue.sql
```

Then run the generated file in Supabase. Never hand-edit the SQL.

The generated file is authoritative, not additive: it also deactivates any quest
whose id is no longer in the catalogue. Deleting a quest from the TypeScript used
to leave it live in Supabase forever — `q-m-04` ("Digital sunset") was removed on
2026-08-21 for breaking rule 1 and was still being served to users on 2026-09-06.

**There is exactly one generator.** `scripts/quest-journeys-data.cjs` and
`scripts/emit-journey-seed-sql.cjs` were a second, older path that read a
hand-maintained copy of the journeys. By the time they were deleted on 2026-09-06
that copy held 19 quests, knew nothing of the 22 added since, and was missing the
`interaction` field on every step — so running it would have overwritten
`action_steps` with versions that had no timers, no counters and no written
answers. If a second generator ever appears, delete it rather than syncing it.

**Why:** the two sources drifted once already. Every local quest was missing
`suggestedGroup`, which silently cut the Journey hub from nine suggested quests to
two. It stayed invisible in normal use because Supabase *did* have the values —
only the offline path degraded.

*Origin: found and fixed 2026-09-05; the second generator removed 2026-09-06.*

---


## 4. Adventure means risk, not novelty

An Adventure quest has to have something at stake — height, cold, speed,
commitment, the dark, being somewhere you cannot easily get back from. Mild
novelty does not qualify, however unfamiliar it is.

**Not Adventure** (this was half the category until 2026-09-05):

- "Take a bus one stop past your usual"
- "Get off two stops early and walk the rest"
- "Visit a shop you have never entered"
- "Take the first turn you have never taken"

Standa's verdict on the last one: walking down a street you have not walked
down is *super nuda*. He is right — those are four variations on noticing your
own neighbourhood, and noticing belongs in Nature or Relax.

**Adventure:**

| Weak (novelty) | Strong (stake) |
|---|---|
| "Ride one stop farther" | "Take the next train out, wherever it is going" |
| "Try a new cuisine" | "Jump off something with a rope on your legs" |
| "Sleep away from home" | "Sleep outside with nothing over your face" |
| "Walk a new street" | "Walk up in the dark and be at the top for sunrise" |

**Safety goes in the steps, not in a warning banner.** Book with a licensed
operator; tell one person your route and your time back; check whether sleeping
there is even allowed; the mat matters more than the bag. A quest that asks
something real of someone should also tell them how not to get hurt doing it —
inline, as part of the doing.

*Origin: product-owner decision, 2026-09-05.*

---

## 5. Difficulty is resistance, not duration

`difficulty` and `estimatedDurationMinutes` are independent, and mixing them up is the easiest
mistake to make when writing a batch. Difficulty asks **how much a person has to overcome to start**.
Duration asks how long it takes once they have.

The catalogue already behaves this way, consistently — this rule was read off it rather than imposed:

| Quest | Time | Difficulty | Why |
|---|---|---|---|
| "Do a full day with no work or chores" | 16 h | medium | Long, but nothing about it is frightening |
| "Reconnect with someone you lost touch with for a year+" | 1 h | **hard** | An hour, and most people put it off for years |
| "Have a 15-minute voice or video call" | 20 min | medium | Short, and still a call someone is avoiding |
| "Sit on a bench for 10 minutes" | 10 min | easy | Nothing to overcome at all |

A sixty-minute quest is hard and a sixteen-hour one is medium. That is not an inconsistency to fix.

**Roughly:**

- **easy** — you could do it today without deciding to. No booking, no other person, no nerve.
- **medium** — needs a decision, a plan, or someone else's agreement.
- **hard** — needs nerve, money, or a day of your life. Fear, cost, or commitment.

**Why:** the onboarding intensity answer (light / balanced / bold) filters on `difficulty`, so a
quest tagged by its clock instead of its resistance lands in front of the wrong person — a gentle
user offered a bungee jump because it only takes an afternoon.

*Origin: read off the catalogue and written down, 2026-09-06.*

---

## 6. The house voice: name the thing, not the feeling

Quests describe **what you will be doing**. They never describe how it will make you feel, and they
never explain why it is good for you.

**The pattern the catalogue already follows:**

| Field | Job | Real example |
|---|---|---|
| `title` | An instruction you could act on today | "Sleep outside with nothing over your face" |
| `shortDescription` | The scene, or the constraint — never the benefit | "A sleeping bag, a mat, and the sky. No tent." |
| `fullDescription` | What to actually do, plus what would ruin it | "Check what is allowed where you are…" |

**Not the house voice:**

| Instead of | Write |
|---|---|
| "Reconnect with nature and feel refreshed" | "Moving water, trees around it, no car park" |
| "A great way to boost your mood!" | "Head torch, cold hands, and the light arriving while you stand there" |
| "Challenge yourself to step outside your comfort zone" | "Sign up for something you are not ready for" |

**Why:** promising the feeling does the experience's job for it, badly — and if it does not land that
way, the app was wrong about something personal. Naming the thing is a promise the quest can keep.
It is also the difference between this and every wellness app, which is worth protecting.

Specifics, in order of what makes a line work: a physical object beats a category ("head torch"
beats "the right gear"), a constraint beats an encouragement ("no car park" beats "somewhere wild"),
and the second person beats the abstract ("you are not ready for" beats "beyond your current
ability"). No exclamation marks. Dry understatement is welcome; jokes are not.

*Origin: derived from the existing catalogue, 2026-09-06.*

---
## More rules

_(Add as they are decided — e.g. quest length/time framing, difficulty calibration,
concreteness, category fit. Keep each rule short, with a why and a before/after.)_
