# Round 2 — Closed Test Feedback: Tasklist & Roadmap

Triage of the Google Play **closed test** feedback collected up to 2026-09-21.
Verbatim source: [`round-2-raw-notes.md`](round-2-raw-notes.md) — never edited, always the way back
to what was actually said.

**Goal of this round:** pick the subset that ships in an updated test build now. Everything else is
recorded here so nothing is lost — parked or rejected, but written down either way.

**Status legend:** `NOW` = in this build · `LATER` = backlog, not this build · `DECIDE` = blocked on
a call from Standa · `REJECT?` = proposed rejection with reasoning, Standa decides.

**Effort** is a t-shirt size based on the files actually involved (named per item), not a clock
estimate.

---

## Proposed selection for this build

| ID | Item | Type | Effort | Status |
|----|------|------|--------|--------|
| R2-01 | Stale error banner follows you between screens | bug | S | **NOW** |
| R2-02 | Calendar step can't pick a day — always "now + 15 min" | bug | M | **NOW** |
| R2-03 | Photo step is mandatory, blocks finishing | bug / philosophy | S | **NOW** |
| R2-04 | "Network request failed" when saving a memory | bug | ? — diagnose first | **NOW** |
| R2-05 | Liked quest vanishes instead of moving up | bug | S–M | **NOW** (repro first) |
| R2-06 | Timer can't be skipped | UX | S | **NOW** |
| R2-07 | Loading screen uses the old logo | asset | XS | **NOW** |
| R2-08 | Newly unlocked quest gets no NEW badge | UX | S | **NOW** |
| R2-09 | Memories filter chips are oversized | UI | S | **NOW** |
| R2-11 | A self-made memory can't be given a category | UX | M | **NOW** |
| R2-10 | Quest steps carry too much text — cut one layer | copy / UI | M + live SQL | **NOW** |
| R2-22 | Prep the Play closed-test feedback forms | process | M | **NOW** (parallel) |

**✅ Scope approved 2026-09-21: the bugs and small UX/UI** — R2-01…R2-09, R2-11, R2-23, R2-24.
R2-10 (text trim) and R2-22 (Play forms) are not in this pass.

### Implementation plan (agreed 2026-09-21)

Diagnosis went deeper than the triage above; where it changed the picture, it's noted.

| ID | What was actually wrong | Fix | Decided by |
|---|---|---|---|
| R2-01 | `assignQuestToUser` writes "path full" into **global** store state although all 5 callers already handle it locally (modal / alert / inline text). Tester's path: 4th quest in Explore → modal → picked an in-progress one → stale banner on it. | Stop writing that outcome to global state; clear store errors on screen mount. | obvious |
| R2-04 | **Same bug class as R2-01**, in the memory store. Timeline 08:11→08:12: quest completion auto-saves a memory, photo upload fails, "Add a memory" opens with the stale banner (body was empty — nothing had been sent from that screen). Upload uses `fetch(uri).blob()` + Blob upload, known-unreliable on React Native. | Clear stale error; upload via ArrayBuffer; if the photo fails, save the memory **without** it and say so. Upload cause is a strong hypothesis until seen on an Android device. | obvious |
| R2-03 | `disabled={!photoUri}`. | CTA carries the why: "Take a photo for the memory" + quiet "Finish without a photo". | obvious (Standa's direction) |
| R2-06 | Timer is gated both before start *and* while running. | "Skip the timer" in both states → `self_attest`, no schema change. | obvious |
| R2-07 | Icon moved to all-amber on 2026-09-05; the splash kept the older green-stones variant. | Splash = current mark (green ground, amber cairn); the JS loading gate matches it so the handoff doesn't flash. Native — visible only in a new build. | obvious |
| R2-08 | Badge = "new in catalogue". | Also badge quests newly *offered to you* (device-local, first run seeds silently). Returning rejected quests never badge. | obvious |
| R2-11 | `memory_entries` has no category. | Optional category picker for standalone memories (create + edit). **Needs one SQL migration Standa runs.** | obvious |
| R2-24 | **Backend already exists** — `dismissSuggestedQuest`, status `dismissed` — never called; returns after a flat 30 days. | Wire it; return rule per category: rejected quests come back when nothing else in the category is left to offer. "Not for me" lives on the quest detail screen only (cards stay two-button). | obvious; placement vetoable |
| R2-05 | Liked quest leaves the list, a different quest takes its slot, and it lands on **another tab** (Progress) with no message. | ✅ **Stays in its category, pinned to the top with a filled heart**; does not take one of the five slots. Progress keeps the cross-category Liked overview. | Standa |
| R2-09 | **The "huge chips" are a layout bug**: horizontal `ScrollView` defaults to `flexGrow: 1`, so both chip rows share screen height with the list and stretch into tall ovals. The mentor reacted to the bug. | Fix the stretch; ✅ **one row of category chips + a single "All time ▾" chip for the date range.** | Standa |
| R2-02 | Always "now + 15 min". | ✅ **Open the phone's own calendar editor**, prefilled; user picks day and time there and gets their usual reminder. Android can't report whether it was saved → on return, "Saved it?" confirms the step. | Standa |
| R2-23 | `timeframe` does three jobs (duration in onboarding copy, planning horizon in the anchor text and calendar-step rule, repeat interval in the completion horizon). **The catalogue's outliers only make sense as "how much planning it takes"** — a 1-hour *yearly* reconnect, a 5-hour *weekly* spontaneous train ride. | ✅ **Meaning = how much planning it takes.** Labels **Anytime · Plan ahead · Big occasion**, centralised in one place. Onboarding's pace question describes it in minutes and now disagrees — logged, not fixed in this pass. | Standa |

---

### Second pass (2026-09-23) — after versionCode 10 shipped

Picked for work Standa does not have to touch: no SQL, no Play upload.

- **R2-23b** — the onboarding pace question is **gone**, Standa's option C. Ranking now reads
  behaviour: `preferredTimeframeFromHistory` leans toward the level someone actually *completes*
  (starting is a wish, finishing is evidence; a tie leans nowhere). Same reasoning he applied to
  price — "logika ukazování, ne onboarding". The stored `pace` field and its column stay untouched,
  so no migration. Onboarding is 6 steps instead of 7.
- **R2-33 (new)** — English pass over the UI copy. The real problem was not grammar but that one
  thing had four names ("active path", "in motion", "active list", "active quests"), plus internal
  jargon ("the runner") and idioms a non-native reader can't take literally ("a pocket of time",
  "it will land here"). 19 strings changed; quest text itself is in Supabase and was left alone.
