import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { useDialogStore, type AppDialogButton } from '@/stores/dialog';

/** The sunrise over the hills, for the finished-quest dialog (screen 29). */
const SUNRISE = require('@/assets/images/dawn/journey-header.png');

/**
 * Renders the message dialogs raised through `alertCompat` / `alertTwoChoice`, in the app's
 * own look instead of the system alert box. Mounted once, in the root layout.
 *
 * Dawn (canvas screens 29 and 36): one style for every dialog — a warm card on a dimmed
 * screen, the main choice a full-width cream button, the way out a quiet text button under it.
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
  // Main choice first, the way out underneath — the order a thumb reaches them.
  const ordered = [...dialog.buttons].sort((a, b) => Number(b.kind === 'primary') - Number(a.kind === 'primary'));
  const questDone = dialog.art === 'questDone';

  return (
    <Modal
      key={dialog.id}
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => press(wayOut)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, questDone && styles.cardArt]} accessibilityRole="alert">
          {questDone ? (
            <View style={styles.art} accessible={false}>
              <Image source={SUNRISE} style={styles.artImage} resizeMode="cover" />
              {/* Your cairn on the hill, the new stone on top — orange everywhere in Dawn. */}
              <View style={styles.cairn}>
                <View style={[styles.stone, { width: 12, height: 8 }]} />
                <View style={[styles.stone, { width: 19, height: 9, marginLeft: -2 }]} />
                <View style={[styles.stone, { width: 26, height: 10, marginLeft: 2 }]} />
                <View style={[styles.stone, { width: 33, height: 12 }]} />
              </View>
            </View>
          ) : null}
          <View style={questDone ? styles.inner : null}>
            {dialog.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dialog.badge}</Text>
              </View>
            ) : null}
            <Text style={[styles.title, questDone && styles.centered]}>{dialog.title}</Text>
            {dialog.message ? (
              <View style={[styles.messageRow, questDone && styles.messageRowCentered]}>
                {questDone ? <Ionicons name="checkmark" size={16} color="#7cc2a8" /> : null}
                <Text style={[styles.body, questDone && styles.centered]}>{dialog.message}</Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              {ordered.map((button) => {
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 22, 14, 0.62)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: '#4a4433',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.28)',
    padding: 22,
    boxShadow: '0 24px 60px rgba(10, 9, 5, 0.5)',
  },
  cardArt: { padding: 0, overflow: 'hidden', borderColor: 'rgba(240, 178, 122, 0.5)' },
  art: { height: 170, overflow: 'hidden' },
  artImage: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 210 },
  cairn: { position: 'absolute', left: 64, bottom: 22, alignItems: 'center', gap: 1 },
  stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
  inner: { padding: 22, paddingTop: 18, alignItems: 'stretch' },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#e0823d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.3, color: Theme.onAccent },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 8,
  },
  centered: { textAlign: 'center' },
  messageRow: { flexDirection: 'row', gap: 6 },
  messageRowCentered: { justifyContent: 'center', alignItems: 'center' },
  body: {
    flexShrink: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: '#e6dfca',
  },
  actions: {
    gap: 6,
    marginTop: 20,
  },
  button: {
    borderRadius: 999,
    minHeight: MIN_TOUCH_TARGET + 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: Dawn.primaryFill },
  buttonSecondary: { backgroundColor: 'transparent' },
  buttonPrimaryText: { color: Dawn.primaryText, fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  buttonSecondaryText: {
    color: Theme.text,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
});
