# Closed test — what to send the twelve, and what breaks it

The Play requirement is not "twelve people tried it". It is **twelve testers opted in continuously
for fourteen days**. Everything below exists because that sentence has three traps in it, and none of
them are about the app.

Written 2026-09-06, while Google's identity verification runs. Task list added 2026-09-14 once the
group existed and build 9 was uploaded — see below for what is done and what is left.

---

## Standa's task list

**Done:**
- [x] Google Group created — `side-quest-life-testers@googlegroups.com`
- [x] `versionCode 9` (commit `ba1c29e`) built and uploaded to the Closed testing draft

**Left, in order:**

1. **Widen the release's countries/regions to "all"**, not the 4 currently selected — a tester whose
   Play account is set to a country outside that list cannot install at all. Fix this before
   submitting; changing it later still works but means chasing down whoever got blocked.
2. **Set the Google Group to let people join themselves.** On `groups.google.com` → the group →
   Settings → who can join. Otherwise every tester has to be added by hand one at a time.
3. **Submit the release** ("Odeslat 14 změn ke kontrole"). This is Google's review of the *release*,
   not the app-content review — it is usually fast, but budget a day.
4. **Once the track is live, copy the opt-in link** from the Closed testing page ("Jak se testeři do
   testu mohou zapojit" — the URL appears there once published). Paste it into the message below
   before sending it.
5. **Send the message below to everyone**, and collect who replies with their Google account email
   if you're adding them individually rather than relying on open group join.
6. **Check daily for the first few days, then every few days**: Play Console → the closed track's
   tester count, to confirm people actually *installed*, not just joined the group. Accepting the
   group invite is not opting in.
7. **Start a running note the moment the first feedback arrives** — who said what, roughly when, what
   you did about it. The production-access application later asks you to summarise this, and Google
   weighs whether you *acted* on it, not just collected it. Check Play Console → Monitor and improve →
   Ratings and reviews → Testing feedback too — some testers leave feedback there without telling you.
8. **Watch the tester count, not just the calendar.** If it drops below 12 opted-in, the 14-day clock
   restarts from zero. This is the single most expensive thing that can go wrong here.
9. **After 12+ have been opted in continuously for 14 days**: Play Console dashboard → "Apply for
   production" → answer the three sections (about the test, about the app, about production
   readiness) using the running note from step 7.

---

## The three traps

**1. Opting in is two steps, and people stop after the first.**
Joining the Google Group is not opting in. A tester must join the group *and* open the opt-in link
*and* install from Play, under the same Google account. Someone who accepts the invitation and never
installs counts for nothing, and Play Console will show them as a tester anyway.

**2. The clock restarts if the count drops below twelve.**
Not "pauses" — restarts. One person uninstalling on day 11 costs the whole group eleven days. This is
the single most expensive thing that can go wrong, and it is invisible unless you check.

**3. Fourteen days is the floor, not the target.**
Recruit around twenty. Eight spare people is not caution, it is the difference between one attempt
and three.

---

## The message to send

Czech, because the testers are. Adjust freely — the parts that matter are the Google account, the two
links, and the fourteen days.

**Fill in `[ODKAZ NA SKUPINU]` and `[OPT-IN ODKAZ]` before sending** — the group link only works once
the group allows self-join (task 2 above), and the opt-in link only exists once the release is live
(task 4 above). Don't send this until both are real.

> Ahoj, dodělal jsem appku a potřebuju ji dostat na Google Play. Google mě nepustí dál, dokud ji
> aspoň 12 lidí nebude mít nainstalovanou 14 dní v kuse — takže od tebe potřebuju hlavně to, abys ji
> nainstaloval a nechal si ji tam. Nic víc.
>
> Musíš projít **dva kroky**, jinak se to Google počítat nebude:
>
> 1. Přidej se do skupiny: [ODKAZ NA SKUPINU]
> 2. Pak klikni na tohle a nainstaluj appku přes Play: [OPT-IN ODKAZ]
>
> Oboje dělej na telefonu s Androidem, přihlášený stejným Google účtem, přes který appku nainstaluješ.
>
> Co s tím dělat: otevři si to párkrát za ten týden, zkus si dát nějaký quest a splnit ho. Klidně mi
> napiš, co ti přijde blbě — čím upřímněji, tím líp. A hlavně to prosím **neodinstalovávej**, ani
> když tě to přestane bavit. Kdyby nás kleslo pod 12, začíná těch 14 dní znova od nuly.
>
> Dík. Až to projde, dostaneš to normálně z obchodu jako každá jiná appka.

