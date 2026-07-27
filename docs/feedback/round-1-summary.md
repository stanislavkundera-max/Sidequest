# Round 1 Feedback — Summary & Roadmap

Executive summary of the round-1 usability round (5 testers: Mára, Evka, Dejv, Terka, Martin).
For full tester-by-tester detail, exact quotes, and file references, see
[`round-1-synthesis.md`](round-1-synthesis.md) — this document is the readable, decision-focused
version of that working log.

---

## Part 1 — What we did, and why

### The headline fix: a broken database migration
The single most valuable finding this round wasn't a code bug — it was that the **live Supabase
project testers actually used was missing several database columns** that the repo's own
`production_prep.sql` script is supposed to add. This was diagnosed by testing directly against
the live project via the REST API, not just by reading code.

One root cause explained multiple, seemingly-unrelated reports at once:
- Every quest had **zero guided steps** in the database — so the entire step-by-step runner
  (timers, calendar steps, step navigation) had nothing to run on for any tester, no matter what
  quest they picked.
- Step completion could **never be saved** — even where steps existed, marking one done would
  silently vanish on refresh, because the column meant to store that progress didn't exist.
- Editing onboarding preferences **silently did nothing** — the save code has a safety fallback
  for exactly this situation (older database, missing columns), so it degraded to saving almost
  nothing without ever showing an error. It looked like a broken feature; it was a missing
  migration.

We ran the correct migration against the live project, backfilled the missing quest content, and
verified every piece end-to-end via direct API calls (not just "no error shown" — actually
confirmed the data round-trips correctly). We also found and fixed a gap in the migration script
itself, so this specific issue won't resurface on a future environment.

### Critical bugs — fixed
- **Sign-up looked broken.** Root cause: Supabase silently returns a "success" response for a
  signup against an already-registered, unconfirmed email (a deliberate anti-enumeration
  behavior) — no error, no new confirmation email. The app showed the same generic message either
  way, so a second signup attempt looked identical to one that quietly did nothing. Now detected
  and explained clearly.
- **Memory saved 10× on web.** The success confirmation was a multi-button native alert that
  **does not render at all on web** — the Save button re-enabled with zero visible feedback, so
  testers tapped it repeatedly, creating duplicates. Fixed by navigating straight to the saved
  memory instead of waiting on a dialog.
- **Timer/stopwatch got stuck.** No way to stop or reset once started. Added a confirm-gated
  reset control.

### High-priority bugs — fixed or resolved
- **Edit preferences "didn't work."** Confirmed as the database migration issue above — now
  verified persisting correctly.
- **Can't go back a step in the quest runner.** Added a "Back a step" control.
- **"Leave doesn't save progress."** It actually never lost anything — verified via a live
  API test that the underlying data write never touches step progress. The real bug: the card
  showing a left-behind quest gave zero indication that progress existed, so it *looked*
  identical to a fresh, unstarted quest. Fixed by showing "X/Y steps done" and switching the
  button from "Start now" to "Resume."
- **Left/closed quest hard to find, and looked different in Journey.** Same root cause as above —
  a half-finished quest and a never-started, hearted quest were dumped into the same "Liked"
  bucket. Split into two sections: a dedicated "Pick up where you left off" area for quests with
  real progress, above "Liked" for pure wishlist items. One consistent card design across both —
  only the action verb changes (Begin vs. Resume).
- **Feedback form had no visible way to submit.** Rating buttons instantly submitted with no
  confirmation; now selecting a rating reveals an explicit "Send feedback" button.
- **Tab bar didn't visibly highlight the active tab.** The active and inactive colors were
  nearly identical in perceived brightness — increased the contrast.
- **Memory photos got cropped** in preview and detail views — fixed the image display mode.
- **Quest not disappearing after completion** — investigated thoroughly (traced every
  status-based filter in the code, reproduced the exact backend sequence live) and found no bug:
  status correctly flips to "completed" and every screen correctly excludes it. Best guess: this
  was the same symptom as an old navigation bug (fixed earlier), where completing a quest used to
  route back to the quest's own detail screen instead of the main Journey view. Flagged as
  needing one live confirmation to close for good, since this is the limit of what can be proven
  without an actual click-through.
- **"Social/message" quest got stuck on the same screen.** Very likely a direct consequence of
  the missing-steps database issue above — that specific quest had no step content at all before
  the fix; it now has real 3-step content.

### Memory screens — all five reported issues fixed
- Photo expectation is now shown **before** starting a quest that usually ends with one, instead
  of surprising the user at the very end.
- A memory auto-created from a quest with no real written evidence now opens **straight into
  editing** instead of a read-only screen that required an extra tap to add anything personal.
- A clear green "Saved to your memories" confirmation, plus an obvious "Done" button, now appear
  right after saving — replacing a dead-end screen whose most prominent action used to be Delete.
- The reported character limit on writing a memory could not be found anywhere in the code —
  already resolved, likely in an earlier pass.

### Copy and UX polish
- **Onboarding reframed.** Two steps were unintentionally asking the same question — one picked
  categories, the other's wording just re-selected the same categories under different labels.
  Rebuilt around three genuinely independent questions: what you want more of (theme), how much
  time you have, and how bold you want your quests to be (reviving a data field that existed but
  was never actually used).