- **R2-30 (new)** — `expo-updates` wired up, `runtimeVersion` on the **fingerprint** policy so an
  update built after a native change is never delivered to an older build. Live from the next build
  on. See [`../ota-updates.md`](../ota-updates.md).
- **R2-32 (new)** — the offer-logic tests now live in `tests/unit`, `npm run test:unit`, 18 passing.
- **R2-31 dropped** — an accessibility sweep, proposed by me and backed by no feedback. Standa's
  call: feedback first.

### Third pass (2026-09-26) — the SQL items

Standa: "pojďme nejprve poctivě na ty SQL" — do the SQL-requiring items thoroughly. Regenerated
[`../../supabase/quests_catalogue.sql`](../../supabase/quests_catalogue.sql) once, at the end, so it
carries every content change below in one run rather than one migration per item.

**✅ R2-25 done — re-verified against the current catalogue, not just the 2026-09-21 spot check.**
Re-ran the legality scan across all 41 quests (regex over title/shortDescription/fullDescription for
wild/naked/tent/fire/drone/swim/climb/dark/camp-adjacent words, then read each hit's full text).
12 quests matched the keyword scan; the 9 beyond the original two were all clean on inspection
(licensed climbing gym, a public hill/ridge/tower, booked accommodation, a marked trail) — no new
legality exposure found.
- "Sleep outside with nothing over your face" → **"Sleep outside where it's allowed, nothing over
  your face."** `shortDescription`/`fullDescription` already did the right thing and were untouched.
  Step 1 of the journey was already titled "Find a spot you are allowed to sleep on" — no change
  needed there.
- "Swim in a river you had to walk to reach" → title kept (CZ wild swimming is broadly fine);
  `fullDescription` gained *"Some stretches restrict swimming — a protected area, a drinking-water
  intake — so check locally before you go."*
- `quest-content-guidelines.md` §6's flagged worked example is resolved — it now shows the corrected
  title and the warning is gone.

**✅ Found in passing, fixed — a rule-10 violation the guidelines doc itself named but the catalogue
never got.** Rule 10 ("The words have to match what actually happens") uses *"Drive something too
fast for the road"* as its own worked example of a title overselling reality — a kart is slower than
road traffic. That is q-w-15's actual live title, unfixed since the rule was written 2026-09-21.
Retitled to **"Drive something at full speed on a closed track"** — `fullDescription` already said
*"Somewhere safe to go flat out is the whole point,"* only the title was wrong.

**✅ R2-26 audited — no rewrite needed.** Read all 41 titles against rule 7 (open goal, not a fixed
target). Every title is already either fully open ("something," "one X," "somewhere") or names an
activity that isn't meaningfully substitutable (sleeping under the sky isn't a stand-in for some
other activity, the way a specific pie is a stand-in for "bake something"). Two of the catalogue's
own strongest examples of the rule 7 pattern — "Sign up for something you are not ready for" and
"Make something with your hands and give it away" — were already there. **Conclusion: this is not a
rewrite pass; the catalogue earned this rule already, mostly before the rule was written down.**

**✅ R2-10 done — the layer that was actually cutting into something real turned out not to be a
content field at all.** The tasklist's original framing (pick one of title/detail/tip/prompt, delete
it everywhere) would have meant losing real content: 89 of 157 steps (57%, measured) carry a genuine,
specific, authored tip — safety and practical advice like *"Do not pin it to one fixed date — the
good flights are the ones that waited for the right morning."* Deleting those to fix a density
complaint would have been the wrong trade.

The actual finding: **the other 68 steps (43%) had no real tip, and the app was filling that gap with
a generic one-line filler** (`DEFAULT_JOURNEY_STEP_TIP`, injected by `mergeCatalogStepTips` in
`src/constants/questJourneys.ts`) — so a whole "Guide" row (label, chevron, tap target) rendered on
every one of those 68 steps for a sentence that said nothing about that specific step. That is the
layer this cuts: **the Guide row no longer renders at all when a step has no real tip**, rather than
rendering one with nothing behind it
(`app/quest/run/[id].tsx`). The 89 real tips are completely untouched — this is not a content-loss
trade, it is not showing a block that had nothing to show. `DEFAULT_JOURNEY_STEP_TIP` itself is
deleted; nothing imports it any more.

⚠️ **Caught during verification, worth remembering:** the fallback text was already baked into the
live Supabase `action_steps` JSON from an earlier catalogue export, so the fix was invisible in the
browser until the catalogue SQL was regenerated — the same two-places trap rule 3 exists to name.
Confirmed in the regenerated file: zero occurrences of the filler sentence anywhere, and the
previously-affected step ("Go up," `q-y-06`) now has no `tip` key at all.

**✅ R2-10, second half — found by re-reviewing with Standa (2026-09-26), who doubted the first fix had reached the real problem. It had not.** Two more sources of repeated text, both measured:
- **The quest detail screen said the same thing twice.** `shortDescription` sits right above the journey, and `journeyIntro` right under its heading. In **16 of 41 quests (39%)** they overlap, in three they are word for word identical (q-y-07, q-m-12, q-m-10). Fixed in the app rather than by rewriting 16 quests: the detail screen no longer shows `journeyIntro`; the runner start screen keeps it, since that screen has no shortDescription. No SQL, no per-quest judgement, no content lost.
- **The confirm step repeated one reassurance three times** — a static sentence ("No proof needed here — just your word…"), the button, and the dialog on tap — on **58 of 157 steps (37%)**, the most common step type. The static sentence is gone (Standa: it spoils the feel, people understand). Button and dialog stay.

**✅ The three remaining sentences on the detail screen are gone too** (Standa asked whether any is needed or whether design can replace them: none is needed). "Steps update from the guided runner…" and "Add this quest, then use the runner…" said what the ticks and the Begin button already say, in a word ("runner") nobody knows. The photo sentence ("worth having your camera ready") duplicated the photo step in the list, and photos are optional since R2-03. **Design replaces them:** each row in the step list now carries the icon for its kind of step — camera, clock, pencil, calendar — shared with the runner via `components/quest-run/stepKindIcon.ts`, so the shape of a quest reads without a sentence.

