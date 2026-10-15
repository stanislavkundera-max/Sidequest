# Phone test — everything since 2026-10-12 (build 11 + OTA)

Nothing from these updates has been checked on a phone yet. Three OTA updates are live on build 11:

| Published | Update group | What |
|---|---|---|
| 2026-10-12 | `87f5d7c6` | Pause opens the new quest (#47), in-app dialogs (#50), Settings folded (#51), sign-up with a code (#39, #40) |
| 2026-10-15 | `4f2c6ddb` | Calendar step (#5), plain error messages (#50), likes in the five (#48), 0-step pauses return (#49), Explore panel (#46), weekly nudge (#53) |
| 2026-10-15 | `474b4acf` | Fix from the code review: a pause with progress, or of a retired quest, is never deleted |

Write ✅ or ❌ next to each line; for a ❌ send a screenshot with the number.

## 0. Get the update onto the phone

- [ ] **0.** Close the app completely (swipe it away in recent apps), open it, wait ~30 seconds, close it again, open it again. The update downloads on the first start and applies on the next. If 1. below still shows the old Progress screen, do this once more.

## Progress

- [ ] **1.** The top of Progress shows your account and a folded **"Settings"** row — no notification buttons, no Sign out, no Delete account in sight. *(#51)*
- [ ] **2.** Tap **Settings**: it unfolds into Notifications (**"Timers only" / "Everything"**, "Everything" selected) with a sentence under them saying what arrives, then Edit preferences, Sign out, the legal links and Delete account. Tap again: it folds. *(#51, #53)*
- [ ] **3.** **"Pick up where you left off"** no longer lists the quests you paused with **0 steps** — they are gone from here. Quests with at least one step done are still here. *(#49)*

## Journey

- [ ] **4.** Every category shows **at most 5 cards**, liked ones included, and the line "N quests open to you here" matches the number of cards. *(#48)*
- [ ] **5.** The quests that left Progress in 3. are back in their category's list as normal cards. *(#49)*
- [ ] **6.** Like a quest: it moves to the top with "Liked", and **no new quest appears** — still five cards. *(#48)*

## Map (Explore)

- [ ] **7.** Tap a place: the panel shows **only quests you have going there** (in motion, and "Paused · x/y steps" with Resume). No recommendations, no likes. *(#46)*
- [ ] **8.** The panel header says **"2 in progress"** (or "Nothing in progress yet"), not "10 quests". *(#46)*
- [ ] **9.** The button at the bottom (**"Find a quest"** / **"Find another quest"**) opens Journey on that category. *(#46)*

## Starting and pausing

- [ ] **10.** With three quests going, start a fourth: the dialog "You already have three quests going" opens. Tap **Pause this quest** on one → the app **opens the new quest** straight away. *(#47)*
- [ ] **11.** All dialogs look like the app (light card, rounded green buttons), **not** the grey Android system box. Try e.g. **Leave** at the top of a quest. *(#50)*
- [ ] **12.** **Leave** on a quest with **0 steps done**: the dialog says *"Nothing is done on it yet, so it goes back to the list in Journey"*; confirm → you land on **Journey** and the quest is in the list. *(#49)*
- [ ] **13.** **Leave** on a quest with **a step done**: the dialog says your progress stays saved; confirm → you land on **Progress**, quest under "Pick up where you left off". *(#49)*

## Calendar step

- [ ] **14.** On a quest's "put it in your calendar" step, the note under the button reads *"Your calendar opens with the quest filled in. Pick a day and save it — that finishes this step, no need to come back here. We'll remind you the day before."* *(#5)*
- [ ] **15.** Tap **Add to calendar**. The first time, Android asks for calendar access and (if not given yet) notifications — allow both. Your calendar app opens with the quest filled in. *(#5)*
- [ ] **16.** Pick a day **2–3 days ahead**, save. Stay in the calendar or go anywhere — then open Side Quest Life: the step is **already done**, you are on the next one, **no "Is it in your calendar?" dialog**. *(#5)*
- [ ] **17.** **The day before** the day you picked, a notification arrives ("It's tomorrow…"). Check it when it comes. *(#5, #8 — your calendar's own reminder arrives too, on the day.)*

## Timer

- [ ] **18.** On a timer step, start the timer and lock the phone: when it ends, **"Time is up"** arrives. *(#9)*

## No connection

- [ ] **19.** Turn on **airplane mode** and try to save a memory or start a quest: the message says **"No connection. Try again when you have signal."** — no technical text. Turn airplane mode off. *(#50)*

## Accounts — do 20 before 21

**If you are a guest** ("Guest — no account yet" at the top of Progress), do 20 first: signing out of a guest account loses everything.

- [ ] **20.** Guest → account: Progress → **Create an account** → your e-mail → an e-mail arrives **with a 6-digit code, no link** (check spam) → type the code, choose a password → "Your account is saved". *(CR-5, Supabase template)*
- [ ] **21.** Sign-up with a **new** e-mail: Settings → Sign out → "Need an account? Sign up" → new e-mail + password → the screen **"Confirm your e-mail"** asks for a code → the code arrives by e-mail (check spam) → type it → you are **signed in, no error page**. *(#37, #39 — blocks the production release)*
- [ ] **22.** On that "Confirm your e-mail" screen, **"No e-mail? Send a new code"** sends a new one. *(#39)*
- [ ] **23.** The new account goes through onboarding: the last screen ends with *"Now and then I'll send you an idea for a quest — change that any time in Progress → Settings."*, and **Start exploring** asks to allow notifications. *(#53)*
- [ ] **24.** Sign out of the test account and sign back into your own.
- [ ] **25.** On the sign-in screen with **airplane mode** on, try to sign in: **"No connection…"**, not a paragraph about Supabase and Expo. *(#50)*

## Can't be checked quickly

- **Weekly nudge (#53):** arrives only after **7 days without opening the app**, at 18:00. To see it: don't open the app for a week. Switching to "Timers only" turns it off.
- **OTA of 2026-10-03** (the account-screen message "We can't send e-mails yet"): only appears when Supabase refuses to send. With your own SMTP live it no longer happens — nothing to check.