- **Quest duration humanized.** "720 minutes" became "12 h" everywhere a quest's length is shown
  — the most frequently repeated complaint across four different testers.
- **Wrap-up and calendar messages softened** — they read as error dialogs; now read as
  confirmations.
- A batch of smaller wording fixes: a distracting onboarding image, a confusing baseline
  question, unclear button labels, and more.

---

## Part 2 — Plan: what's left, and how

These items have a known fix and don't require a product decision — just time.

| Area | Item |
|---|---|
| Onboarding | Explain quest frequency limits with actual numbers, not just words |
| Onboarding | The "How it works" screen invites tapping even though nothing on it is interactive |
| Quest runner | The in-quest "Guide" tip block feels like noise — trim or de-emphasize it |
| Quest runner | Merge the "book/arrange" step and the calendar step into a single action |
| Progress tab | Quest detail view repeats too much of what the memory already says — trim it |
| Progress tab | Swap the tab's icon (currently disliked, no strong reason given) |
| Explore map | Replace question-mark icons with clearer, smaller category icons |
| Content | Rewrite the existing "Digital sunset" quest — it violates the round-1 "no abstention quests" rule we just adopted |
| Content | Rename the "World" category label (lives in the Supabase data, not the codebase) |
| Verification | Live-confirm the two bugs that look fixed by the database repair (quest disappearing on completion, the social/message quest) — both need one real click-through to close for certain |

---

## Part 3 — Strategic decisions needed

These require a product call before any code should change. Each is flagged because building
ahead of a decision here risks doing the work twice, or building the wrong thing well.

### Decisions that unblock stalled work

**1. Explore "Recommended" refill behavior.**
Today, the Explore screen shows exactly one recommended quest per category. The confirmed intent
is that picking it should make the next-best quest automatically take its place — but the single
strongest signal across *all four* testers was instead "let me choose from a small pool (~3)
myself." These are two different designs that solve the same complaint in different ways, and
building one now doesn't rule out needing the other later — worth deciding the actual shape once.

**2. What are "Likes" for?**
The heart button mechanically works (it saves a quest for later), but no tester — including
those who used it — could say what tapping it is supposed to mean, or confirm anything happened.
Polishing the mechanism without first deciding its purpose (a simple bookmark? a signal that
should shape future recommendations? something else entirely?) risks refining the wrong thing.

### Decisions that conflict with the product's own stated principles

**3. Community, co-op, or public profiles.**
Three testers independently asked for some version of this — one tester's entire mental model
walking in was a social, game-like app with other users' quests and a public profile. The
product's own guidelines currently rule out social feeds, multiplayer, and other-user profiles
entirely, as a deliberate choice to avoid the product becoming something else. Worth noting: the
same tester who wanted this also said, unprompted, that community "isn't the core of the app" —
so this may be a smaller, specific ask rather than a case for reversing the whole stance.

**4. Gamification — points, levels, bonus stars.**
One tester wants quests to carry levels, bonus points, and a star for completing an optional
"bonus" objective within a quest. The product guidelines explicitly avoid this as a core design
principle, to keep the experience calm rather than building an aggressive reward loop. This
should be a deliberate yes or no, not something that drifts in through smaller feature requests.

### Decisions where testers directly disagree

**5. Should the Explore map scroll?**
Two testers want to scroll up a path and see their completed steps laid out; one tester has no
desire to scroll at all and found the current fixed view sufficient.

**6. Notifications and pressure.**
One tester wants a nudge when a quest is being neglected. Another explicitly wants zero pressure
— "a quiet companion." This isn't just a UX preference disagreement: it touches what kind of
product this is meant to be, and the product's existing principles already lean toward the
"quiet companion" reading. Worth settling deliberately rather than by default, since it will
shape a lot of future copy and feature choices.

### A content and structure question

**7. Category structure — merge Nature and Adventure? Rework or drop Relax?**
One tester found Nature and Adventure hard to tell apart, and felt Relax — particularly its
"do-nothing" activities — competes with dedicated digital-wellbeing apps rather than fitting
this product's own identity. This connects directly to the abstention-quest decision already
made. Worth a look at the actual quest catalog before deciding — there are only 20 quests total
across all four categories, so some of this may be a content-depth problem rather than a
structural one.

### Lower-stakes ideas, parked until the above are settled
A reflection/"how did that feel" prompt at quest completion, filters in the memory timeline, a
more visual overview of progress, an in-app guide character, integration with the phone's focus
mode, a more interactive final onboarding step, letting any user (not just an admin account)
freely edit their preferences, and a three-month re-ask of the baseline onboarding questions.
None of these are blocked on anything technical — they're simply not yet prioritized against the
decisions above.

**Monetization signal (context, not a decision):** no tester would pay for the app directly, but
three said they'd try it if it were ad-supported or offered a free trial month.

---

*Recommendation: decisions #1 and #2 are the highest-leverage place to start — both are narrow in
scope, already have real usage signal to lean on, and are currently blocking otherwise-finished
UI work. The principle-conflicting decisions (#3, #4) and the product-identity question (#6)
deserve a slower, separate conversation, since they're harder to walk back once shipped.*
