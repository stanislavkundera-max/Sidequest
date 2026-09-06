# Instagram — what to post, and what each third is for

Standa's split, 2026-09-06: roughly **a third green notes and fun facts**, not just the app. This
document turns that into something you can batch, and says what the other two thirds are — because a
third only means something once the whole is defined.

Written while Google's verification runs, so the batching can happen before there is anything to
launch.

---

## The three thirds, and why they are different jobs

| | Third | Job | Works for someone who has never heard of the app |
|---|---|---|---|
| **A** | Green notes — research, facts | **Reach.** Saveable, shareable, true on its own | Yes |
| **B** | The quests themselves | **Conversion.** Shows what the thing actually is | Partly |
| **C** | Building it, and why | **Trust.** A person, not a brand account | Yes |

The reason to keep them roughly equal is not balance for its own sake. **A** is the only one
strangers share, **B** is the only one that explains the product, and **C** is the only one that
makes either believable from an account with no users yet. Drop any one and the other two stop
working: facts with no product is a quote account, product with no facts is an ad, and both without
a person behind them is a brand nobody has a reason to trust.

---

## A — Green notes

**The source material already exists and is already checked.** `docs/value-proposition.md` holds six
real studies, researched 2026-08-21, each with its sample size and — this is the useful part —
whether it is correlational or an actual experiment. `components/progress/ScienceNote.tsx` ships the
three strongest inside the app.

Six studies is not six posts. It is closer to twenty, because each one has several angles:

- **The headline number.** "Two hours a week outside." That is White et al., 2019 — ~20,000 people.
- **The detail that surprises.** It does not have to be one trip. Six twenty-minute walks count the
  same as one long one. Most people assume the opposite.
- **The mechanism.** A 90-minute walk in nature measurably quiets the part of the brain tied to
  rumination (Bratman et al., 2015) — and the urban walk of the same length did not.
- **The uncomfortable one.** We spend about 47% of waking hours thinking about something other than
  what we are doing, and that predicts unhappiness better than the activity itself does
  (Killingsworth & Gilbert, 2010).
- **The nuance that saves it from being preachy.** In the follow-up work, minds wandering toward
  something *interesting* lifted mood instead. Autopilot is the problem; curiosity is not. This one
  is the whole product in a sentence.

### The rule that protects this pillar

**Never post a claim stronger than the study.** The citation list already flags where this is a live
risk — Twenge & Campbell, 2018 is correlational and other researchers have publicly contested the
causal spin the coverage gave it. "Screen time is associated with lower curiosity in teenagers" is
true and postable. "Screens make kids less curious" is not, and one person in the comments who knows
the literature can cost more credibility than the post earns.

Cite the name and the year on the image. It costs a line and it is the difference between a fact
account and a quote account.

---

## B — The quests

Forty-one exist. Each one is a post that needs no design work beyond the card: the title *is* the
hook, because they were written that way.

- "Walk up in the dark and be at the top for sunrise."
- "Take the next train out, wherever it is going."
- "Sleep outside with nothing over your face."
- "Sign up for something you are not ready for."

The strong format is the quest as an invitation rather than a feature demo — the title, one line of
the description, no screenshot. A screenshot says "here is an app". The quest alone says "here is
something you could do this weekend", and that is the thing worth being known for.

Keep app-screenshot posts to a minority of this third. They convert people already interested and
bore everyone else.

---

## C — Building it

The material is in `docs/story.md`, and it has one gap worth closing before posting: the breaking
point is still marked as a placeholder — the actual turning point is not written up. That is
probably the single strongest piece of content available, and it cannot be posted until it is
written.

What else is genuinely postable here:

- Shipping alone, without pretending it is a company. The account being a person is the asset.
- The Play Store's 12-testers-for-14-days gate — widely resented by indie developers and almost
  unknown outside them. Both a story and a recruiting post.
- Decisions with a reason: why quests are limited to five at a time, why there are no streaks, why
  there is no notification setting. The *reasons* are the interesting part.

---

## The voice constraint that decides what not to post

`AGENTS.md` is explicit and it has been reinforced repeatedly: this app **pushes people to do
things, it never restricts**. It is not a screen-time blocker, not a focus app, and gamification was
decided against rather than shelved.

That rules out a large, easy, well-performing genre — the "delete Instagram, reclaim your attention,
here is your screen time" post. It performs, it is adjacent, and posting it from this account would
recruit exactly the wrong audience: people who want to be stopped, on a product built to start
something. And it would be doing it *on Instagram*, which makes it hollow anyway.

The honest version of that theme is pillar A's nuance: autopilot is the problem, and the answer is
somewhere to go, not something to block.

---

## What to batch now, and what to wait for

**Now, and safe from the redesign:**

- The green notes. Text and facts, not screens — nothing in pillar A changes when the UI does.
- The written-up breaking point from `docs/story.md`.
- Quest-as-invitation posts, if the design is typographic rather than screenshot-based.

**Wait:**

- Anything built on screenshots. The typography changed on 2026-09-06 and the redesign pillar is
  still open — every screenshot taken now is a screenshot to retake.
- Launch and download posts, obviously.

**The account itself: register the handle now.** Names go, and it costs nothing.

**One thing worth being honest about:** the launch is not gated on an audience. It is gated on twelve
Android testers and Google's verification. Instagram does not shorten either. Batch content because
the waiting time is free, not because it is the critical path — see `docs/closed-test-brief.md` for
what actually is.
