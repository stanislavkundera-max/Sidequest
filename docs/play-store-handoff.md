# Play Store handoff — what only Standa can do, and the exact answers to give

One of three: `docs/launch-plan.md` explains *why*, `docs/play-store-roadmap.md` gives the *order*
and the gates, and this page is *what to type* — the exact answers for the parts that need your
account, your card, or your decision.

**Start from `docs/play-store-roadmap.md`** if the question is what to do next; come here when a form
is already in front of you.

Every answer below was derived from the code on 2026-08-29, not from a template. Where an answer is
a judgment call rather than a fact, it says so.

---

## 0. Next session — the click-path, with every value ready

Prepared 2026-09-05 so the next session is clicking, not deciding. Work top to bottom.

### Play Console → Create app

| Field | Value | Note |
|---|---|---|
| App name | `Side Quest Life` | Confirmed 2026-09-05. 15 of 30 characters |
| Default language | English (United States) | Set at creation; the store copy is English |
| App or game | **App** | Changeable later |
| Free or paid | **Free** | ⚠️ Not changeable later. Does not block a paid tier — see roadmap |
| Contact email | ⛔ **blocked on the domain decision** | See below |
| Declarations | Accept all three: Developer Program Policies, US export laws, **Play App Signing ToS** | The last one is what enables the AAB flow |

### Store listing — content is written

| Field | Where it is | Status |
|---|---|---|
| Short description | `docs/store-listing-copy.md` — "Small real-world quests that pull you out of routine and into your life." | ✅ 72 / 80 characters |
| Full description | `docs/store-listing-copy.md` | ✅ ~1,140 / 4,000 characters |
| App icon 512×512 | `store-assets/play/icon-512.png` | ✅ Generated 2026-09-05 |
| Phone screenshots | `store-assets/play/screenshots/` — lead with `03-explore.png` | ✅ Six at 1080×1920 |
| Feature graphic 1024×500 | — | ❌ **Missing.** Needs design; blocked on `BRANDING.md` §4 |
| Category | Lifestyle | From `docs/store-listing-copy.md` |
| Privacy policy URL | — | ⛔ Blocked on the deploy |

### App content — answers already derived

- **Data safety** → §5 of this document. Full table, derived from the code
- **Content rating (IARC)** → §6. Expect Everyone / PEGI 3
- **App access** → §7. ⛔ Needs the demo account creating first
- **Ads** → declare none. No ad SDKs exist in the project
- **Target audience** → not directed at children
- Short declarations for news app, government app, financial features, health: all no

### ⛔ The three things still genuinely missing

1. **Domain decision** — decides the contact email and the public URLs. See below.
2. **Demo/reviewer account** — a real account walked through onboarding with one quest completed and
   one memory saved, so the reviewer does not land on empty states. Needs the app installable, so it
   follows the first build.
3. **Feature graphic** — the only listing asset that cannot be generated from what exists.

### The domain decision, framed for a quick answer

`constants/legal.ts` currently promises `privacy@sidequestlife.com`, and that mailbox does not
exist. Two ways out:

**A — buy `sidequestlife.com`** (a few hundred CZK a year). `privacy@` becomes real, the legal pages
deploy to a clean URL, and the domain is needed for the brand work anyway. **Recommended.**

**B — skip the domain for now.** Deploy the web export to Vercel's free `*.vercel.app` subdomain;
`/legal/privacy` and `/legal/delete-account` become public URLs immediately and satisfy Google. But
`LEGAL_CONTACT_EMAIL` then has to change to a mailbox that really exists — in practice a personal
Gmail, published on the store listing and inside the app.

The real cost of B is not the ugly URL, it is a personal address on a public listing. That is why A
is the recommendation despite costing money.

Either way the deploy itself is quick: the repo is on GitHub, `vercel.json` is configured, and
importing the repo in Vercel's web UI needs no CLI. One catch — set
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in Vercel's project settings too, or
the deployed web app shows the "Configure Supabase" fallback. The legal pages render either way,
since they are static.

---

## 1. Things blocked on you, in order

