# Phone test — 1.1.0 preview APK (Dawn + Expo SDK 58)

Everything in this build is new to a phone: the Dawn redesign (39 screens), Expo SDK 54 → 58
(React Native 0.81 → 0.88), R8 shrinking, exact alarms for the timer and the new splash. It was
checked on the computer only (typecheck, unit tests, expo-doctor, the Android bundle, prebuild).

Write ✅ or ❌ next to each line; for a ❌ send a screenshot with the number. A crash (the app closes
by itself) is the most important thing to report — say what you tapped just before.

## 0. Installing

- [ ] **0a.** **Before uninstalling, check you are signed in with your e-mail** (Progress → Settings
  shows the address). A guest account lives only on the phone and is gone with the app.
- [ ] **0b.** Uninstall Side Quest Life from Google Play. The preview APK is signed differently from
  the Play version, so Android will not install one over the other.
- [ ] **0c.** Install the APK from the EAS link. Android asks to allow installs from the browser —
  allow it for this one install.

Afterwards, to go back to the store version: uninstall the APK and install from Play again.

## Start and onboarding

The first start after a fresh install makes a new guest and runs onboarding — the way to see screens
1–10. Sign in with your own account afterwards (32).

- [ ] **1.** Cold start: the amber cairn on the dark brown ground, then the loading screen **without a
  flash or a jump** — the cairn stays where it is.
- [ ] **2.** Welcome → **Why this exists**: the picture shows **palm trees** (not posts) and a plane.
- [ ] **3.** What brings you here → How bold → Two quick questions: options tap, Next enables.
- [ ] **4.** **How it works**: the animation runs, the dots can be tapped.
- [ ] **5.** A week from now → **What the research says** (three cards swipe) → Almost set.
- [ ] **6.** Notification permission is asked at the end; allow it.

## Tabs and the map

- [ ] **7.** The floating tab bar: every tab opens with **one tap**, the active one is a peach capsule.
- [ ] **8.** Progress → Settings, then tap the Progress tab again: you land back on Progress.
- [ ] **9.** Explore: the map, tap a place → the panel; pull it down to close.
- [ ] **10.** Journey: categories, cards, quest art. Scrolling is smooth.
- [ ] **11.** **Gradients and shadows**: the dark ground fades, the peach glow bottom right, cards have
  soft edges, the tab bar floats. Nothing is a flat black or white block.

## Quests

- [ ] **12.** Start a quest → the quest page and the runner (**your journey**).
- [ ] **13.** With three going, start a fourth → **Your path is full** (screen 18).
- [ ] **14.** **Timer step**: start a 5-minute timer, **lock the phone**, wait. "Time is up" arrives
  **on time** (exact alarms, new in this build).
- [ ] **15.** **Photo step**: take a photo with the camera, and pick one from the gallery.
- [ ] **16.** **Calendar step**: Add to calendar → pick a day, save. Open the app again later:
  it should not ask anything more.
- [ ] **17.** Finish a quest → **every step is done** (28) → **a new stone** (29) → the completed page
  (21) with Add a memory.

## Memories and Progress

- [ ] **18.** Today's question on top of Memories; "write it here" opens a new memory.
- [ ] **19.** New memory **with a photo** → saves, the card shows the photo.
- [ ] **20.** Open a memory, edit it, delete one.
- [ ] **21.** Progress: the cairn, the tiles, **Your stones** rows.
- [ ] **22.** Settings → **Send feedback** → the sheet → Send opens your mail app with the text.
- [ ] **23.** Settings → notifications: Timers only / Everything switch.

## Account (signing in, R8)

- [ ] **24.** Sign out of the onboarding guest (it warns you — fine, it is a throwaway).
- [ ] **25.** Sign in with your e-mail and password → your quests and memories are there.
- [ ] **26.** Forgot password → the code screen appears (step 2). Sending the e-mail is enough.

## Over the next days

- [ ] **27.** **Feedback pop-up**: after opening the app on **three different days**, with a step or a
  memory done, switching to Explore, Memories or Progress shows "Help me make this better for you".
  Never right at start, never during a timer. Tap **Not now** → it does not come back for 30 days.
- [ ] **28.** A quest-day reminder (#65): plan a quest via its calendar step for **tomorrow**, open the
  app once afterwards → the reminder arrives a day before (two hours before if it is sooner).

## Screenshots for Play (#26 / #45b)

While the APK is on the phone, from your own account with real memories and photos: Explore,
Journey, a quest, Memories, Progress — ideally every main screen.
