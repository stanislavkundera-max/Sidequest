# Closed test — what to send the twelve, and what breaks it

The Play requirement is not "twelve people tried it". It is **twelve testers opted in continuously
for fourteen days**. Everything below exists because that sentence has three traps in it, and none of
them are about the app.

Written 2026-09-06, while Google's identity verification runs.

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
steps, and the fourteen days.

> Ahoj, dodělal jsem appku a potřebuju ji dostat na Google Play. Google mě nepustí dál, dokud ji
> aspoň 12 lidí nebude mít nainstalovanou 14 dní v kuse — takže od tebe potřebuju hlavně to, abys ji
> nainstaloval a nechal si ji tam. Nic víc.
>
> Potřebuju vědět **e-mail, pod kterým máš přihlášený Google na Androidu** — bez toho tě systém
> nepustí. Pak ti pošlu dva odkazy: první tě přidá do skupiny, druhý ti appku odemkne na Google Play.
> Musíš projít oba, jinak se to nepočítá.
>
> Co s tím dělat: otevři si to párkrát za ten týden, zkus si dát nějaký quest a splnit ho. Klidně mi
> napiš, co ti přijde blbě — čím upřímněji, tím líp. A hlavně to prosím **neodinstalovávej**, ani
> když tě to přestane bavit. Kdyby nás kleslo pod 12, začíná těch 14 dní znova od nuly.
>
> Dík. Až to projde, dostaneš to normálně z obchodu jako každá jiná appka.

Send the two links separately, after they reply with the address. Sending them upfront to people who
have not confirmed an Android Google account is how half a group ends up half-joined.

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