| # | Task | Why it is first / notes |
|---|---|---|
| 1 | **Create the Play Console account** ($25 one-time) | Identity verification runs for days on Google's side and blocks everything downstream. Start it before anything else. |
| 2 | **Expo account + `npx eas-cli login`** | Needed before `eas init` can link the project. Takes a minute; I cannot do it because it requires your password. |
| 3 | **Supabase: add `{{ .Token }}` to the reset-password email template** | See §2. Without it, password reset silently sends nothing. |
| 4 | ~~**Fill the three privacy placeholders**~~ | ✅ Done 2026-08-29. One follow-up: make privacy@sidequestlife.com a real mailbox — see §3. |
| 5 | **Deploy the web export** | Play needs public URLs for the privacy policy and account deletion. `vercel.json` is already configured; the routes already exist. See §4. |
| 6 | ~~**Run `supabase/analytics_pii_scrub.sql`**~~ | ✅ Done 2026-08-29, both verification counts returned 0. See §2b for the one remaining catch. |
| 7 | **Check whether the 12-tester rule applies to you** | Not a given — see §9. Find out early, because if it does apply it is the longest pole in the launch. |
| 8 | **Create a demo account for the Google reviewer** | See §7. |

---

## 2. The one Supabase change password reset depends on

`app/(auth)/forgot-password.tsx` recovers accounts with a **6-digit code**, not an emailed link,
because the app has no deep-link handling at all (`detectSessionInUrl: false`, and nothing imports
`expo-linking`). Building link handling would mean debugging blind without dashboard access; a typed
code works identically on web and native with no linking infrastructure.

The cost is one dashboard edit:

> **Supabase → Authentication → Emails → "Reset password" template**
> The default template contains only `{{ .ConfirmationURL }}`. Add `{{ .Token }}` — that variable is
> the 6-digit code the screen asks for.

Suggested body:

```
Hi,

Your Side Quest Life password reset code is: {{ .Token }}

Enter it in the app to set a new password. The code expires shortly.
If you didn't ask for this, you can ignore this email.
```

**Until this edit is made, the reset screen will accept an email address and then never work** — the
user gets an email with a link but no code to type. Everything on the app side is already built and
verified against real Supabase; this is the only missing piece.

---

## 2b. The Supabase change the deletion page depends on — done, with one catch

**Status: run 2026-08-29.** Both verification counts came back 0, so the deployed
`delete_own_account()` is current and the historical rows are clean.

**The catch: that script is a one-time cleanup, not a standing guarantee.** The code that stops
`userId` being written in the first place lives in `QuestFeedbackCard.tsx` on the
`play-store-prep` branch. Any build still running the old version re-introduces the duplicated
identifier on every feedback submission. Two consequences:

- Merge and ship the branch before putting a build in front of testers.
- After the first real deployment, re-run the verification query at the bottom of the script. If
  `rows_with_duplicated_user_id` is above 0, an old build is still in circulation somewhere.

The rest of this section is kept for context on why it mattered.

`supabase/analytics_pii_scrub.sql` does two things: updates `delete_own_account()` on the deployed
database, and cleans up rows written before the fix.

Why it is not optional: `analytics_events.user_id` is `on delete set null`, which was assumed to
make a deleted user's rows anonymous. It did not. The `properties` jsonb was also receiving a
verbatim copy of the user's UUID and the free text they typed into quest feedback — and nothing
nulled those. A "deleted" account's rows stayed fully identifying.

`app/legal/delete-account.tsx` states in public that after deletion nothing you wrote survives and
the account reference cannot be traced back to you. Those were false for anyone who had ever
submitted quest feedback, which is what the script fixed.

Treat that page and `delete_own_account()` as a matched pair from here on: if a new analytics
property starts carrying user-written text or an identifier, add its key to the strip list in the
function, or the page goes back to being false.

---

## 3. Legal identity — filled in 2026-08-29

All three placeholders are resolved. The values now live in one place,
**`constants/legal.ts`**, shared by the privacy policy, the terms, and the deletion page, so a change
is one edit rather than a hunt through three screens.

| Value | Setting | How it was decided |
|---|---|---|
| Contact address | `privacy@sidequestlife.com` | Standa's call: an address on the app's own domain rather than a personal inbox, so it can be redirected later without editing a published legal document. |
| Data controller | Stanislav Kundera, private individual | Settled after considering an Organization account: that type is bound to a legal entity, and the IČO behind it is being dissolved at year end. A **personal** Play account matches this value exactly, so nothing here waits on anything. |
| Governing law | Czech Republic | Follows from the above. |
| Hosting location | Frankfurt, Germany (AWS `eu-central-1`), inside the EU | Not taken from the dashboard: the project's database host resolves to `2a05:d014:7c9::…`, which sits inside `2a05:d014::/35`, a block Amazon's own published IP ranges assign to `eu-central-1`. Being inside the EU is what keeps the GDPR story simple. |

