# Progression and retention — #68

Opened 2026-10-26. **Status: open — Standa decides the mechanism.** Tasklist row:
[`round-2-tasklist.md` #68](feedback/round-2-tasklist.md). Where people actually drop off should
come from #67 (reading the analytics we already collect) before anything is built.

---

## Standa's proposal, verbatim (2026-10-26)

> V předchozím průzkumu trhu jsme si definovali tři hlavní směry existujících gamifikovaných aplikací:
> Hardcore RPG (Habitica, MainQuest): Přetvářejí život v doslovnou hru (avatari, loot, monstra). Ideální pro silnou externí motivaci a komplexní systémy (často ADHD uživatelé).
> Laskavá gamifikace (Finch): Zaměřeno na duševní zdraví (výchova zvířátka bez penalizace za neúspěch). Řeší úzkost z klasických to-do listů.
> Single-Mechanic / Odpor ke ztrátě (Forest): Soustředí se na jeden bod tření (závislost na telefonu). Využívá odpor ke ztrátě (když odejdeš z appky, uschne ti strom).
> My řešíme problém dlouhodobé retence a metahry – jak udržet lidi u aplikace měsíce, aniž by to popřelo naši anti-screen-time podstatu (tzn. nechci klasickou gamifikaci typu oblékání virtuálního avatara).
> Zatím jsme vymysleli tento třístupňový systém progrese postavený na reálném světě:
> Krátkodobá smyčka (Zen mód a Polaroidy): Během plnění úkolu se appka ztlumí (odpočet/kompas, nápis "teď žij"). Odměnou je samotný rituál uložení vzpomínky ve formě "polaroidu" (fotka + emoce).
> Střednědobá smyčka (Odborky a Pas): Za plnění tematických questů uživatel nesbírá virtuální zlaťáky, ale "razítka do pasu" nebo digitální nášivky (např. Lesní duch, Social Explorer), čímž si tvoří vitrínu reálných zkušeností.
> Dlouhodobá smyčka (Odemykání úrovní života): Získané XP neslouží k nákupu, ale k odemykání těžších, bizarnějších nebo exkluzivních sidequestů (knihovny nápadů na vyšších levelech). K tomu přidáme sezónní časově omezené questy (FOMO).

Then, after the first review: *"nemyslím si že samotné questy jsou dostatečné pro retencí —
chybí nám tam nějaký základní mechanismus. Red Bull by nebyl Red Bull kdyby nedělali marketing a
šlo jen o drink."* **Agreed: the quests alone are not a retention mechanism.** The review below
keeps the parts that fit and proposes the missing mechanism.

---

## Each part against what is already decided

| Part | Verdict | Why |
|---|---|---|
| "Anti-screen-time" framing | **Reword** | Mentor, 2026-08-06: the app pushes people to *do*, it does not compete with screen-time apps. Forest is that category — don't position against it. |
| Zen mode during a quest | **Keep** | The app stepping aside is fine. A compass, yes; a countdown only where time is part of the quest, never as pressure. No lock, nothing that "withers". |
| Polaroid (photo + feeling) | **Keep — strongest part** | Memory logging is the core of the app (AGENTS.md). Build first. |
| Passport stamps / patches | **Keep, with one rule** | Stamps appear as a record of logged memories. **No empty slots, no "3 of 10"** — showing what is missing turns a record into a collection to complete. Check overlap with Journey artifacts (`docs/journey-visual-style.md`) before designing. |
| XP and levels | **Out** | Decided 2026-08-06 ("duolingo styl dělat rozhodně nebudeme"); AGENTS.md lists points and levels. XP that buys nothing is still a currency — people start doing quests for the number. |
| XP unlocking harder quests | **Already exists, without XP** | Five open quests per category; a new one appears only when one is finished or dismissed (`openQuestsInCategory`). What is missing is *escalation* → quest chains below. |
| "Exclusive libraries" | **Move to monetization** | That is #58 (paid packs, one free on rotation), not progression. |
| Seasonal quests | **Keep — without FOMO** | The time limit comes from the real world (first snow, Perseids, a frozen pond), not a countdown. They return next year; the yearly 365-day horizon already does that. AGENTS.md rules out seasons as a mechanic. |

---

## The missing mechanism

The intended loop is **Action → Experience → Log → Visual progress → Identity**. Two pieces of it
are missing today, and they are what makes a loop bring people back:

1. **No regular trigger.** Nothing calls people back on a rhythm. The weekly nudge (#53) reaches
   only those who already drifted away; the daily question (#57) is for journaling, not quests.
2. **What people put in never pays back.** A saved memory goes into a list and never comes back
   to its owner. The value grows, but the app never shows it.

### Proposal: a weekly rhythm that pays back with memories

- **The week's side quest.** Once a week (Thursday evening, before the weekend — most quests are
  weekend-sized) one question: *what's this weekend's side quest?* Pick one in two taps. It
  **replaces** the drifter-only nudge rather than adding a second weekly notification, and follows
  the Quiet / Occasional / Chatty setting. A missed week has no consequence and nothing is counted.
- **The seal.** Finishing it ends in the polaroid ritual (photo + feeling) — the week is "sealed"
  into the passport as a stamp. The passport shows sealed weeks only, never empty ones.
- **Memories come back.** (a) A card in Memories on an anniversary — *"a year ago today"*,
  *"a month ago"*. (b) When a finished quest returns after its horizon, it comes back with the old
  polaroid: *"last time you did this: …"*. Both use data that already exists; OTA.
- **Escalation through quest chains.** A finished quest can unlock its harder sibling (cold shower
  → a swim in a pond → winter swimming). Earned by what was done, not by a number. Bungee is the
  ceiling for Adventure (content guidelines, rule 4).

### The Red Bull layer — the brand outside the app

Red Bull sells the world around the drink. For us that world is **what people carry out of the
app**: the Instagram-story card for a sealed quest (#55e), and once a year **"your year as a
map"** — every sealed week on one image, made to be shared. It is retention (a reason to keep
sealing weeks) and marketing at once, and it ties to the memory book (#58 D) later.

---

## To decide

1. The mechanism — the weekly rhythm above, or something else.
2. Build order. Suggested: memories coming back (OTA, data exists) → the week's side quest →
   passport → quest chains (needs content) → year map.
3. Whether XP/levels or FOMO should be reopened. Not recommended; the mechanism above works
   without them. If reopened, AGENTS.md "What not to build" changes first.
