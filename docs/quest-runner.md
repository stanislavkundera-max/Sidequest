# Quest runner — guided steps, interactions, and evidence

The quest runner (`/quest/run/[id]`) is a **guided wizard**: users move one step at a time in catalog order, and each step carries an *interaction* that makes actually doing it easier than faking it ("smart friction").

Tapping an **active** quest opens the runner while journey steps are incomplete (`activeQuestResumePath`); after every step is done, the runner shows a wrap-up with an evidence summary.

## Step interactions (`QuestActionStep.interaction`)

| Kind | Gate | Evidence |
|---|---|---|
| `timer` | Step unlocks only after `minSeconds` of wall-clock time. `startedAt` persists in AsyncStorage (`questRunnerTimer.ts`), so locking the phone or leaving the app never pauses it. | `{ kind: 'timer', seconds }` |
| `input` | Written answer to a specific `prompt`, min length `minChars` (default 20). | `{ kind: 'text', text }` |
| `counter` | User names `count` items one by one (e.g. three sounds, five pieces of litter). | `{ kind: 'items', items }` |
| `photo` | Capture or pick a photo before the step completes. | `{ kind: 'photo', photoUri }` |
| `confirm` (or missing) | Two-tap honesty check ("Only confirm when you actually did it"). | `{ kind: 'self_attest' }` |

Interaction content lives in the TS catalog (`QUEST_JOURNEY_BY_ID`); `mergeCatalogStepTips` copies it onto DB-loaded steps by step id, so no reseed is needed.

- **`action.kind === 'calendar'`** (see `QuestStepAction`): unchanged. On **iOS/Android**, the runner creates a real calendar event (`expo-calendar`) and completes the step only when the event still exists on re-check. On **web**, self-attested confirmation.

## Wrap-up → memory

Evidence collected during the run (written answers, named items, the first photo) is composed into a **memory draft** (`memoryDraft.ts`) when the quest is wrapped up. `memory/new` consumes the draft and prefills title, body, and photo — the quest writes its own diary entry.

## Persistence

Canonical progress is **`user_quests.step_progress_v2`** (JSON: `completedAt` + `evidence`). The repository falls back to legacy `step_progress` when needed. Unknown evidence kinds degrade to `self_attest` on read so future kinds never un-complete a step.

## Future

Local notifications tied to calendar events remain a separate product decision; the evidence model does not assume push.
