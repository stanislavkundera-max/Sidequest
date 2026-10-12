import { useDialogStore } from '@/stores/dialog';

/** One-button message in the app's own dialog (see `stores/dialog.ts`), native and web alike. */
export function alertCompat(title: string, message: string): void {
  useDialogStore.getState().show({
    title,
    message,
    buttons: [{ text: 'OK', kind: 'primary' }],
  });
}

/** Two-option dialog: `cancel` is the quiet way out (also Android back), `confirm` the filled button. */
export function alertTwoChoice(
  title: string,
  message: string,
  choices: {
    cancel: { text: string; onPress?: () => void };
    confirm: { text: string; onPress: () => void };
  }
): void {
  useDialogStore.getState().show({
    title,
    message,
    buttons: [
      { text: choices.cancel.text, onPress: choices.cancel.onPress, kind: 'secondary' },
      { text: choices.confirm.text, onPress: choices.confirm.onPress, kind: 'primary' },
    ],
  });
}
