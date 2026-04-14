import { Alert, Platform } from 'react-native';

/** Simple alert that works on web (`window.alert`) and native (`Alert.alert`). */
export function alertCompat(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Two-option dialog. On web uses `confirm` (OK/Cancel only); button labels are not customizable in the browser dialog.
 */
export function alertTwoChoice(
  title: string,
  message: string,
  choices: {
    cancel: { text: string };
    confirm: { text: string; onPress: () => void };
  }
): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) choices.confirm.onPress();
    return;
  }
  Alert.alert(title, message, [
    { text: choices.cancel.text, style: 'cancel' },
    { text: choices.confirm.text, onPress: choices.confirm.onPress },
  ]);
}
