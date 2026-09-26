import { View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { alertTwoChoice } from '@/lib/alertCompat';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/**
 * Confirm step. Just the button and the one honesty dialog on tap.
 *
 * It used to carry a sentence above the button too ("No proof needed here — just
 * your word…"), repeated verbatim on all 58 confirm steps, so the same reassurance
 * was said three times per step (sentence, button, dialog). Standa, 2026-09-26:
 * it spoils the feel of the app and people understand without it.
 */
export function ConfirmStepAction({ busy, onComplete }: Props) {
  function confirm() {
    alertTwoChoice(
      'Step done?',
      'Only tap this once you have really done it.',
      {
        cancel: { text: 'Not yet' },
        confirm: {
          text: 'I did this',
          onPress: () => onComplete({ kind: 'self_attest' }),
        },
      }
    );
  }

  return (
    <View style={styles.block}>
      <PrimaryButton label="Mark step done" loading={busy} onPress={confirm} />
    </View>
  );
}
