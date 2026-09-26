# Release notes — versionCode 11 (closed testing)

Built from `main` @ `71e006c`, 2026-09-26. Everything since build 10 (`da855245`): the rest of the
round-2 feedback, local notifications (R2-13, R2-21), the calendar fix on Android and the new map.

**First build with over-the-air updates** (`expo-updates`, channel `production`,
`runtimeVersion: fingerprint`). From here on, JavaScript-only changes reach testers through
`eas update` in minutes, without a Play review. Only native changes need a new build.

Build page: <https://expo.dev/accounts/sidequestlife/projects/side-quest-life/builds/be6cb13c-394a-40aa-8ba2-22937128329a>

---

## Uploading it by hand

Same steps as build 10 (`docs/release-notes-vc10.md`): download the AAB → Play Console → Testing →
Closed testing → Alpha → **Create new release** → upload (shows as **11**) → paste the notes below
→ **Save → Review release → Start rollout to Closed testing**.

**New in the Console this time:** the app now asks for permission to show notifications
(`POST_NOTIFICATIONS`) and keeps scheduled reminders after a restart (`RECEIVE_BOOT_COMPLETED`).
Both come from `expo-notifications`. They are local notifications — nothing is sent to a server and
no data leaves the phone — so the Data safety form does not change.

---

## Play Console → "What's new in this release" (EN, under 500 chars)

```
Built from your feedback again — thank you.

• Reminders: when a step timer ends, and on the day you planned a quest. Tap one to go straight back to your step
• Calendar steps bring you back to the app after you save
• A new map, with a place for each kind of quest. Drag the bubbles around
• Quest pages are shorter and in plainer words
• "Can't do this where I live" hides a quest for good
• Choose which reminders you get in Progress → account
```

## Czech version (for the tester message, not Play)

```
Zase poskládané z vašeho feedbacku — díky.

• Připomínky: když doběhne timer a v den, kdy máš quest naplánovaný. Klepnutím se vrátíš rovnou na krok
• Po uložení do kalendáře tě appka vrátí zpátky
• Nová mapa, každý typ questů má své místo. Bubliny jde posouvat
• Stránky questů jsou kratší a srozumitelnější
• „Can't do this where I live" quest schová natrvalo
• Které připomínky chceš, nastavíš v Progress → účet
```

---

## Message to send testers once the release is live

```
Ahoj, v Play je nová verze (11). Otevři Play Store → Side Quest Life → Aktualizovat.
Nic znovu neinstaluj ani se nikam nepřihlašuj.

Nově: připomínky (konec timeru a den naplánovaného questu), kalendář tě po uložení vrátí
do appky, nová mapa s posouvatelnými bublinami a kratší stránky questů.
Menší opravy vám od teď budou chodit samy, bez aktualizace v Play.

Co by mi nejvíc pomohlo ověřit:
1. Spusť timer u kroku a zamkni telefon — přijde po doběhnutí připomínka? Otevře klepnutí krok?
2. Krok „Put it on your calendar" — ulož událost. Vrátí tě to do appky a jde pokračovat?
3. Na mapě potáhni bublinu — vrátí se na místo? A klepnutí ji pořád otevře?
```

All three are native and could not be checked in the browser.

---

## Known, deliberately not in this build

- Quest-day reminder on Android uses the prefilled time (tomorrow / in a week / in a month, 10:00);
  if you move the event in the calendar, the app's reminder does not follow. Your calendar still
  reminds you.
- Confirmation dialogs do not appear inside Claude's built-in browser (it blocks `window.confirm`).
  On phones they are native dialogs and work.
- Map art is 896 × 1200 px; an upscaled version can ship later over the air.