**✅ R2-27 done (2026-09-26), and smaller than first reported.** Five quests looked place-bound; on a closer read three already carried an alternative (q-m-08 "river, canal or stream", q-m-01 "trail or signed path", q-y-02 open with examples). **Two** were real: the climbing gym and the train. Two layers, because content can never cover everyone:
,
- **Content** — q-w-07 is now "train or bus" (title, description, steps, and "last train home" became "last way home"); q-w-04 names "a climbing gym, a boulder wall or a rope park". Needs the regenerated `quests_catalogue.sql` run.
- **Behaviour** — "Not for me" now opens a two-way choice: **"Not my thing — maybe later"** (returns once the category is otherwise done, Standa's rule) and **"Can't do this where I live — hide it"** (never returns). A quest nobody in a place can do is dead content, not a preference, and must not resurface as the category runs dry. Stored on the device like `seenQuests` — no SQL, OTA-able — and fires `quest_unavailable_here`, so the analytics show which quests fail where. Left out of the category entirely, so it can't hold up the return of turned-down quests either (tested). Rejected: asking where someone lives in onboarding — it contradicts "behaviour over questions".

**✅ Text and tone sweep of the remaining screens.** Two things that contradicted the app's own rule against levels and reward loops (AGENTS.md): the Progress "milestone" ladder that grew warmer with the collection ("Keep going!", "You are on a real roll.", "Legendary. The map remembers you.") is now a plain count ("3 quests finished."), and the rotating encouragement above every step ("Strong. The finish is in sight.") is gone. **Not touched, needs Standa:** the whole Progress showcase is trophy-themed — trophy icon, "Trophy shelf", numbered medals (#3, #2, #1) — which is the same idea in the visuals. A design call, not a copy fix.

**⚠️ For Standa: one SQL file to run.**
[`supabase/quests_catalogue.sql`](../../supabase/quests_catalogue.sql), regenerated
2026-09-26 — safe to re-run, upserts by id. It carries the two title/description fixes above and the
regenerated `action_steps` (no more filler tips) for the whole catalogue in one file. Ends in a
sanity `select`; `missing_group` and `missing_steps` should both read 0.

**✅ Quest detail screen: describe and sell, do not instruct (Standa, 2026-09-26, from a screenshot).** Before you start, the page carried three layers per step (an empty tick-box that looks tappable and is not, an icon, and a description), the reflection question (a spoiler, and asked at the end anyway), and the quest title twice — truncated in the bar and again as the heading. Now, before starting: numbered step titles with the kind-of-step icon, nothing else; the reflection only once you are doing or have done the quest; the bar title empty. Ticks and step descriptions still appear when the quest is active, where they are useful. Reversible in three small edits if it turns out too bare.

**✅ New content rule 12 — the examples must match the words that promise them (Standa, 2026-09-26, from a screenshot).** "Sign up for something you are not ready for" said *a race, a climb, a stage* and then listed a half marathon, a long ride, an open mic and a competition — climb had no example at all. Now: race → half marathon, triathlon, bike race; climb → climbing course, bouldering course, pole dancing course; stage → open mic, stand-up comedy. Audited the catalogue; two more fixed ("a jump" → "a tandem skydive" in q-y-06; q-w-19's places and materials now in one sentence). Also: the detail screen no longer shows the word "medium" — difficulty is what the app ranks by, not something a reader can act on, and the cards never showed it. Needs the regenerated `quests_catalogue.sql`.

**✅ Full rule audit of the catalogue, 9 quests changed (Standa, 2026-09-26: "Jump off something with a rope on your legs je hrozně specifický … ta pravidla by měla být všude").** The earlier audit ("all 41 titles already open") was wrong: it accepted the very title rule 7 cited as its good example. A rope on your legs is bungee. All 41 were read again against every rule at once. Changed: bungee → "Jump off something high" (bungee, tandem skydive, zip line in the description); river walk → "Follow moving water on foot"; river swim → "Swim in wild water you had to walk to reach"; "…with nothing booked" → "…deciding as you go" (it books the first night); breathing → "Book a guided breathing session"; oldest tree → "…near you" (street or park); sleeping outside → "Sleep under the open sky, where it's allowed"; "a year+" → "over a year ago"; climbing's "rented harness" → "rented gear". Their journey steps were updated to match. The guidelines that cited the old titles as models were corrected, with the mistake written into rule 7 and a one-line test: *could someone who cannot do that specific thing still do the quest?*

**✅ Category promise on the quest screen.** The small label above the title now reads "ADVENTURE · new experiences, new hobbies" (Nature: quiet time outside; Relax: time to rest; Social: new people, closer friends) — one line, no new block. Things you get, not feelings promised (rule 6), and no "adrenaline" or "love" (rule 10: most Adventure quests are a course or a sign-up, most Social ones are calls and dinners).

**✅ R2-12 done, with a caveat (2026-09-26).** The mentor's note about "A couple of honest ones" ended mid-sentence, so the objection itself is still unknown. The step was reworded against the plain-English standards instead: "A couple of honest ones." (an idiom that does not say what it is) → **"Two quick questions."**; "just a baseline" (jargon) → "Just for you to look back on — they don't change which quests you see. We'll ask again in a few months." (true: the app re-asks after ~3 months); "…have you recently felt lonely or isolated?" → "…felt lonely or isolated lately?". The follow-up with the mentor was dropped (Standa, 2026-09-26): the reworded step stands.

### R2-34 · An optional stretch on a quest — parked until the test ends
**Source:** Standa, 2026-09-26 — "extra level jako tip: normální quest je swim in river, extra tip: skinny dip in the river if possible". His own call: better to wait until the end of the test.

**Where it would live:** in the existing `tip` (the collapsed Guide row), not in the title and not in a new field or screen. That costs no new UI and no new text on the screens just cleaned up in R2-10.

**Guard rails, so it stays consistent with the rest of the rules when it is picked up:**
- **Not a level.** AGENTS.md rules out levels, points and reward loops. It is written advice: not tracked, not counted, nothing unlocks. The word "level" should not appear in the app.
- **Rule 9 applies in full.** Nudity, fire, drones and the like are legal in one place and fined in the next. The extra is worded conditionally ("if it is allowed where you are and you want to"), and never as the point of the quest — the quest must be complete without it.
- **Rule 1.** It asks for something *to do*, never something to avoid.
- **Rule 4 fits.** Adventure means real stake; an optional stretch is a natural home for it.

**Why wait:** it is catalogue content, so it needs the generated SQL, and it should be written in one pass with the wording rules in front of us rather than mid-test. It also does not answer any tester feedback.

---

### Implementation status (2026-09-21)

All twelve are implemented, not yet committed. Typecheck clean. The offer logic (R2-05/08/24) has
14 scenario tests, all passing (`node --test`, kept outside the repo — the project has no unit
runner). Verified in the web build with a throwaway anonymous account:

| ID | Verified how | Result |
|---|---|---|
| R2-01 | 3 quests active → 4th → "path full" modal → opened an active quest | ✅ no banner (Progress, which renders the same store error, clean too) |
| R2-03 | "Leave the ground" step 5, the tester's exact screen | ✅ "Add a photo for the memory" + "Finish without a photo" advances |
| R2-05 | Like on Journey, then unlike | ✅ stays pinned with **Liked**; five still open; unlike returns it |
| R2-06 | "Eat one meal outside" step 4, skipped *while running* | ✅ advances; copy now says "about", not "at least" |
| R2-09 | Memories tab | ✅ one row of small chips + "All time ▾" sheet works |
| R2-11 | New free-standing memory with Nature, **before** the migration | ✅ saves (column-missing fallback); category stored once SQL is run |
| R2-23 | Journey cards, quest detail, onboarding | ✅ Anytime / Plan ahead / Big occasion; duplicate label on detail removed |
| R2-24 | "Not for me" on the kart quest | ✅ dialog names the category; quest gone, next one opened |
| R2-08 | Unit tests only | ⚠️ the live catalogue's 5 Sept quests are all still "new in catalogue", so on screen every card is badged anyway |
| R2-02, R2-04, R2-07 | — | ⚠️ **native-only**: calendar editor, photo upload, splash. Need the Android build |

**Caught during verification and fixed:** the category-column fallback had a race — the Memories
tab loads twice at start-up, and the second request skipped its retry and showed "Failed to load
memories". Fixed in `memoriesRepository.ts`, re-verified three reloads in a row.

**After Standa ran the SQL (2026-09-21), re-verified live:** category saves on edit (`cat-nature` in
the DB, shown on the memory); account deletion succeeds and lands on sign-in. **One more bug found
and fixed in that pass:** opening a memory directly (link or web reload) said "Memory not found" —
the detail screen never loaded memories itself. Now bootstraps like quest detail and the runner do.
*Note:* an app session that was open before the migration keeps dropping the category until restarted
(the "column missing" answer is cached per session by design).

**SQL Standa has to run** (both idempotent) — ✅ done 2026-09-21:
1. `supabase/fix_account_deletion.sql` — **urgent**, see R2-29.
2. `supabase/memory_category.sql` — R2-11. The app works without it; the category just isn't saved.

### R2-29 · Account deletion is broken for every user — found during verification
**Not tester feedback — found 2026-09-21 trying to delete the throwaway test account.**
`delete_own_account()` did `delete from storage.objects`, which Supabase now rejects for the whole
statement: *"Direct deletion from storage tables is not allowed. Use the Storage API instead."*
(42501) — even for an account with no photos. Every deletion in production fails with "Could not
delete your account". Google Play requires working in-app deletion, and the public page
`app/legal/delete-account.tsx` promises it.

Fixed: the app removes the user's photos via the Storage API first
(`src/repositories/accountRepository.ts`, using the existing `quest_memory_photos_delete_own`
policy), and the function no longer touches `storage.objects`. **Also found:**
`production_prep.sql` §11 had drifted from `schema.sql` and lacked the analytics anonymization from
`90aee6a` — re-running it would have silently undone that. Both copies now match, and
`fix_account_deletion.sql` carries the complete function so it is correct whichever version is
live. **The new build must not reach testers before this SQL has run.**

Leftover from verification: throwaway account `a3747ca8-de80-46a1-9f83-6ace71464087` (anonymous, no
email) could not be deleted because of this very bug. Its analytics events are still linked to it —
remove them *before* deleting the account, while they can still be told apart:
`delete from public.analytics_events where user_id = 'a3747ca8-de80-46a1-9f83-6ace71464087';`

---

## NOW — confirmed in code

### R2-01 · A stale error banner follows you onto unrelated screens
**Source:** numbered 8) "divnej error" + 17) *"Myslela jsem, že když je to in progress, tak se tomu
mohu věnovat a vlastně jsem v tom teď zamotaná"* (unattributed, a female tester) · evidence
screenshots 7 + 8.
**Type:** bug — and the highest-value finding of the round, because **one root cause explains both
reports**.