### ⚠️ The one thing still owed

`privacy@sidequestlife.com` has to be a mailbox that **actually receives mail** before submission.
Right now it is a decision, not a working address. GDPR gives users the right to reach the
controller, and Play publishes this address on the store page — a bouncing address is worse than a
personal one. An alias forwarding to an inbox you read is completely fine; an address on an
unregistered domain is not.

That domain is the same one the public privacy-policy and deletion URLs need (§4), so registering it
settles both at once. If you pick a different domain, change `LEGAL_CONTACT_EMAIL` in
`constants/legal.ts` — nothing else needs touching.

---

## 4. The public URLs Google requires

Both pages already exist as ordinary routes with no auth gate, so the existing web export publishes
them as public pages — no separate website needed:

- Privacy policy → `https://<your-domain>/legal/privacy`
- Account deletion → `https://<your-domain>/legal/delete-account`

Deploy with the existing `vercel.json` (`npx expo export --platform web`, output `dist/`). Once the
domain exists, paste those two URLs into Play Console: the privacy policy under **App content →
Privacy policy**, and the deletion URL under **Data safety → Account deletion**.

Verify both open in a private browser window before submitting — Google checks that they load
without a login.

---

## 5. Data safety form — answers derived from the code

**Third-party SDKs: none.** No ad networks, no Firebase, no Mixpanel/Amplitude, no IDFA. Analytics is
first-party only, writing to your own `analytics_events` table (`src/lib/analytics/index.ts`). This
is why every "Shared with third parties" answer below is No.

### Data types to declare as collected

