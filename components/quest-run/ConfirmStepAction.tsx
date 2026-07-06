import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { alertTwoChoice } from '@/lib/alertCompat';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/** Fallback confirm step with the calm honesty check. */
export function ConfirmStepAction({ busy, onComplete }: Props) {
  function confirm() {
    alertTwoChoice(
      'Step done?',
      'Only confirm when you have actually finished what this step describes.',
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
      <Text style={styles.helper}>
        No proof needed here — just your word. Take your time, then confirm.
      </Text>
      <PrimaryButton label="Mark step done" loading={busy} onPress={confirm} />
    </View>
  );
}