**Diagnosis (verified, not guessed).** `assignQuestToUser` writes the "path is full" message into a
**global** store field — [`src/features/quests/questStore.ts:278`](../../src/features/quests/questStore.ts#L278)
sets `error: QUEST_COPY.activePathFullBody`. Nothing clears that field on navigation or screen
mount; it is only reset when the *next* store action starts. Meanwhile every screen renders it
unconditionally at the top — e.g.
[`app/quest/run/[id].tsx:712`](../../app/quest/run/%5Bid%5D.tsx#L712).

So: the tester hit the 3-quest cap somewhere, then opened an **already-active** quest, and the old
message was still sitting in the store — rendered above a quest that was working fine. Screenshot 8
confirms the quest itself was healthy (0/4 steps, `Continue` offered). The runner even guards
correctly against re-assigning (`if (activeUq) return;`, line 347) — the quest was never actually
blocked. **She was told she was stuck when she was not.**

**Fix shape:** clear `error` when the runner mounts / the route changes, and stop rendering a
path-full message on a screen where it can't apply. Bigger question worth deciding once: a
"cannot start a *new* quest" message probably shouldn't live in global state at all — it belongs to
the action that triggered it.

**Note the philosophy angle:** the app is supposed to never restrict. A phantom blocker is the worst
possible version of that. Worth fixing on principle, not just severity.

---

### R2-02 · The calendar step cannot pick a day
**Source:** numbered 13) *"Google kalendář nefunguje properly / Rovnou to uloží aktivitu na tu dobu
z člověk si nemůže vybrat den"*.
**Type:** bug.

**Diagnosis (verified).**
[`src/features/quests/questCalendar.ts:53-58`](../../src/features/quests/questCalendar.ts#L53) —
`createQuestCalendarEvent` computes `startDate = now + startOffsetMinutes (default 15)`. There is no
date/time picker anywhere in the flow. The event is always ~15 minutes from the tap.

This is exactly the complaint, and it compounds R2-06/R2-13: a monthly quest planned "for next
month" gets an event 15 minutes from now, and then immediately asks you to start a 45-minute timer.

**Fix shape:** a native date/time picker before `createEventAsync`, defaulting to something sensible
per timeframe (weekly → a few days out, monthly → next week, etc.). `@react-native-community/
datetimepicker` or Expo's equivalent; check what's already in `package.json` before adding a dep.

---

### R2-03 · The photo step is mandatory and blocks the quest
**Source:** numbered 9) *"dát fotku by měl být nejspíš dobrovolný krok jen s lehkým hintem proč je
lepší tam tu fotku dát ideálně v CTA"* · evidence screenshot 3.
**Type:** bug **and** a direct philosophy violation.

**Diagnosis (verified).**
[`components/quest-run/PhotoStepAction.tsx:94`](../../components/quest-run/PhotoStepAction.tsx#L94)
— `disabled={!photoUri}`. The "Finish this step" button is hard-gated on a photo. Screenshot 3 shows
it greyed out.

The app's own rule is that the mentor pushes you to *do*, never restricts. A step that refuses to
complete because you didn't photograph something is a restriction, and it can strand someone
mid-quest with no way forward (no phone storage, bad light, just didn't want to).

**Fix shape:** enable completion without a photo; keep the photo as the promoted path. The
suggestion is right that the *why* belongs in the CTA — "it becomes part of the memory" is already
written there as body text, so it mostly needs to move into the button's own framing rather than be
newly invented.

---

### R2-04 · "Network request failed" when saving a memory
**Source:** evidence screenshot 2 (New memory, title "Leave the ground", red banner).
**Type:** bug — **not yet diagnosed.** Flagging honestly: I have not reproduced this and I am not
going to claim a cause from a screenshot.

**What to check first:** whether this is plain connectivity (the tester was out on a quest — which
is precisely the offline argument in R2-18), a Supabase session that expired mid-session, or a
photo-upload timeout. Note the form kept its content and `Save memory` stayed enabled, so the
immediate user harm is limited — but a memory lost at the moment it was worth writing down is the
worst thing this app can do to someone.

**Minimum for this build even if the root cause is boring:** retry that doesn't lose the text.

---

### R2-05 · A liked quest disappears instead of moving up
**Source:** numbered 15) *"Likenutej příspěvek nejde nahoru ale zmizí"*.
**Type:** bug — **repro needed before fixing.**

**What I know:** liking writes `saved_for_later`
([`components/quests/useQuestActions.ts`](../../components/quests/useQuestActions.ts)), and the
Journey tab renders those in
[`components/journey/PausedAndLikedSections.tsx`](../../components/journey/PausedAndLikedSections.tsx)
— a *different section from where you liked it*. So "it vanished" is very likely literal and
correct behaviour that reads as data loss: it left the list you were looking at and reappeared
somewhere you weren't.

Round 1 already hit a neighbouring version of this (bugs #14/#15 in that round, per the file's own
comment). Worth checking whether the fix then was incomplete or whether this is the Explore/Journey
seam specifically.

---

### R2-06 · The timer cannot be skipped
**Source:** numbered 3), last sentence — *"Timer by se měl dát jít spíš i přeskočit."*
**Type:** UX. **Scoped deliberately narrow** — see R2-13 for the rest of item 3).