| Data type (Google's wording) | Collected | Shared | Required? | Purpose | Notes from the code |
|---|---|---|---|---|---|
| Personal info → **Email address** | Yes | No | Optional | Account management | Only if the user signs up with email; anonymous sessions have none. |
| Personal info → **User IDs** | Yes | No | Required | App functionality, Analytics | Supabase `auth.uid()`, on every row. |
| Photos and videos → **Photos** | Yes | No | Optional | App functionality | Memory photos, uploaded to the private `quest-memory-photos` bucket. |
| App activity → **App interactions** | Yes | No | Required | Analytics, App functionality | The 24 event names in `src/constants/validation.ts`. |
| App activity → **Other user-generated content** | Yes | No | Optional | App functionality | Memory notes, free-text answers typed during quest steps, and the optional note on quest feedback. |
| Personal info → **Other info** | Yes | No | Optional | App functionality, Personalization | Onboarding preferences: categories, pace, intensity, plus the two baseline scale answers. See the judgment call below. |

### Data types to declare as NOT collected

- **Location** — nothing in the app touches location. Verified by grep: no `expo-location`, no geolocation.
- **Calendar** — the app *writes* a reminder to the device calendar via `expo-calendar`, but never reads
  it and never transmits it. Data safety asks about data leaving the device, so this is "not collected"
  even though the permission is declared. Expect this to look inconsistent; it is correct.
- **Financial info, Health and fitness, Messages, Contacts, Audio, Files and docs, Web browsing,
  Installed apps** — none.
- **Crash logs / Diagnostics** — `src/lib/monitoring/errorLogger.ts` only calls `console.error`. Nothing
  is transmitted off the device and there is no crash-reporting SDK, so declare not collected.

### One judgment call worth making deliberately

The two baseline questions — how connected to nature you feel, how often you feel isolated — are
self-rated wellbeing scales. Google's **Health and fitness** category is aimed at medical and fitness
data, so "Personal info → Other info" is the better fit, and that is what the table above says.

It is a genuine borderline case. Over-declaring costs nothing; under-declaring is what gets apps
pulled. If you would rather be maximally safe, declaring them under Health and fitness is defensible
and will not hurt the listing.

### Security practices section

- Data encrypted in transit: **Yes** (all Supabase traffic is HTTPS).
- Users can request data deletion: **Yes** — give the URL from §4.
- Independent security review: **No**.
- Committed to Play Families Policy: **No** (the app does not target children).

---

## 6. Content rating (IARC) — expected answers

All of these follow from what the app actually contains; expect a rating of **Everyone / PEGI 3**.

| Question | Answer |
|---|---|
| Violence, blood, scary content | No |
| Sexual content or nudity | No |
| Profanity or crude humour | No |
| References to drugs, alcohol, tobacco | No |
| Gambling, or simulated gambling | No |
| **Do users interact, or share content with each other?** | **No** — memories are private to the account. Community and sharing were deferred post-MVP. |
| Does the app share the user's location with other users? | No |
| Does the app allow purchases? | No |
| Does the app contain ads? | No |

⚠️ **The user-interaction answer has a shelf life.** If sharing or community features ever ship, the
content rating must be redone — shipping social features under a rating that says "users do not
interact" is a policy violation, not a paperwork slip.

---

## 7. Demo account for the Google reviewer

The app requires sign-in, so Play Console's **App access** section needs working credentials.

Create a normal account through the app's own sign-up (do not reuse your own), then:
- Walk it through onboarding once, so the reviewer does not land on a blank first-run state.
- Start and complete one quest and save one memory, so there is something to look at.
- Put the email and password into **App access → All functionality is restricted**.

Do **not** use the `EXPO_PUBLIC_DEV_LOGIN_*` credentials for this. Those are stripped from production
builds on purpose (`app.config.ts`, verified 2026-08-29) and will not work in the build you upload.

---

## 8b. Which submit track to use

`eas.json` defines three submit profiles rather than one, because picking the wrong track is a
silent failure — the upload succeeds, it just does not count toward anything:

| Command | Play track | Use it for |
|---|---|---|
| `eas submit --profile internal` | Internal testing | Smoke-testing that the upload pipeline works at all. Up to 100 testers, no review wait. **Does not count toward the closed-testing requirement.** |
| `eas submit --profile closed` | Closed testing (`alpha`) | The 12-tester / 14-day requirement, *if* it applies to your account — see §9. |
| `eas submit --profile production` | Production | The actual public release. |

The earlier version of this config had a single profile pointing at `internal`, which would have
looked like the release path while quietly never starting the closed-test clock.

---

## 9. The 12-tester / 14-day rule — confirmed, and it applies

**Settled 2026-09-05.** This section used to say "do not treat this as settled" and told you to check
the console yourself. You did: the account was created and paid (`f6a4918`), it is a **personal**
account created after 13 November 2023, and **the rule applies.** The hedge is gone; plan around the
requirement, not around the uncertainty.

The requirement is a **closed test with at least 12 testers opted in and active for 14 continuous
days** before production access is granted. The mechanics are what actually bite, so they are worth
keeping in front of you:

- **"Opted in" means installed**, not invited. Each tester has to accept the invitation *and* install
  the build under the same Google account the invitation went to. Twelve email addresses in a list
  is worth zero days.
- **Dropping below twelve restarts the clock** — not pauses it. One person uninstalling on day nine
  costs you nine days.
- **Since 2026 Google also checks the testers actually used the app**, not merely that they opted in.
  Silent installs are no longer enough.
- **`eas submit --profile closed`** (Play track `alpha`) is the one that counts. `internal` does not
  start the clock — see §8b above, where that distinction is the whole reason the submit profiles
  are named separately.

**What this costs in practice:** round 1 had six people, so the group needs roughly doubling, and it
needs doubling *with Android users specifically*. Recruit ~20 for buffer rather than exactly 12 —
the reset rule makes a thin margin expensive. `docs/play-store-roadmap.md` → "Phase 3 — Testing"
tracks this step by step, and it is calendar time that nothing shortens.

**Start it the moment there is any build worth installing**, well before the redesign or the content
work is finished. The 14 days run in parallel with everything else; no engineering work in this
document is waiting on them.

> Worth knowing, not acting on: Apple's TestFlight has no equivalent of this rule — no minimum
> testers, no minimum duration. That asymmetry, and why it does *not* amount to a reason to switch
> stores, is worked through in `docs/app-store-option.md` (researched and parked, same day).

---

## 10. Store listing assets — status

| Asset | Status |
|---|---|
| App name, short description, full description | Drafted in `docs/store-listing-copy.md` |
| App icon (512×512 PNG for the listing) | Needs exporting from the real icon in `assets/images/icon.png` |
| Phone screenshots | Not made — depends on Pillar 2 |
| Feature graphic (1024×500) | Not made — depends on Pillar 2 |
| Tablet screenshots | **Not required.** Without them Play flags the app as "not optimised for tablets"; that is a label, not a blocker. |

Screenshots and the feature graphic can be swapped in the listing at any time **without a new app
review**, so they are the right work to do *during* the closed-test window rather than before it.
