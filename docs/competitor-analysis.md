# Competitor analysis — SideQuest and how it grows

Standa's research for tasklist [#59](feedback/round-2-tasklist.md), 2026-11-02. Verbatim source:
[`feedback/competitor-analysis-2026-11-02-raw-notes.md`](feedback/competitor-analysis-2026-11-02-raw-notes.md)
— his findings and a Google Play growth strategy, never edited. This file is the triage: what to
remember, what fits the app's rules, and the tasks it proposes. **Added to the tasklist (Standa,
2026-11-02): C1–C6 as #69–#74, C9 as #75. The rest stay proposals here.**

The figures are his, read from public store pages and the developer's own posts on 2026-11-02;
"India-heavy" is his hypothesis from reviewer names.

---

## What to remember

**The competitor.** *SideQuest: Nearby Activities* on Google Play — 10K+ downloads, 4.6★ from 129
reviews, category Travel & Local. About 19 ratings on the US App Store, so it is Android-first,
probably India-heavy. The developer (Adhish Paranjothi, posting as "SideQuests HQ") claims 8,000+
organic downloads in the first month and 6,000+ people reached with 600+ quests. Built with
Lovable, Claude and Cloudflare — a one-person, AI-assisted team, like us. A second one, *Fyn: Daily
Challenges & Habits*, has the same concept and a paid tier, but only 100+ downloads.

**How it grew — the one finding that matters: through the store, not through social.**

- No TikTok or Instagram account, no press, no visible paid ads.
- The listing was renamed at least seven times — "Log Your Lore", "Real Experiences", "Discover
  Your City", "Fun Things To Do", "Find your adventure", "Things To Do", "Nearby Activities" — and
  moved from Lifestyle to Travel. It went from an abstract idea ("Strava for experiences") to
  phrases people actually type: *things to do, nearby activities, hidden gems*.
- The description is written like an SEO page, repeating those phrases.
- The only community work: build-in-public posts in r/SidequestsIRL asking for feedback.

**What the app does to keep people:** daily mini quests with streaks, a daily "Today's Mini Quest"
push, a "Lobby" feed of what others finish, Rooms (a host invites a group to a real-world game),
friend tagging (the tagged friend is notified and logs their own version). Screenshots sell on
emotion, anti-doomscrolling: *"Live more. Scroll less."*

**Where we stand against that.** Our listing has none of the searched phrases. The title is the
brand alone (15 of 30 characters); the short description is a feeling — *"Make your days worth
remembering — real-world side quests, one at a time"* — with "side quests" as its only search term.
Category Lifestyle. So the competitor's biggest lever is the one we have not touched.

**What we have that it does not:** memories as the core (photo + feeling, the cairn), a calm tone
with no streaks or guilt, and a name that is not just "SideQuest" in a field of 10+ apps of that
name plus SideQuestVR.

---

## Each idea against what is already decided

The second half of the source is a generic growth playbook. Most of it is store work that costs
nothing and breaks no rule; the retention and social parts run into decisions already made.

