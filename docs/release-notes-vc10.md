# Release notes — versionCode 10 (closed testing)

Built from `main` @ `da85524`, 2026-09-22. First build carrying the round-2 feedback fixes
(`docs/feedback/round-2-tasklist.md`).

---

## Uploading it by hand (Standa's call, 2026-09-22)

1. Download the AAB from the build page (**Download** button):
   <https://expo.dev/accounts/sidequestlife/projects/side-quest-life/builds/0e6def54-736d-4830-9d9d-ba25f06425c8>
2. Play Console → **Testing → Closed testing** → the Alpha track → **Create new release**.
3. Upload the `.aab`. The version shows as **10**; Play rejects anything at or below 9, which is the
   safety net against uploading an old artifact by mistake.
4. Paste the release notes below into **What's new in this release** (`en-US`).
5. **Next → Save**, then **Review release → Start rollout to Closed testing**.
6. Google reviews it. Last time the release was approved but the tester link still 404'd for a few
   hours afterwards — that is normal, not a broken upload.
7. Once it is actually live, send testers the message at the bottom of this file. Without it, some
   keep testing the old build.

**Nothing else needs doing in the Console**: the app listing, the data-safety form and the privacy
policy are unchanged by this build. Account deletion, which Play requires, now genuinely works —
it was broken for every user before this release (`supabase/fix_account_deletion.sql`, already run).

---

## Play Console → "What's new in this release" (EN, ~470 chars)

Paste as-is. Play allows 500 characters per language.

```
Thanks for the feedback — this update is built from it.

• Calendar steps now let you pick the day and time yourself
• Photos are optional: finish any step without one
• Timers can be skipped
• A quest you like stays where you found it, marked Liked
• "Not for me" hides a quest and opens the next one
• Quest levels are clearer: Anytime, Plan ahead, Big occasion
• Memories: filters tidied, and your own memories can take a category
• Fixed: an error message that followed you between screens
```

## Czech version (for the tester message, not Play)

```
Díky za feedback — tahle verze je z něj poskládaná.

• U kroku s kalendářem si teď vybereš den a čas sám
• Fotka je dobrovolná, krok jde dokončit i bez ní
• Timer jde přeskočit
• Lajknutý quest zůstane tam, kde jsi ho našel, označený jako Liked
• „Not for me" quest schová a otevře další
• Úrovně questů dávají smysl: Anytime, Plan ahead, Big occasion
• Vzpomínky: přehlednější filtry, vlastní vzpomínka může mít kategorii
• Opraveno: chybová hláška, která se táhla mezi obrazovkami
```

---

## Message to send testers once the release is live

Testers on auto-update get it on their own, usually within a day; everyone else has to press
**Update** in Play. Without a nudge, some keep testing the old build and report fixed bugs.

```
Ahoj, v Play je nová verze (10). Otevři Play Store → Side Quest Life → Aktualizovat.
Nic znovu neinstaluj ani se nikam nepřihlašuj.

Co je nového, hlavně z vašich připomínek: výběr dne u kalendáře, fotka a timer jdou
přeskočit, lajk quest neschová, přibylo „Not for me", srozumitelnější úrovně questů
a opravené filtry ve vzpomínkách.

Co by mi nejvíc pomohlo ověřit:
1. Krok „Put it on your calendar" — otevře se ti kalendář v telefonu? Jde vybrat den?
2. Dokončení questu s fotkou — uloží se vzpomínka i s fotkou?
3. Úvodní obrazovka při spuštění — sedí logo?
```

Those three are exactly the changes that could not be verified in the browser, because they are
native: the calendar editor, the photo upload and the splash screen.

---

## Known, deliberately not in this build

- Push notifications / the gap between steps (R2-13) — the big one, needs its own work.
- Quest text trimmed to one layer (R2-10) and the legality rewordings (R2-25) — content, needs the
  generated SQL run against Supabase.
- Onboarding's pace question still describes levels in minutes, which now disagrees with the new
  level names (logged under R2-23).
