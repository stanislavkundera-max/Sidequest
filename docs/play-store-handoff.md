# Play Store handoff — what only Standa can do, and the exact answers to give

Companion to `docs/launch-plan.md` Pillar 1. That doc explains *what* is required and why; this one
is the click-through sheet for the parts that need your account, your card, or your decision.

Every answer below was derived from the code on 2026-08-29, not from a template. Where an answer is
a judgment call rather than a fact, it says so.

---

## 1. Things blocked on you, in order

| # | Task | Why it is first / notes |
|---|---|---|
| 1 | **Create the Play Console account** ($25 one-time) | Identity verification runs for days on Google's side and blocks everything downstream. Start it before anything else. |
| 2 | **Expo account + `npx eas-cli login`** | Needed before `eas init` can link the project. Takes a minute; I cannot do it because it requires your password. |
| 3 | **Supabase: add `{{ .Token }}` to the reset-password email template** | See §2. Without it, password reset silently sends nothing. |
| 4 | **Fill the three privacy placeholders** | See §3. The policy cannot be published with brackets in it. |
| 5 | **Deploy the web export** | Play needs public URLs for the privacy policy and account deletion. `vercel.json` is already configured; the routes already exist. See §4. |
| 6 | **Run `supabase/analytics_pii_scrub.sql`** | Makes the deletion page's promises actually true. See §2b. |
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

## 2b. The one Supabase change the deletion page depends on

Run **`supabase/analytics_pii_scrub.sql`** in the SQL editor. It does two things:
updates `delete_own_account()` on the deployed database, and cleans up rows written before the fix.

Why it is not optional: `analytics_events.user_id` is `on delete set null`, which was assumed to
make a deleted user's rows anonymous. It did not. The `properties` jsonb was also receiving a
verbatim copy of the user's UUID and the free text they typed into quest feedback — and nothing
nulled those. A "deleted" account's rows stayed fully identifying.

`app/legal/delete-account.tsx` states in public that after deletion nothing you wrote survives and
the account reference cannot be traced back to you. **Until that script runs against the live
database, both statements are false** for anyone who ever submitted quest feedback. The app side is
already fixed; the deployed database is not.

The script ends with a verification query. Both counts must come back `0`.

---

## 3. The three placeholders that block publishing

Both legal screens ship with bracketed values that must be replaced:

| Placeholder | File | What is needed |
|---|---|---|
| `[contact email — confirm before publishing]` | `app/legal/privacy.tsx`, `app/legal/delete-account.tsx` (2 spots) | An address you will actually read. It goes in the Play listing too, so it becomes public. |
| `[Supabase project region — confirm before publishing]` | `app/legal/privacy.tsx` | Supabase dashboard → Project Settings → General. For GDPR it matters whether it is inside the EU. |
| Governing-law / legal entity | `app/legal/terms.tsx` | Whether you appear as a private individual in the Czech Republic or under an IČO. Same decision as the Play seller name. |

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

## 9. The 12-tester / 14-day rule — confirm before planning around it

Google's requirement is a **closed test with at least 12 testers opted in and active for 14
continuous days** before production access is granted. "Opted in" means they accepted the invite
*and* installed the build under a matching Google account; dropping below 12 restarts the clock.

**Do not treat this as settled for your account.** It has historically applied to *personal*
developer accounts created after 13 November 2023 and not to organization accounts, Google has
adjusted both the rule and its rollout more than once, and how it appears differs by region. It is
also possible your account is simply not asked for it.

Find out from your own Play Console rather than from any doc, including this one: once the account
is verified, the requirement (or its absence) is stated on the dashboard when you request production
access.

Plan for both outcomes, because the cost is lopsided:

- **If it applies**, it is the single longest pole in the launch — 14 days that run regardless of
  what else is happening, so start it the moment there is any build worth installing.
- **If it does not**, you have lost nothing by lining up testers: a real closed test before release
  is worth running on its own merits, and this is the same group round 2 would need anyway.

Either way the engineering work is identical, so nothing else in this document is waiting on the
answer.

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