[`components/quest-run/TimerStepAction.tsx:105`](../../components/quest-run/TimerStepAction.tsx#L105)
offers only `Start the timer`. Add a way past it. Cheap, and it removes a dead end today without
waiting for the notification rework.

---

### R2-07 · Loading screen shows the old logo
**Source:** numbered 11) · evidence screenshot 5 ("Preparing your space...", stacked stones).
**Type:** asset swap. Trivial — [`app/index.tsx:88`](../../app/index.tsx#L88) /
`components/ui/LoadingState.tsx`, plus whichever asset in `assets/images/` is current.
**Needs from Standa:** which logo is the current one.

---

### R2-08 · A newly unlocked quest gets no NEW badge
**Source:** numbered 2) *"splnil jsem quest takže se nový quest přidal ale není u něj tag new"*.
**Type:** UX — a semantics mismatch, not a broken badge.

**Diagnosis (verified).** The badge means **"new in the catalogue"**:
[`src/features/quests/suggestedQuests.ts:261`](../../src/features/quests/suggestedQuests.ts#L261)
`isRecentlyAdded` = `createdAt` within 30 days, combined with "not yet opened"
([`seenQuests.ts`](../../src/features/quests/seenQuests.ts), your 2026-09-06 call).

A quest that surfaced because finishing one freed a slot is old catalogue content, so it correctly
gets no badge — but to the person it is unmistakably *new to them*. That's the gap: the badge tracks
the catalogue, the user tracks their own screen.

**Fix shape:** badge "newly opened to you" as well as "newly added". Cheap, and it makes the
five-at-a-time gating legible — right now a quest appears silently and the reward for finishing one
is invisible.

---

### R2-09 · Memories filter chips are oversized
**Source:** numbered 7) *"tlačítka jako all time all categories atd jsou hrozně velké špatný
design"* · Eva's screenshot shows the same row.
**Type:** UI. Straightforward restyle.

The second half of 7) — *"možná lepší rozdělit dle kategorií"* — overlaps R2-11 and is better
decided together with it.

---

