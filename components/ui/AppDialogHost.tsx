import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { useDialogStore, type AppDialogButton } from '@/stores/dialog';

/**
 * Renders the message dialogs raised through `alertCompat` / `alertTwoChoice`, in the app's
 * own look instead of the system alert box. Mounted once, in the root layout.
 */
export function AppDialogHost() {
  const dialog = useDialogStore((s) => s.queue[0]);
  const dismiss = useDialogStore((s) => s.dismiss);
  if (!dialog) return null;

  // Close first, then run the handler — a handler may raise the next dialog.
  const press = (button: AppDialogButton | undefined) => {
    dismiss(dialog.id);
    button?.onPress?.();
  };
  const wayOut = dialog.buttons.find((b) => b.kind === 'secondary') ?? dialog.buttons[0];

  return (
    <Modal
      key={dialog.id}
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => press(wayOut)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.body}>{dialog.message}</Text> : null}
          <View style={styles.actions}>
            {dialog.buttons.map((button) => {
              const primary = button.kind === 'primary';
              return (
                <Pressable
                  key={button.text}
                  accessibilityRole="button"
                  onPress={() => press(button)}
                  style={({ pressed }) => [
                    styles.button,
                    primary ? styles.buttonPrimary : styles.buttonSecondary,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={primary ? styles.buttonPrimaryText : styles.buttonSecondaryText}>
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: Theme.textMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  button: {
    borderRadius: 999,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: Theme.accent },
  buttonSecondary: { borderWidth: 1, borderColor: Theme.border, backgroundColor: Theme.surface },
  buttonPrimaryText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  buttonSecondaryText: {
    color: Theme.text,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
});
