# Tasks / Backlog

## 1) ~~Onboarding baseline question + 3-month re-ask~~ — Done (found already shipped, 2026-08-21)
- Baseline nature-connection/isolation questions + one-time baseline capture +
  3-month re-ask all built (`a0b65de`). This entry wasn't crossed off when the
  work landed — caught during this session's tasks.md audit.

## 2) ~~Admin / test account~~ — Done differently than described (found 2026-08-21)
- No literal "admin account" — instead `lib/devAuth.ts` auto-signs-in in
  `__DEV__` builds via env vars, which covers the actual goal (walk the app
  without re-entering credentials each time). Separately, `isAdminEmail()`
  gates redo-onboarding/delete-progress tools for one real email.

## 3) ~~Finish `docs/value-proposition.md`~~ — Done 2026-08-21
- "Backed by research" paragraph (White, Bratman, Killingsworth & Gilbert)
  approved and live in the doc; 3 more citations kept as backup/reference.

## 4) ~~Finish `docs/story.md`~~ — Done 2026-09-06
- Morocco scene written up from Standa's own account: the beach, the sea, the
  sunset, and thinking about cancelling the flight home. Shaped, not invented.
- Three lengths drafted — full, two-sentence, and a one-line welcome-screen cut
  — so how prominent it should be can be decided by reading rather than in the
  abstract.
- **One thing left, and it is a product decision rather than a writing one:**
  the welcome screen still runs "Turn ordinary days into small adventures" and
  does not use the story at all. Swapping in the personal line is worth
  deciding deliberately, not by default.

## 5) ~~Clarify: onboarding is recommendations only~~ — Done (found already shipped, 2026-08-21)
- Footnote copy live on both the onboarding summary screen and Explore's
  recommended section (`docs/onboarding-revision-plan.md` §1–2). Same catch
  as #1 — done but not crossed off until this session's audit.

## 6) ~~Decide on color palette~~ — Done 2026-08-21
- Derived from the Explore map artwork rather than picked by eye: brand accent
  taken from the map's own hue band, category hues kept out of it, lightness
  staggered so colour blindness cannot collapse them. Method and the measured
  results (contrast, ΔE, dichromat simulation) are documented in
  `constants/Theme.ts`.
- Structured as `lightPalette` behind a `ThemePalette` type so a dark palette
  can be added later without touching call sites. **Dark mode itself is still
  open** — the structure is ready, the values are not written.

## 7) Side quest: content, process, voice, branding — **branding pulled forward 2026-08-29**
- Broader pass on quest content/process and brand voice — still deferred until
  after MVP validation.
- **Visual branding is no longer deferred**: Standa made it the priority, and the
  brief (name, 3 colour roles, heading+body type pairing, logo) now lives in
  `BRANDING.md` with what is decided and what is still open. Note the one hard
  deadline recorded there — the Android package name is permanent after the
  first Play upload, so the name has to be settled before then.

## 8) Adjust Explore map art to match quest vibe
- Current map is a generic forest illustration; revisit so each category's
  spot (and the overall art style) actually feels like the quests it holds,
  not just a themed marker icon dropped on top.

## 9) ~~Let users change onboarding answers later~~ — Done (found already shipped, 2026-08-21)
- Real "Edit preferences" entry point on the Progress tab's account card for
  everyone, not just admin (`docs/onboarding-revision-plan.md` §3). Same
  catch as #1/#5.

## 10) ~~Progress tab: surface the science backing, tucked away~~ — Done 2026-08-21
- `components/progress/ScienceNote.tsx`: a collapsed "Why this works" row at
  the bottom of the Progress tab, expands on tap to the approved research
  paragraph. Verified in the browser preview (expand + collapse both work).

## 11) Reminders: the calendar step, then a notification ecosystem

Raised by Standa 2026-09-06. Two related pieces, deliberately not started —
half a notification system is worse than none, and both change what testers see.

### 11a) Calendar step — add a Google Calendar route, do not replace the native one

Today a calendar step calls `expo-calendar` and writes an event to the device
calendar (`app/quest/run/[id].tsx`, evidence `{ kind: 'calendar', eventId }`).
On web there is no device calendar, so it shows a confirm dialog saying to add
it yourself — honest, but a dead end.

**The web fix is a Google Calendar template URL**, which needs no library and no
permission:

```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text=<quest title>&dates=<start>/<end>&details=<step detail>
```

Dates are UTC basic format, e.g. `20260912T170000Z/20260912T180000Z`. The
`template` on `QuestStepAction` already carries title, notes and duration, so
everything the URL needs is in the data model.

**Do not swap the native path for it.** Writing to the device calendar works
with whatever calendar the person actually uses — Samsung, Outlook, Apple — and
needs no browser round-trip or Google account. A Google link on Android would be
a downgrade for anyone not living in Google Calendar. Right shape: native write
on device, Google link on web, and possibly a "use Google Calendar instead" link
underneath on device for people who want it.

### 11b) Notifications — nothing exists yet, and one decision shrinks the job

**Current state:** no notification library in `package.json`, no permission
requested, no scheduling code. The preference is real and already stored —
`profiles.notification_intensity` is quiet / occasional / chatty — and the
control is hidden behind `NOTIFICATIONS_IMPLEMENTED` in `AccountCard.tsx` until
this lands.

**The decision that halves the work: local notifications, not push.** Push needs
a server, credentials and a delivery service. Local scheduled notifications need
none of that, and cover essentially everything this app would say — a quest is
tomorrow, a quest has been sitting untouched for a fortnight, the calendar slot
you chose is in an hour. Push only earns its keep when the *server* has something
to say that the phone could not have known, and with no social features there is
almost nothing in that category yet.

**Constraints worth knowing before starting:**

- `expo-notifications` needs `POST_NOTIFICATIONS` on Android 13+. That is a **new
  permission on the store listing**, and permissions were deliberately trimmed
  (`blockedPermissions` in `app.config.ts`) because unused ones invite reviewer
  questions. Adding one back means updating the Data safety answers too.
- **The product bans nagging.** `AGENTS.md` rules out streak pressure and
  gamification, and Standa has reinforced it repeatedly. A notification that says
  "you have not done a quest in 5 days!" is the streak mechanic wearing a
  different coat. The three intensity levels are the right shape — the writing
  work is making even "chatty" feel like an invitation.
- Local notifications fire off the device clock, so they keep working offline and
  cost nothing to run.

**Timing: after the closed test.** Doing it before puts a new permission prompt
in front of twelve testers and changes a Data safety form mid-review, for a
feature nobody has asked for yet. The test may also say what reminder people
actually want, which is cheaper than guessing.