### R2-11 · A self-made memory can't be given a category
**Source:** **Eva Burdová** — *"Tak když vytvořím vlastní vzpomínku, tak to nejde dát do žádné
kategorie, tak by to možná bylo taky fajn ne? 😊 / Mít jen tu možnost"*.
**Type:** UX gap. **The strongest-reasoned request of the round** — she worked out the model herself
first (*"ty kategorie jsou na základě toho z jaké sféry ten úkol je"*), then noticed the hole in it.

Quest-born memories inherit the quest's category; a memory you write yourself has nowhere to put
one, so it can't be found by the category filter that the Memories tab is built around. Note her
framing: **"just to have the option"** — an optional field, not a required one. That matches the
philosophy; do not make it mandatory.

---

### R2-22 · Prepare the Play closed-test feedback forms
**Source:** P.S. — *"po closed testu budeme muset pečlivě vyplnit feedback a formuláře pro google
store atd. takže reviduj si vše potřebné"*.
**Type:** process, runs in parallel with the code work.

Google asks how testing was conducted and what changed as a result. The material for that is
literally this file plus [`round-2-raw-notes.md`](round-2-raw-notes.md), so the useful move is to
keep the "what we changed because of feedback" column honest as we go, rather than reconstructing it
later. Cross-check against [`../closed-test-brief.md`](../closed-test-brief.md) and
[`../play-store-handoff.md`](../play-store-handoff.md), which already hold the requirement details.

---

## LATER — real, but not this build

### R2-13 · Step pacing: push notifications + calendar-driven resume
**Source:** numbered 3) (core) + 10) *"asi taky spíš komunikovat nějakou push notifikací ale nebráním
se jakýmkoliv návrhům"*.
**Type:** architecture. **Standa's own note already calls it:** *"tohle je velká úprava a bude si
žádat velkou změnu"*.

The real problem: quest steps assume one continuous sitting, but a monthly quest has a **genuine
gap** between "put it in the calendar" and "do the thing". Today the app asks you to start a
45-minute timer immediately after scheduling a trip for next month.

Fixing it properly means the quest can *sleep* and be woken by a notification or the calendar event
— which is notification infrastructure the app does not have. Round 1 recorded the same boundary:
`notification_intensity` exists as a stored preference with **no sending infrastructure behind it**.
So this is "build the notification system", not "tweak the runner".

**Do R2-06 now; do this deliberately, as its own piece of work.**

**Status 2026-09-26 — reframed, and it is a real task, not a parked one.** Standa: some steps should be
communicated by a notification that leads straight back into the app. That needs no server: local
scheduled notifications (`expo-notifications`) plus the existing `sidequestlife://` scheme deep-link to
the step. It does need a new native build. "Needs infrastructure" above overstated it. Open design
questions: which steps notify, what tapping does, quiet while a timer runs (R2-21).

**Status 2026-09-26 — BUILT, needs build 11 to test on a phone.** Decided with Standa: two kinds only.
- **Quest day** — at the time you put the quest in your calendar. iOS reads the saved event; Android
  never says which day you picked, so it uses the prefilled time (tomorrow / in a week / in a month,
  10:00). Your calendar reminds you too; Standa accepted that.
- **Timer done** — when a step timer ends while the phone is away.
- Tapping either opens `/quest/run/<questId>`, which lands on the step you are on.
- Account setting shown again, renamed by what arrives: *Timers only* / *Timers and quest days*.
- Cancelled when a quest is finished, paused, progress wiped, or you sign out.
- **Calendar bug found on the way (Standa):** on Android the calendar opened as a separate task, so
  saving left you in the calendar and the step never continued. It now opens inside the app, and a
  second tap on the step offers "Yes, it's in" instead of reopening the calendar.
- Permission is asked the first time something is scheduled, never at app start.

### R2-21 · Don't disturb while the timer runs
**Source:** **david b.** — *"Tohle bych zmáčknul v moment, kdy začnu vycházet na track alá zapnutí
Garmin hodinek a po danou dobu nechci bejt rušenej a chci vychutnávat přírodu"*.

Worth reading carefully, because it is **not a complaint** — his mental model (a Garmin start
button) is exactly what the timer is for. The design intent landed. What he adds is a constraint for
R2-13: whatever notification system gets built must **go quiet while a timer is running**. Notifying
someone mid-quest would break the very thing the quest was for.

File it against R2-13 so it isn't discovered the hard way after the notifications ship.

**Status 2026-09-26 — BUILT with R2-13.** Starting a timer moves any quest-day notification due before it
ends to a minute after; the timer's own "time is up" is not shown while the app is open.

### R2-15 · Draggable map bubbles + zoom
**Source:** **Don Marian** — *"Pro moje špatně soustředicí já / Když by se ty bublinky na mapě daly
posouvat / A hrát si s nimi / Me by to bavilo mnohem víc 🤣 / Nebo zoomovat mapu"* · numbered 14)
*"viz screen posouvání bublinek atd"*.
**Type:** interaction design. Two testers' worth of signal (Marian, plus whoever wrote 14).

**Status 2026-09-26 — dragging DONE, zoom still open.** Bubbles follow the finger (clamped to the map),
spring back to their landmark on release, and a plain tap still opens the panel. Verified in the browser
(175 px drag, edge clamp, tap). Not yet in a build. Implementation note: the marker claims the touch
via `onStartShouldSetPanResponderCapture` and decides tap-vs-drag on release, because react-native-web
never lets a parent take over from a child (the Pressable) that already holds the press.

**Zoom (15b) dropped 2026-09-26 (Standa).** In its place, a standing design note: the map has to be more
interesting so that people *want* to interact with it — dragging is a first step, not the answer.

Note *why* he wants it — fidget-friendliness, holding the attention of someone who doesn't
concentrate easily. That's a real audience argument, not decoration.

### R2-16 · Real city map background, places tied to the activity
**Source:** **Don Marian** — *"Kdyby na tom pozadí byla mapa města kde si / Nebo jakyho si zvolíš /
A třeba místa spojený s tou aktivitou"*. He hedges it himself: *"To už možná přeháním ale"*.
**Type:** big feature. Map tile licensing, location permission, and a privacy-policy change (the
current policy's data table would need revisiting). Park it, but it is the most ambitious idea in
the round and worth keeping visible.

### R2-17 · Category scenes: relax in a cabin, social around a fire, nature at a big tree
**Source:** numbered 12).1.
**Type:** art direction. **Already on the backlog** — this is `tasks.md` #8 ("Adjust Explore map art
to match quest vibe"), now with concrete imagery attached. Fold the specifics into that entry rather
than tracking it twice.

