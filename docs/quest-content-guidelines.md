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

**Why:** the two drifted once already. Every local quest was missing
`suggestedGroup`, which silently cut the Journey hub from nine suggested quests to
two. It stayed invisible in normal use because Supabase *did* have the values —
only the offline path degraded.

*Origin: found and fixed 2026-09-05.*

---

## More rules

_(Add as they are decided — e.g. quest length/time framing, difficulty calibration,
concreteness, category fit. Keep each rule short, with a why and a before/after.)_