| Idea | Verdict | Why |
|---|---|---|
| Title with a keyword ("Side Quest Life: Things To Do", 29 chars) | **Fits** | BRANDING.md §1 already leaves room for a descriptor; the store name can change without touching the package |
| Short description with 2–3 search phrases | **Fits, needs a call** | Since 2026-10-23 it repeats the first screenshot's line. Both can be had — see C2 |
| Keyword-stuffed full description, "copy SideQuest's SEO structure" | **Middle way** | The mentor wanted a feeling, not a feature list (2026-10-17), and Play's metadata policy forbids excessive keyword repetition. Keep the feeling-first opening; add the phrases naturally further down |
| Move to Travel & Local | **Check, don't assume** | That category promises places near you; until #54 (quests that fit where you are) people would get something else and uninstall |
| Store Listing Experiments (A/B) | **Fits, later** | Free, but our traffic is small — a test needs enough visitors to say anything. After the rewrite |
| Custom listings per country | **Fits, later** | Only worth it with a translated app (C14) |
| Screenshot 1 "Stop scrolling. Start living." | **Out** | Anti-screen-time framing — the mentor ruled that out (2026-08-06); the Dawn screenshots sell a feeling instead |
| Promo video of a quest done in real life | **Fits** | Real-world action, not UI |
| An icon distinct from the SideQuest apps | **Fits** | Feeds the open logo question, BRANDING.md §4 |
| In-App Review after a positive moment | **Fits** | After a finished quest and saved memory — not "a streak hit / a level-up", which we don't have. Native library → build |
| Reply to every review within 48 h | **Fits** | No code |
| Streak with a "freeze" | **Out** | Decided 2026-08-06; AGENTS.md |
| One push a day | **Out** | "No endless notifications"; the weekly rhythm in #68 is the answer to the same question |
| Fast onboarding, sign-up later | **Already done** | Guest mode exists; #66 (first easy quest) is the rest of it |
| Shareable polaroid card for Stories | **Already planned** | #55e; the polaroid is also the core of #68 |
| Invite a friend to a quest by deep link | **Already planned** | #55b |
| Rooms, friend tagging with in-app notifications | **Out unless the rules change** | Multiplayer and in-app social (AGENTS.md "What not to build"), plus Google's UGC policy. The off-app half is #55b |
| Lobby feed of others' quests | **Out** | A social feed — AGENTS.md |
| Weekly community challenge with featured photos | **Half** | Featured photos are UGC → out. "Everyone gets the same quest this week" with no photos shown fits #68's week's side quest |
| TikTok / Reels "a sidequest every day for 30 days" | **Fits** | #35; show the action, not the UI. "Touch grass", "romanticize your life" are *doing* hooks; avoid "scroll less" |
| Reddit build-in-public | **Fits** | It is the one channel the competitor demonstrably uses |
| Micro-creators | **Later** | Costs money, and there is no premium tier to give away (#58 is a tip) |
| SEO website with quest-idea pages | **Fits, bigger** | The catalogue is the content; the web deploy exists. Not the app on web — a landing site |
| Product Hunt, Indie Hackers, BetaList | **Fits** | Prepare supporters first, never launch cold |
| Pick one angle | **Already have one** | Real-life quests + remembering what you lived. Stay put — the competitor's seven renames are the opposite lesson for the brand, not for the descriptor |
| Localize into 3–5 languages | **Fits, big** | UI + a catalogue that lives in two places (TS and Supabase) |
| Update every 2–3 weeks with "What's new" | **Partly** | OTA updates don't show "What's new" on Play — only builds do. A build is cheap, so bundle |
| Seasonal content + listing refresh | **Fits** | Seasonal quests without FOMO are already in #68; it is November — winter quests |
| Promotional Content (LiveOps) | **Check eligibility** | Play may not offer it to an app this size |
| Weekly numbers sheet | **Fits** | Joins #67: Play acquisition and conversion beside our own retention |

---

## Proposed tasks

Flat, one per line; each says where it would sit. C1–C3 go together as one ASO pass.

1. **→ #69** **C1 · Keyword research.** Type candidate phrases into Play search and write down the
   autocomplete — *things to do, bored, bucket list, side quests, adventure ideas, touch grass,
   real life game, weekend ideas, things to do with friends*. Check difficulty in a free tier
   (AppGoblin, AppTweak, Asodesk). Pick 5–8 core phrases. Standa's work, no code.
2. **→ #70** **C2 · Title and short description with keywords.** Title e.g. *Side Quest Life: Things To Do*
   (29). Short description keeping the feeling and adding the phrases, e.g. *Real-life side quests
   & fun things to do — make your days worth remembering* (75). Needs Standa's call: the short
   description no longer matches screenshot 1 word for word. Store only.
3. **→ #71** **C3 · Full description: same opening, keywords below.** Keep "WHAT IT FEELS LIKE" first, then
   sections that use the chosen phrases naturally 3–5 times each, within Play's metadata policy.
   `docs/store-listing-copy.md`, store only.
4. **→ #72** **C4 · Category: Lifestyle vs Travel & Local vs Entertainment.** Look at the top 50 of each for
   who we'd stand beside. Recommendation: stay in Lifestyle until #54 exists. Store only.
5. **→ #73** **C5 · Play In-App Review prompt.** After a finished quest *and* a saved memory, from the third
   such moment, never in the first days; Google decides if the card actually shows. Must not stack
   with the feedback pop-up (#60) on the same day. `expo-store-review` → **build**, lives on the
   native branch until the next one.
6. **→ #74** **C6 · Answer every Play review within 48 h.** A habit, no code.
7. **C7 · Promo video, 15–30 s.** A quest done in real life, the app seen briefly. YouTube link in
   the listing.
8. **C8 · Icon distinct from the SideQuest apps.** Put our icon beside theirs in Play search
   results and judge it at that size; feeds BRANDING.md §4.
9. **→ #75** **C9 · Reddit build-in-public.** r/SidequestsIRL, r/SideProject, r/AndroidApps: the Morocco
   story, ask for feedback, follow each subreddit's self-promotion rules. Standa's work.
10. **C10 · Short videos for #35.** "A side quest from the app every week" (not "every day" — our
    quests are mostly weekend-sized). The action, not the screen. Folds into
    `docs/instagram-strategy.md`, whose audience also needs fixing (the target segment memory).
11. **C11 · Weekly store numbers.** Play Console → acquisition (search vs explore vs external),
    store-listing conversion, rating, top search terms — one row a week, beside #67's retention.
    Needed to tell whether C1–C3 worked.
12. **C12 · Store Listing Experiment.** After C1–C3 and a few weeks of C11: one variable — first
    screenshot or short description — for at least 14 days.
13. **C13 · Seasonal refresh — winter.** Winter quests (#68's seasonal quests, no FOMO) plus the
    listing's promo text and one screenshot to match. Check whether Promotional Content is
    available to us.
14. **C14 · Localization — decide whether and which first.** Czech is the obvious first (Standa's
    own market, little competition). Cost: an i18n layer for the UI, translated catalogue in both
    sources, a translated listing. Needs Standa's decision; big.
15. **C15 · Landing site with quest-idea pages.** "Side quest ideas for a boring weekend",
    "…with friends", built from the catalogue, linking to Play. Bigger; after C1–C3.
16. **C16 · Product Hunt / Indie Hackers / BetaList.** With a list of supporters ready, after the
    redesign build is out. Standa's work.

Already in the tasklist and made more urgent by this: **#55e** (polaroid share card — the
competitor's "every share is an ad"), **#55b** (invite a friend to a quest), **#66** (first easy
quest), **#67** (reading the analytics).

Out, and why — so the same question isn't reopened: streaks and freezes, daily pushes, a feed of
others, Rooms and friend tagging inside the app, featured community photos, "scroll less"
framing, a keyword-stuffed description, renaming the brand.