**Update 2026-09-26, later — map repainted by Standa** (`explore-map-background.jpg`, 896×1199, no watermark): it paints each scene outright — Adventure on the raft in the white water, Relax at the hammock, Nature at the big old tree, Social with the people round the campfire. Markers moved onto them; the notes below describe the previous art.

**Status 2026-09-26 — DONE with the existing art (Standa un-parked it).** Bubbles moved onto landmarks the
map already paints: Relax → the big log cabin (west), Nature → the big old tree (south), Social → the
ring of stones in the meadow (reads as a fire pit), Adventure stays at the trail clearing. No new art.
Left open: there is still no *drawn* campfire — if one is painted, move Social onto it. The Relax cabin
sits at the left edge of a phone, so it is partly cropped behind its bubble. Also fixed on the way: on
web the map background rendered at native size instead of cover-fit, so it disagreed with the marker
math (native was already right); `ExploreMapBackground` now sizes the image to its container.

### R2-18 · Offline mode / local storage
**Source:** numbered 12).2 — *"když člověk je třeba někde v lese ... aby si zaznamenal co chce"*.
**Type:** architecture, big.

Strong rationale: the app deliberately sends people **outdoors**, which is where signal fails. It
may also be the real cause of R2-04. Everything currently reads and writes through Supabase, so this
is an offline-first data layer, not a setting — but note that the *argument* for it is better than
usual, because the product's whole premise puts users out of coverage.

---

## DECIDE — I need a call from you

### R2-20 · "Serif + sans mixed — chyba!"
**Source:** numbered 6).

> ✅ **Resolved 2026-09-21 — Standa: the mixing is the problem, fix it this run. Inter only.**
> Measured first: 212 text styles in Inter, 25 in Fraunces — and not consistently the headings
> (onboarding headlines were already Inter Bold, tab and card titles Fraunces). All 25 now
> `Inter_700Bold`; Fraunces unloaded and uninstalled. The sweep found **more than the mentor saw**:
> the bottom tab labels and every screen header title rendered in the *system* font (Roboto on
> Android), and five button labels had no family at all — all now Inter. Verified at runtime on eight
> screens: no text outside Inter (icon fonts aside). Decision recorded in `BRANDING.md` §3.
> **Still Fraunces:** the Play feature graphic (`scripts/make-feature-graphic.cjs`) — a published
> store asset, left for Standa to decide.
>
> *The analysis below is kept as it was written before the decision.*
**Status:** **REJECT? — this contradicts a decision you already made and documented.**

[`BRANDING.md` §3](../../BRANDING.md) records **Fraunces (headings) + Inter (body)**, your call on
2026-08-29 after seeing three pairings set in real copy, with the rejected alternatives kept
explicitly *"so this is not re-litigated"*. A serif/sans pairing is the normal, intentional pattern —
not an error.

**But** there's a plausible reading that isn't wrong: the mentor may be reacting to *inconsistent
application* — serif turning up where body text should be, or the pairing looking accidental because
it's applied unevenly.

> ⚠️ **Correction, 2026-09-21.** An earlier version of this entry said the fonts "were not actually
> wired up", quoting `BRANDING.md` §3 ("not one `fontFamily` existed in 230 text styles"). **That is
> wrong** — the code uses `Fraunces_600SemiBold` and `Inter_*` throughout (e.g.
> `app/(tabs)/memories.tsx`). That line in `BRANDING.md` describes the state *before* the fonts
> landed and is itself stale. So the mentor saw the pairing as actually shipped, which makes the
> "ask what specifically looked wrong" step more important, not less.

**What I'd do:** ask what specifically looked wrong before changing anything. If it's the pairing,
defend the decision. If it's the application, that's a real (and different) task.
→ See [`feedback-mentor-ambiguity-handling`] — this is exactly the ambiguous-mentor-call pattern.

### R2-19 · Social layer — see friends' milestones
**Source:** numbered 12).3 — *"něco jak máš v appkách na běhání"*.
**Status:** **DECIDE — philosophy question, and a cost question.**

Two things to weigh against it:
1. **You decided against gamification** — decided, not shelved. Friends' milestone feeds are the
   comparison mechanic from running apps; that's close to the line, arguably over it.
2. **You already priced this.** Commit `1c4415f` "Record what adding sharing would actually cost"
   exists — read that before re-opening the question.

Not automatically a no: "get inspired by what a friend did" is a *doing* prompt, which fits the
philosophy, unlike a leaderboard. But it's a product-direction call, not a backlog item.

### R2-14 · "The design looks vibecoded"
**Source:** numbered 4) — *"deisgn vypadá jak z claude code a na vibecodenej ... aby nešlo poznat ze
je to vibecoded😃"*, with the suggestion to copy successful apps' design systems via a "claude
design" tool.
**Type:** the biggest item in the round, and the vaguest.
**✅ Decided 2026-09-21 (Standa):** treat 4) as a **direction, not a task** — satisfy it through the
specific items in this round (R2-09, R2-05, R2-10). No full redesign during the test round. If the
full pass happens, it runs as its own project after the round closes, with reference apps named so
it's a brief rather than a vibe.

**Why I'm not putting this in this build:** it is not a task, it's a verdict. A full redesign now
would (a) invalidate every other fix in flight, (b) burn the 12/14 testing clock, and (c) risk
undoing decisions that were made deliberately and documented (the palette derived from the map art
with measured contrast/ΔE; the typography pairing).

**What's actionable inside it, though, is real** — R2-09 (oversized chips) and R2-05 are exactly the
kind of small tells that add up to "vibecoded". My suggestion: treat 4) as a **direction**, satisfy
it through the specific items this round, and if you want the full pass, run it as its own project
after the test round closes — with reference apps named, so it's a brief and not a vibe.

**Related and cheap:** R2-10.