Send it to everyone at once once both links are real — the self-join group means there is no email
to collect first. The remaining risk is people clicking the group link and stopping there: joining
the group is not opting in, and Play Console will list them as a tester either way, so check the
actual install count (task 6 above), not the group's member count.

---

## What to ask them to actually do

Keep this short in the message itself — a long list reads like homework and gets skipped. The honest
minimum, in priority order:

1. **Open it a few times across the fortnight.** Not daily. Whether someone comes back on their own
   is the real signal, and nagging destroys it.
2. **Start one quest and finish it.** The whole product is the loop from picking to finishing to the
   memory it leaves. Someone who never completes one has not seen the app.
3. **Say the first thing they disliked.** First reactions are the ones that decay — after a week
   people rationalise the friction away.

Do not ask for structured bug reports. Round 1 showed the useful material comes as offhand remarks,
so make it easy to send one sentence.

---

## What only you can check, and when

| When | Check |
|---|---|
| Before inviting | The opt-in page has a feedback email — `sidequestlifeapp@gmail.com`. It is a required field and testers cannot leave public Play reviews instead |
| Day 1–2 | Play Console → the closed track's tester count. Confirm each person **installed**, not just accepted |
| Every few days | The count is still ≥ 12. This is the only thing that can silently reset the clock |
| Day 14 | Publishing overview → Production → Request production access, and answer the questionnaire about how the test went |

---

## What the testers will and will not see

Worth knowing before someone reports it as a bug:

- **They land straight in, no sign-up.** The app creates an anonymous session on first launch. Some
  will ask whether they were supposed to register; they were not.
- **Five quests per category, and no way to see the rest.** That is deliberate — finishing one brings
  the next. Expect at least one person to call it a bug.
- **No notifications at all.** The setting that used to suggest otherwise was hidden on 2026-09-06,
  precisely so nobody spends their feedback on it.
- **The catalogue can grow mid-test.** Quests live in Supabase, so new ones reach testers without a
  new build. Fixes to the app itself do need one.

---

## Three things Google's own page adds — added 2026-09-11

From the official "App testing requirements for new personal developer accounts",
read after the brief above was written. Two of these are easy to lose by simply
not knowing about them.

### 1. You have to summarise the feedback when you apply

> *"You must summarize your testing feedback when applying for production
> access."*

The production application has three parts — about your closed test, about your
app, about your production readiness — and one of them asks what testers said.
**So the record has to be kept from day one.** Arriving at day 14 with twelve
opted-in testers and nothing written down means either reconstructing it from
memory or waiting longer.

Keep a running note as feedback arrives: who said it, roughly when, what they
meant, and what you did about it. This pairs with the standing habit of keeping
raw tester notes verbatim rather than only a triaged summary — round 1 already
proved the raw version is worth re-reading later.

Google also weighs whether you *acted* on feedback, not only whether you
collected it: fixing what testers hit "increases the likelihood of a successful
production access application".

### 2. Testers can leave private feedback inside Play

Play Console → Monitor and improve → Ratings and reviews → **Testing feedback**.
Filterable by date, version and device, and searchable. Worth checking alongside
whatever arrives by message, because some people will use it without mentioning
they did — and it never touches the public rating.

### 3. Internal testing does not wait for app setup

> *"Before completing your app setup, you can quickly distribute builds to a
> small group of trusted testers."*

This settles a question that was open in the roadmap. Internal testing works
**before** the setup checklist is finished; closed testing does not — *"you can
start a closed test after completing your app setup."*

So the order is: put the build in front of a couple of people on the internal
track today, finish the setup checklist, then open the closed test and start the
fourteen days. Internal testing still counts for nothing toward the twelve — but
it costs nothing and finds the embarrassing things first.

Worth running the **pre-launch report** at the same time (Play Console installs
the build on real devices and reports crashes and performance issues); it finds
a different class of problem than people do.
