# Redesign — screen inventory

Every screen and sub-screen the app has today (read from the code on 2026-10-19), with every
element and function on it, so the Ember redesign (task #26) drops nothing by accident.
Each screen has a line for what the redesign does with it. **NEW** marks something the app does
not have today; **planned #n** points to the open task it comes from.

Designs: [redesign canvas](https://claude.ai/artifact/2WmzdiXKbEWxHC9fdVzpvS). The per-screen
"→ Ember" lines below are the first pass; **the frozen design is Dawn** (next section) and wins
wherever they differ.

## ✓ Frozen 2026-10-22 — Dawn, screens 1–39

Standa froze the design on 2026-10-22: the six "Dawn ✓ FROZEN" pages of the canvas, screens
numbered **1–39** (canvas version 135). This is what gets built. The other pages (first draft,
A–D, the forest and Dawn-draft rows, the tab-bar options) stay on the canvas as history only.

| # | Screen | # | Screen |
|---|--------|---|--------|
| 1 | Loading | 21 | Quest — completed |
| 2 | Welcome | 22 | Not for you? sheet |
| 3 | Why this exists | 23 | Runner — your journey |
| 4 | What brings you here | 24 | Step — timer |
| 5 | How bold | 25 | Step — photo |
| 6 | Two quick questions | 26 | Step — find N things |
| 7 | How it works (animated) | 27 | Step — pick a day |
| 8 | A week from now | 28 | Every step is done |
| 9 | What the research says | 29 | Quest done — a new stone |
| 10 | Almost set | 30 | Memories |
| 11 | Sign in / sign up | 31 | New memory |
| 12 | Confirm your e-mail | 32 | A memory |
| 13 | Reset your password | 33 | Memories — empty |
| 14 | Keep everything (guest → account) | 34 | Progress |
| 15 | Explore — the map | 35 | Settings |
| 16 | Explore — a place opened | 36 | Dialogs |
| 17 | Journey | 37 | Legal pages |
| 18 | Your path is full | 38 | Not found · error · loading |
| 19 | Quest — before you start | 39 | Feedback pop-up |
| 20 | Quest — in motion, your plan | Ref | Quest art per category |

**Rules the frozen screens follow** (decided during the polish, 2026-10-21/22):
- **Palette.** Warm ground `#3b3628 → #4b4331`; Dawn sky `#47536b → #7f7a96 → #d79a8c → #f2b98e → #f8dcaa`;
  peach glow bottom right; cards `rgba(246,234,214,0.16)` with a 0.3–0.36 border; text `#f3f2ec`, muted `#d9d1ba`;
  accents `#e0823d` and `#f0b27a`. No mauve-only or flat-dark screens.
- **Category colours** are the Theme.ts ones (Nature `#215e4f`, Adventure `#8d6025`, Social `#824071`, Relax `#4264b3`):
  chips with white text and a cream rim, solid map markers, dots — never light-coloured text.
- **Buttons.** Primary = cream fill, dark text. Secondary = 1.5 px `#f0b27a` outline, `rgba(240,178,122,0.18)` fill,
  `#ffe2c2` text, icon in a peach disc. Dismiss (Close, Cancel) stays neutral. A button inside a cream card is never
  black: subtle tint `rgba(163,79,37,0.1)`, `#6b3416` text.
- **Cairn** is orange `#f0b27a` everywhere (the app-icon logo itself stays amber on forest).
- **Tab bar**: floating dark pill, the active tab a peach capsule.
- **Quests in motion live only in Explore**: map markers with an orange progress arc and a pulse, no step number,
  and a swipeable card per quest. Journey lists open quests only.
- **Quest art**: one illustrated world per category, one scene per quest (Ref board).
- **Today's question** is the card the app already ships (`DailyQuestionCard.tsx`), in Memories only.
- **Progress** is ordered by use; the rarely used parts (two questions, account, share) moved to Settings or out.
- **Feedback**: Settings row + pop-up (39); when it shows is task 60.

---

## 0. App start

**Loading gate** (`app/index.tsx`). Shows the cairn mark, a spinner and "Preparing your space…" while
the app signs in. If there is no session, it signs in silently as a guest (anonymous). Then it
routes to sign-in, onboarding or Explore.
→ Ember: the same, on the dusk ground.

**Not found** (`app/+not-found.tsx`): "Oops! This screen doesn't exist." plus a link home.
→ Ember: a calm empty state.

---

## 1. Sign-in and account (`app/(auth)/`, `app/account/save.tsx`)

**Sign in / Sign up** (`sign-in.tsx`)
- Toggle between "Welcome back" (sign in) and "Create account" (sign up); "Need an account? Sign up" / "Have an account? Sign in".
- Email and password fields; "Forgot your password?" link.
- "Continue without an account" (guest).
- Errors: missing fields, already registered, too many e-mails, no connection.
- **Confirm your e-mail** sub-state: code field, "Confirm", "No e-mail? Send a new code", "Use a different e-mail", "The e-mail has a link, no code?" (fallback).

**Forgot password** (`forgot-password.tsx`)
- Step 1: email → "Send me a code".
- Step 2: code, new password, repeat password → "Set new password"; "Didn't get a code? Send another", "Use a different email", "Back to sign in".
- Success: "Password changed — you are signed in".

**Create an account (guest → account)** (`account/save.tsx`)
- "Keep everything you have done" + explanation.
- E-mail → "Send confirmation e-mail"; then code (if any), password, repeat → "Save my account".
- "No e-mail? Send it again", "Use a different e-mail".
- Done state: "You have an account — sign in with … on any phone".

→ Ember: all three as one family of form screens with the dusk header, beige pill primary
button and dark fields.

---

## 2. Onboarding (`app/onboarding.tsx`)

Today: 6 steps with progress dashes, Back / Next.
1. Welcome: map image, "Stuck in the same week on repeat.", the Morocco founder story, "Get started".
2. How it works: 4 rows (Explore your map · Do small sidequests · Collect memories · Go at your own pace, up to 3 active).
3. Categories: "How do you want to spend more time?", four options with icon and description, at least one required.
4. Intensity: "How bold should your quests be?" (Gentle / Balanced / Bold).
5. Two quick questions: 1–5 scales (time in nature, loneliness), "just for you to look back on, asked again in a few months".
6. Almost set: 3 recommended quests to tick (optional) and a note that ideas for quests arrive as notifications (changeable in Settings). Button "Start with N quests" / "Start exploring". Asks for notification permission at the end. A single quest picked opens its runner.
- **Edit mode** (from Settings → Edit preferences): starts at step 3, ends with "Updated and ready." / "Save changes".
- Error: "That didn't go through".

→ Ember, **new order** (planned #61–#64):
1. Welcome: promise line on the dusk scene (#62).
2. Why this exists: the Morocco story, Standa's words unchanged.
3. What brings you here: goal options mapped to the four places, replacing step 3 (#61).
4. How bold.
5. Two quick questions.
6. How it works, animated (#64).
7. A week from now: today → in a week (#63).
8. What the research says: three study cards, swipeable (#62). Replaced the planned tester quotes (Standa, 2026-10-23, canvas v139). Each card: big number, short label, one sentence of what people reported, source. Same three studies as ScienceNote. Findings, never promises; no quotation marks.
9. Almost set: picks plus the notifications note.

Edit mode reuses 3–5 + 9.

---

## 3. Explore tab (`app/(tabs)/explore.tsx`, `components/explore/*`)

- The illustrated map, full screen; four place bubbles (Adventure, Nature, Social, Relax) that can be dragged a little; a dot on a bubble when something new is revealed.
- Info button top right → card "Explore your map — Tap a place to see the quests you have going there".
- Tap a place → **bottom sheet** (draggable, 64 % high): place name, "N in progress" / "Nothing in progress yet", close ×.
  - Lists quests in motion and paused-part-way in that place: category · "x/y steps" or "Paused", title, next step, "Continue" / "Resume".
  - Empty: "Nothing going on here yet — pick a quest in Journey…".
  - "Find a quest" / "Find another quest" → Journey on that category.
  - Catalogue failed to load → retry card.
- Path-full dialog can open from here (see 9).

→ Ember: the map stays exactly as it is. New: **an "In motion" card above the tab bar** for the quest you are on. The place with a quest going gets an orange label. The "Today's question" pill moves here as a shortcut to Memories (optional; today the question lives in Memories).

---

## 4. Journey tab (`app/(tabs)/journey.tsx`, `components/journey/AllQuestsList.tsx`)

- Title "Journey", subtitle "A few picks in each place — take whichever one calls to you."
- Category chips (four), preselected when arriving from the map.
- "N quests open to you here".
- Quest cards: category kicker, title, short description, "Anytime / Plan ahead / Big occasion · ~duration", **Start now**, **Like** (heart) / **Liked** (tap to unlike), **NEW** badge. Liked quests pinned on top, inside the five.
- Locked row: "N more waiting here — finish one of these to reach the next." (the five-per-place rule).
- Empty: "You have taken on everything here for now…" / "Nothing else is open here…".
- Loading "Loading the quest catalog…", failed → retry.
- Tap a card → quest detail.

→ Ember: **NEW "In motion" timeline on top** (the active quests, up to three, plus "Room for one more"). Today active quests are only reachable from the map and the quest page. The offer below is the illustrated tiles/cards per place, the same five-rule and locked row.

---

## 5. Quest detail (`app/quest/[id].tsx`)

- Category · its promise ("quiet time outside"), title, short description, full description, "Plan ahead · About 2 hours".
- **Your journey** checklist of steps (browse: preview; active: done/next; completed).
- Reflection prompt (only once started or finished, and only while no memory is written).
- States and actions:
  - Browse: **Begin** (adds and opens the runner); "Not for me" → sheet: "Not my thing — maybe later" / "Can't do this where I live — hide it".
  - Not open: "Not open to you right now — three going, or still waiting behind others in …".
  - Active: "N steps left — finish them in the runner", **Continue quest**, **Pause this quest** → dialog "Let this quest wait?" (Keep it on the path / pause; 0-step pause returns it to the offer).
  - Completed: "Completed.", **Add a memory** / **View memory**, feedback card ("How did this quest feel?" Meaningful / Not quite + optional note, Send feedback).
- Errors, "Quest not found", missing id.

→ Ember: dusk header in the quest's place colour. New: **"Your plan" card** (competitor structure) shown once a calendar step has a day: when, where, what to bring (from the steps). Plus **"Bring someone along — send the quest"** (planned #55a, share sheet, no in-app social).

---

## 6. Quest runner (`app/quest/run/[id].tsx`, `components/quest-run/*`)

- Header action **Leave** → dialog "Leave this quest?" (Keep going / Leave quest).
- **Before begin**: "Guided quest", title, intro, "Your journey — N steps" with step-type icons, note "No skipping ahead", **Begin the journey**.
- **Step screen**: "Step x of y", segment bar, "Back a step", step card (type icon, "~10 min" / "Take your time", title, detail, collapsible **Guide** tip, then the step action):
  - Confirm: "I did this" → dialog "Step done? Only tap this once you have really done it."
  - Counter: "Name one …" + Add, list with remove, "All N noted", Finish this step.
  - Input: text box ("A sentence or two… or skip it"), Finish this step.
  - Photo: "Take a photo for the memory", "Choose from gallery", Retake, "Finish without a photo"; camera/gallery permission messages.
  - Timer: "This step takes about …", Start the timer, running clock, "You can lock your phone, we'll let you know", "Unlocks in …", Skip the timer, Reset timer (+ confirm).
  - Calendar: "Add to calendar" (Android: finishes the step; iOS: "Is it in your calendar?" Yes / Open again / Not yet); pre-permission "A reminder the day before" (Continue / Skip the reminder); web fallback "I scheduled it".
- **All steps done**: "Every step is done", evidence list (what you gathered per step), "How did that feel? (optional)", **Complete quest**, "Not yet — keep this active".
- Completion: today a dialog "Nice work — quest complete / Saved to your memories / View memory" (or "Add a memory").
- Errors: "Cannot begin — three quests going", "Could not complete".

→ Ember: same flow, one step per screen. **NEW: the completion is a "Quest done" moment** (the pop-up on page D: a stone added to your cairn, "Write it down" / "Maybe later") instead of the system-style dialog.

---

## 7. Memories tab (`app/(tabs)/memories.tsx`) and memory screens

- Title "Memories", **+ New**.
- **Today's question** card (sunrise valley painting, date, question, "Best on paper — or write it here" → new memory titled with the question).
- Filters: one row of category chips (All + four) and a time-range chip "All time ▾" → sheet (All time / Last 7 days / Last 30 days).
- Memory cards: date and time, title, quest title or own category, photo or "No photo", body (3 lines).
- Empty: "No memories yet — Pick a quest"; filtered empty: "Nothing matches — Clear filters"; loading.

**New memory** (`memory/new.tsx`): Title, "What stayed with you?", Category (optional, for memories without a quest), Photo (optional: Choose / Remove / uploading), **Save memory**. From a quest: linked to it; from today's question: title prefilled. "Saved without the photo" fallback.

**Memory detail** (`memory/[id].tsx`): "Saved to your memories" banner right after saving + **Done**; full date, title, "From quest: …" or category, photo, body; **Edit** (same form, Save changes / Cancel), **Delete** → confirm.

→ Ember: Today's question keeps the sunrise painting, set on the dark ground. Memory cards become a photo-first timeline. The forms get dark fields with a beige primary.

---

## 8. Progress tab (`app/(tabs)/profile/ProgressOverview.tsx`, `components/progress/*`)

Top to bottom today:
- "Progress — Everything you have finished".
- **Account card**: "Guest — no account yet" / "Signed in"; guest prompt "Keep what you have done" → Create an account (or "Finish creating your account" while pending). Folded **Settings**:
  - Notifications: "Timers only" / "Everything" + what each sends; phone permission state ("Allow notifications" / "Open phone settings").
  - Edit preferences (→ onboarding edit mode).
  - Sign out (guest: warning "Sign out and lose everything?" → Create an account / Sign out and lose it).
  - Privacy Policy · Terms of Service; Delete account (→ confirm).
  - Admin only: Preview as user, Redo onboarding, Delete all progress, "Admin preview mode · Exit".
- **Baseline re-ask banner** (after a few months): "Still feeling the same way?" Update / Not now.
- Refreshing / error + retry.
- **Pick up where you left off** (paused part-way: Resume) and **Liked** (Start now, Unlike).
- **Trophy showcase**: count hero ("7 quests finished."), per-category medals, "Trophy shelf" list (medal #n, category, title, completed date → quest), empty "No trophies yet — Browse quests".
- **Why this works**: collapsible research note (White 2019, Bratman 2015, Killingsworth & Gilbert 2010).

→ Ember: the **cairn** replaces trophies and medals (one stone per finished quest; resolves the old "trophy shelf" design call). Stats: memories kept, first times, places visited. "Days you did something" calendar (no streak counts). Places on your map. "Your stones" list replaces the trophy shelf. **Share my cairn** (planned #55e, needs a build). Settings moves behind a gear to its own screen, which adds **Send feedback** (planned #60a).

---

## 9. Dialogs and shared states

- **Path full** modal: "Your path is full — Let one of these wait:" list of active quests → pause one, Close.
- App dialogs (`AppDialogHost`): every confirm and alert in the app (leave, pause, delete, sign out…). One title, one line, up to two buttons.
- Option sheet (`OptionSheet`): "Not for you?", time range.
- Empty / Error ("Something went wrong — Try again") / Loading states.
- Catalogue failed: "The quests could not be loaded…" + retry.

→ Ember: one dialog style (dark card, dusk strip on important moments, beige primary, quiet secondary) and one sheet style.

---

## 10. Legal (`app/legal/*`)

Privacy Policy, Terms of Service, Delete Account (how to delete in the app or by e-mail, what is deleted, what is kept). Long text with section headings.

→ Ember: reading layout on the dark ground; text unchanged.

---

## What is drawn (2026-10-19)

Six "Ember ·" pages on the canvas, 38 artboards:

- **Onboarding** (10): loading, welcome, why this exists, what brings you here, how bold, two quick questions, how it works (animated, clickable dots), a week from now, what the research says (three study cards, from v139), almost set.
- **Sign in & account** (4): sign in / sign up, confirm your e-mail, reset your password, keep everything (guest → account).
- **Explore & Journey** (4): the map, a place opened (sheet), Journey full scroll, your path is full.
- **Quest** (11): quest before you start, in motion with your plan, completed (memory prompt and feedback), not for you sheet. Runner: your journey, timer, photo, find N things, pick a day with the reminder sheet, every step is done, quest done.
- **Memories** (4): list with today's question and filters, new memory (from today's question, with place picker), a memory (just saved), empty.
- **Progress & settings** (5): Progress full scroll, Settings, dialogs (one style: pause, guest sign-out, delete), legal page, not found / no connection / loading.

**Not drawn, because they reuse a drawn pattern:** the input step (the memory form's text box inside a step card), the iOS "Is it in your calendar?" check (the dialog style), onboarding edit mode (steps 3–5 + 9 with "Save changes"), memory edit (the new-memory form), Terms and Delete Account (the legal page layout), the time-range sheet (the "Not for you?" sheet), filtered-empty memories (the empty state with "Clear filters"), the map's info card.

**Placeholders to fill before code:** the app version in Settings, the legal page date.

---

## Not screens, but part of the look

Notifications (timer up, the day before a quest, the weekly nudge), the app icon and splash, the
Play listing screenshots (#26/#45, to be redone after the redesign).
