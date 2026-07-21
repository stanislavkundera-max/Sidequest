import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { alertTwoChoice } from '@/lib/alertCompat';
import {
  clearStepTimer,
  elapsedSeconds,
  formatTimerClock,
  readStepTimerStart,
  startStepTimer,
} from '@/src/features/quests/questRunnerTimer';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  userQuestId: string;
  stepId: string;
  minSeconds: number;
  runningHint?: string;
  accent: string;
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/**
 * Hard-gated step timer: the step unlocks only after `minSeconds` of real
 * wall-clock time. `startedAt` persists, so locking the phone or leaving the
 * app does not pause it.
 */
export function TimerStepAction({
  userQuestId,
  stepId,
  minSeconds,
  runningHint,
  accent,
  busy,
  onComplete,
}: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    void readStepTimerStart(userQuestId, stepId).then((ts) => {
      if (!alive) return;
      setStartedAt(ts);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [userQuestId, stepId]);

  const running = startedAt != null;
  const elapsed = running ? elapsedSeconds(startedAt, now) : 0;
  const remaining = Math.max(0, minSeconds - elapsed);
  const reached = running && remaining === 0;

  useEffect(() => {
    if (!running || reached) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running, reached]);

  async function begin() {
    const ts = await startStepTimer(userQuestId, stepId);
    setNow(Date.now());
    setStartedAt(ts);
  }

  function finish() {
    onComplete({ kind: 'timer', seconds: elapsed });
    void clearStepTimer(userQuestId, stepId);
  }

  function requestReset() {
    alertTwoChoice(
      'Reset this timer?',
      'The time you have logged so far will be lost and the timer starts over from zero.',
      {
        cancel: { text: 'Keep going' },
        confirm: {
          text: 'Reset timer',
          onPress: () => {
            void clearStepTimer(userQuestId, stepId).then(() => {
              setStartedAt(null);
            });
          },
        },
      }
    );
  }

  if (!hydrated) return null;

  if (!running) {
    return (
      <View style={styles.block}>
        <Text style={styles.helper}>
          This step takes at least {formatTimerClock(minSeconds)}. Start the timer when you begin
          for real — it keeps running even if you lock your phone.
        </Text>
        <PrimaryButton label="Start the timer" loading={busy} onPress={() => void begin()} />
      </View>
    );
  }

  const progress = Math.min(1, minSeconds === 0 ? 1 : elapsed / minSeconds);

  return (
    <View style={styles.block}>
      <Text style={styles.clock}>
        {reached ? formatTimerClock(elapsed) : formatTimerClock(remaining)}
      </Text>
      <Text style={styles.clockCaption}>{reached ? 'Done — nice pace' : 'remaining'}</Text>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { backgroundColor: accent, width: `${progress * 100}%` }]}
        />
      </View>
      {!reached && runningHint ? <Text style={styles.helper}>{runningHint}</Text> : null}
      <PrimaryButton
        label={reached ? 'Finish this step' : `Unlocks in ${formatTimerClock(remaining)}`}
        disabled={!reached}
        loading={busy}
        onPress={finish}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset this timer"
        disabled={busy}
        onPress={requestReset}
        style={({ pressed }) => [
          styles.timerResetLink,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}>
        <Text style={styles.timerResetLinkText}>Reset timer</Text>
      </Pressable>
    </View>
  );
}
