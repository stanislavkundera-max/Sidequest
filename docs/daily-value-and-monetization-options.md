# #57 and #58 — options for Standa to decide

Prepared 2026-10-17 from the mentor session ([raw notes](feedback/mentor-2026-10-17-raw-notes.md))
and tasklist #57 / #58. **Decided 2026-10-17 (Standa): #57 → A + E (E waits on a location, #54a); #58 → C to start.** The rest is kept below for later. Each option: what the person sees, how it
sits with the app's rules, what it costs. A recommendation closes each half.

The rules every option is checked against (AGENTS.md and the mentor's settled positions):

- **Rule #1 — doing, never giving up.** It pushes people off the phone and out of the house, not
  toward screen-time restriction.
- **No reward loops.** No streaks, points, coins, levels; no guilt copy ("you missed a day").
- **No endless notifications.** The weekly nudge (#53) is the ceiling; a daily push is out.
- **No texting in the app; no ads.**

---

## #57 — something that helps people every day ⭐

Standa: *"vymyslet věc, která by lidem mohla pomáhat i přes to, že by aplikaci otvírali každý
den."* The test for every option: **would someone be better off for having opened the app today,
even if they did not start a quest?** And it must still send them outwards.

Where it would live, for all options: a **"Today" card at the top of the map** (Explore), the
screen the app opens on. It changes once a day. No notification, no counter, no "you did it 4 days
running". Opening the app tomorrow simply shows something new.

### A. A daily journaling prompt, for paper and pen

One question a day, to answer *away from the screen*: "Write down three things you noticed on the
way home." "What did you do today that you would like to remember in a year?" The card says so:
"Take a pen — this one is for paper."

- **Helps:** a small daily habit of noticing, which is the app's whole idea in miniature. The
  mentor's own suggestion.
- **Rules:** fits #1 well — it is literally off the phone. Nothing to track.
- **Cost:** small. The card (OTA) and ~90 prompts that rotate (a constant, or a table via SQL so
  they can grow without an update). Writing them is content work (#34) — with
  `docs/quest-content-guidelines.md` in front of us.
- **Open:** offer to save the answer as a memory too, or leave it on paper on purpose?

### B. A micro-action for today (5–15 minutes, outside)

A tiny real-world thing for today, not a quest: "Eat lunch outside." "Take a street you have never
walked on the way home." "Stand somewhere high for five minutes before sunset." This is what the
competitor sends as "Today's Mini Quest" every morning (#53) — ours would wait in the app instead
of pushing.

- **Helps:** a doable push every single day, also on days with no time for a quest.
- **Rules:** fits #1. Risk: Standa's own bar for quests ("walk a new street" is *super nuda* for
  Adventure). These are deliberately *not* quests — no tracking, no completion — so they do not
  water the catalogue down, but they must still be concrete and a little more than trivial.
- **Cost:** small for the card; ~100 micro-actions to write (content).

### C. Your next tiny step

If a quest is in motion, today's card shows **one small action that moves it forward**: "Look up
the sunrise time for Saturday", "Message Tom to ask if he is in", "Pack the head torch tonight".
Taken from the quest's own next step, or a short "prepare" line written per step.

- **Helps:** big quests fail in the planning gap; this closes it a little each day. The most
  directly useful option for someone already in a quest.
- **Rules:** fits #1 and the quest flow. No new tracking — it points at the existing step.
- **Cost:** small with the existing next-step label; medium if every step gets a written
  "prepare" line (content). Only for people with a quest in motion — needs A or B for everyone else.

### D. "On this day" — a memory comes back

When there is one, a memory from a week, a month or a year ago: the photo and the first line, "A
year ago today — Swim in wild water you had to walk to reach."

- **Helps:** the positioning line — *"a map of a life you actually lived"* — made visible. The
  slow-dopamine payoff the app is built around.
- **Rules:** fits; nothing to do, so it is a companion to A–C, not a replacement.
- **Cost:** small — memories already have dates and photos. Only works once someone has memories.

### E. "Good light today"

The day's sunset time and daylight left after work, with one suggestion to use it: "Sunset 18:12
— 40 minutes of light after work. The bench in the park?"

- **Helps:** turns "it's getting dark early" into a concrete window.
- **Rules:** fits #1.
- **Cost:** medium to large. Needs the person's location — the city chosen by hand (ties to #54a)
  or GPS (#54b, an AAB and a privacy-policy change). Sunrise and sunset can be computed on the
  phone, no weather service needed; weather itself would need one.

### Recommendation for #57

**One "Today" card that picks the most useful thing for this person:**
**C** if a quest is in motion (the next tiny step) — otherwise **A or B** on alternating days —
and **D** underneath on the days a memory comes back. All OTA; content is the work: ~90 prompts
(A) and ~100 micro-actions (B), written in one pass against the content guidelines. E later, once
#54a gives a city.

**Decide:** which of A–E; for A, paper only or also save as a memory; who writes the prompts and
micro-actions (Claude drafts against the guidelines, Standa edits — or the other way round).

---

## #58 — monetization

The mentor's model: a meditation app with **six paid archetypes, one of them free every other
week**. Standa wants to build monetization (2026-10-17).

Fixed constraints:

- **No ads** (mentor, settled). No coins or points.
- **The core stays free:** the map, the four places, the five open quests per place, memories.
  Paying must never buy a way around "the rest is earned" (#48) — that rule is the game.
- **Google Play Billing** for anything digital bought in the app. Google's service fee: **15 %**
  on the first USD 1M a year, also 15 % on subscriptions (*from memory — check Play Console's
  current fee page before pricing*).
- **Technically, for every in-app option:** a billing library — `react-native-iap`, `expo-iap`, or
  **RevenueCat** (`react-native-purchases`), which also checks purchases on its servers so we write
  none of that — means an **AAB**. Plus a payments profile in Play Console (merchant account, tax
  details), the Data safety form, prices per country, and a table of what each account owns.

### A. Quest packs, one free on rotation (the mentor's model)

Themed packs of ~8–10 quests beyond the free catalogue: *Mountains*, *Water*, *Winter*, *City at
night*, *Travel alone*, *With your partner*. Bought once each (one-time purchase, owned for good).
**One pack is free for everyone every other week**, rotating — what the mentor described. A
bought pack's quests sit in their place on the map like any other, under the same five-at-a-time
rule.

- **Rules:** fits — content is the product; nothing about the core changes. The rotation gives
  everyone a taste without pressure.
- **Cost:** AAB + billing; a `pack` field on quests and an "owns" check in the offer logic; the
  rotation is a date rule. **Content is the real cost** — each pack is 8–10 quests to the full
  standard (#34).
- **Price thought:** one pack the price of a coffee; "all packs" as one bigger purchase.

### B. A subscription — "Side Quest Life+"

Monthly or yearly: every pack (A), and extras that cost us something to make — e.g. the yearly
memory book as a PDF, more "Today" content (#57).

- **Rules:** acceptable if it never touches the core or the five-quest rule. Risk: subscriptions
  push toward retention tricks, which this app avoids.
- **Cost:** as A, plus subscription handling (renewals, grace periods — RevenueCat does most).
  Steadier income than A; harder to sell before there is much content.

### C. "Support the app" — pay what you want

A one-off tip (three price points), unlocking nothing, or a small thank-you (a different map
marker style). Honest, matches the founder story.

- **Rules:** fits perfectly. Still Play Billing (a digital in-app purchase).
- **Cost:** the smallest — AAB + billing, no content. Income usually small.

### D. A printed memory book

Once a year, your memories — photos and words — as a printed book, "the map of a life you
actually lived" on paper.

- **Rules:** fits the positioning better than anything else here.
- **Cost:** physical goods may be sold **outside** Play Billing (*Play policy allows it for
  physical products — confirm the current wording*), via a print-on-demand service and a web
  checkout. Medium build (export + ordering), an operational side (delivery, refunds). Only works
  for people with a year of memories.

### E. Partners for big quests

Quests like *Leave the ground* or *Jump off something high* link to vetted operators; a
commission per booking. Ties to #22 (prices shown on quests).

- **Rules:** fits if it stays useful ("here is a licensed operator near you"), not advertising.
  The mentor ruled out ads — this needs his view.
- **Cost:** business development more than code; real services are outside Play Billing.

### Recommendation for #58

**Start with A** — it is the mentor's model, it keeps the core free, and it gives #34 (more
quests) a purpose. Build it **with RevenueCat** to avoid writing purchase verification ourselves.
Add **C** in the same build: no content needed, and it gives early supporters a way in. Keep **D**
for when users have a year of memories; ask the mentor about **E**.

**Decide:** which of A–E; for A, the first 2–3 pack themes and who writes them; one-time packs or
a subscription (B); price points; and whether the next AAB (build 12) should wait for billing or
go out first with R8 as planned (recommended: build 12 first — billing is weeks of work, content
included).