### R2-10 · Quest structure has too much text
**Source:** numbered 5).
**✅ Decided 2026-09-21 (Standa): cut one layer consistently, in this build.** Pick a single layer
and remove it everywhere — not quest-by-quest editing. **This moves R2-10 to `NOW`**, and it means
running the generated SQL against the live Supabase project mid-test-round (see catch 1 below), so
it wants care rather than speed.

Mechanically it's copy trimming, which is cheap per screen. Two catches:

1. **The quest catalogue lives in two places.** Editing the TypeScript source changes nothing for
   testers — the app serves Supabase. Any text trim needs the generated SQL run against the live
   project before it's visible. That's the difference between a 1-hour job and a 1-hour job plus a
   migration you have to not get wrong mid-test-round.
2. Screenshot 3 and 4 show the pattern: title + GUIDE + body + hint + button label, four layers of
   prose per step. Trimming that is design work, not just deletion.

**My read:** worth doing, high visible payoff against 4), but pick *one* layer to cut consistently
rather than editing quests one by one.

---

## From Standa's own quest-quality notes (2026-09-21)

The content rules from that note live in
[`../quest-content-guidelines.md`](../quest-content-guidelines.md) §7–§11, where the catalogue rules
belong. The three "Tips" are product changes, not content rules, so they are tracked here.

### R2-23 · Rename the weekly / monthly / yearly cadence
**Source:** Standa's note — *"change daily weekly monthly for intensity at je to more intuitive"*.
**Status:** **NOW — and note this is the second time it has come up.**

Round 1 raised the same relabel and it was parked: *"Cadence relabel (weekly/monthly/yearly) —
Standa's call: leave as-is for now."* A one-off suggestion is noise; the same suggestion twice, from
different directions, is a signal. **✅ Decided 2026-09-21: rename it — but not to the word
"intensity"**, which is already taken by the onboarding question and would collide. New labels to be
proposed.

What the labels have to carry: today's cards read "Yearly · ~72 h" and "Monthly · ~5 h", where the
cadence word is doing a job the duration already does better. Whatever replaces it should describe
**how big a bite this is**, not how often it recurs. Cross-check against
[`quest-content-guidelines.md` §5](../quest-content-guidelines.md) ("Difficulty is resistance, not
duration") so the new word doesn't re-introduce the confusion that rule exists to prevent.

### R2-24 · Let people turn a quest down
**Source:** Standa's note — *"quests shouldnt refresh automatically if they are not active - má mít
možnost si je sám smazat?"*, clarified 2026-09-21: **the missing piece is a way to reject a quest**,
not that the offer reshuffles.

A "not for me" control that hides the quest and lets the next one through. This makes the
five-at-a-time gating feel like a choice rather than an allocation, and it pairs directly with
[rule 8](../quest-content-guidelines.md) — a quest you can't do because of where you live is exactly
what you'd want to dismiss.

**✅ How rejection behaves, decided 2026-09-21 (Standa):** a rejected quest **comes back once you have
completed every quest you did not reject — including the ones still hidden in the database**, not
just the five currently open to you.

**Why this is the right shape:** rejection becomes a *deprioritisation*, never a deletion. The pool
cannot be emptied by turning things down, so the app can never dead-end someone who is picky — which
is the same "never restrict" rule that R2-03 and R2-01 are about. Nothing is lost, it just goes last.

**This will fire in practice, not just in theory** — measured 2026-09-21: the catalogue is
**41 quests, split 11 relax / 10 social / 10 nature / 10 adventure**, with five open per category at
a time. A category holds ten quests. Someone who rejects three and finishes the rest empties it. So
the comeback path is a normal state to design for, not a far-off safety valve:
- Does the returning quest announce itself ("here are the ones you passed on"), or just reappear? If
  it reappears silently after being dismissed, that is R2-05's problem again in a new place.
- Worth pairing with R2-08 — a returning quest is emphatically *not* NEW, and badging it that way
  would be a lie.

**✅ Counted per category, confirmed 2026-09-21 (Standa).** Nature running dry brings back the Nature
quests you rejected; it does not wait on Adventure. The empty category is where the person is
looking, so that is where the refill has to happen.

### R2-05 (corroborated) · Where does a like go?
Standa's note asks *"kam vede like? je to komunikovaný?"* — the same issue as numbered 15), arrived
at independently. **Two sources now agree**, which moves R2-05 from "one tester's report" to a
confirmed gap: the like works, but it silently relocates the quest to a Journey section the person
doesn't know exists. The fix is as much *telling them where it went* as it is the destination.

### Content work these rules imply
Not scheduled yet — flagging the cost so it is decided rather than discovered:

- **R2-25 · Rule 9 is a two-quest job, measured across all 41** — one clear ("Sleep outside with
  nothing over your face"), one borderline ("Swim in a river you had to walk to reach"). A third,
  "Spend a night somewhere with no street lights", already solves it by naming legal venues and is
  the pattern to copy. Small enough to fit this build if you want it.
- **R2-26 · Rule 7 (open titles)** — catalogue-wide rewrite pattern; see below.
- **R2-27 · Rule 8 (location alternatives)** — LATER.
- **R2-28 · Rule 11 (price as display logic)** — LATER; Standa: "tohle budu dělat nakonec".
- **Any such rewrite is quest content, so it lives in two places** — the TypeScript source and
  Supabase. Editing the TS alone changes nothing for testers.
- **Rule 7 (open titles) is the largest of them** — it is a rewrite pattern for the whole catalogue,
  not a one-off. Worth doing gradually, on quests as they are touched, rather than as a big bang
  mid-test-round.

---

## Not raised as problems — recorded so they aren't re-opened

- **Five quests per category** (Journey screenshot: "5 quests open to you here") — nobody complained.
  That's the game rule working as designed.
- **Adventure quest stakes** — the screenshot shows bungee, three days away with nothing booked, and
  sleeping outside. That's the intended level; no tester called it *nuda*.
- **The timer concept itself** — validated by david b. (R2-21).

---

## Before this build reaches testers

- **Check the build commit against `main`.** A build is a frozen snapshot; testers get whatever was
  compiled, not what's in the repo. Verify before upload, every time.
- **If anything in R2-10 or R2-08 touches quest content, run the generated SQL** against the live
  Supabase project — otherwise the change is invisible to every tester.
