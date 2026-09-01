# Play Store listing assets

Generated 2026-08-29. Regenerate any time with the web server running:

```
node scripts/capture-store-screenshots.cjs
```

## Screenshots — done

Six phone screenshots at **1080×1920** (9:16), captured from the web build:

| File | Screen |
|---|---|
| `01-welcome.png` | Welcome / first launch |
| `02-onboarding-categories.png` | Onboarding: picking quest categories |
| `03-explore.png` | Explore map — **the strongest image the app has; use it first** |
| `04-journey.png` | Journey catalog |
| `05-memories.png` | Memories timeline |
| `06-progress.png` | Progress tab |

**These are placeholders in the useful sense.** They show the pre-redesign UI, and Play lets you
replace listing images at any time **without a new app review** — so shipping these now costs
nothing and unblocks a required field. Replace them once the branding in `BRANDING.md` reaches the
screens.

Two caveats worth knowing rather than rediscovering:

- They come from the **web** build. It renders the same components, but a real device screenshot
  would show the Android status bar and system font. Worth reshooting from the device once there is
  an installable build — the script exists, only the capture target changes.
- `05-memories` and `06-progress` show **empty states**, because the capture runs on a fresh
  anonymous account. They are honest, but a listing is stronger with content in them. Reshoot from
  the demo/reviewer account once it exists and has a completed quest and a saved memory.

## Still missing

- **Feature graphic, 1024×500** — needs design, not capture. Blocked on `BRANDING.md` §4 (logo).
- **App icon, 512×512 PNG** for the listing — export from `assets/images/icon.png`.

## Not needed

Tablet screenshots. Without them Play labels the app "not optimised for tablets", which is a label
rather than a blocker, and this release is phone-only.
