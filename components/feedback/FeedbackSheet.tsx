import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { gradientStyle } from '@/components/ui/DawnBackground';
import { LEGAL_CONTACT_EMAIL } from '@/constants/legal';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { trackEvent } from '@/src/lib/analytics';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Where it was opened from, for the analytics event. */
  source: 'settings' | 'prompt';
};

const CARD_BG = `radial-gradient(90% 60% at 100% 100%, rgba(240, 150, 120, 0.22) 0%, rgba(240, 150, 120, 0) 72%), linear-gradient(180deg, #4a4433 0%, #453f2f 100%)`;

/**
 * "Help me make this better for you" (redesign screen 39, task 60). Opened from Settings → Send
 * feedback; the occasional prompt that opens it on its own is task 60's later half. Standa asked
 * for the benefit up front, in his own voice, so it reads as an invitation, not a nag.
 *
 * Send hands the text to the phone's mail app, addressed to the app's inbox with the version and
 * platform added — no server needed, so it ships over the air. If no mail app opens, the address
 * is shown so the words are not lost.
 */
export function FeedbackSheet({ visible, onClose, source }: Props) {
  const [text, setText] = useState('');

  async function send() {
    const version = Constants.expoConfig?.version ?? 'unknown';
    const body = `${text.trim()}\n\n—\nSide Quest Life ${version} · ${Platform.OS} ${String(Platform.Version)}`;
    const url = `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent('Side Quest Life feedback')}&body=${encodeURIComponent(body)}`;
    trackEvent('feedback_sent', { sourceScreen: source }).catch(() => undefined);
    try {
      await Linking.openURL(url);
      setText('');
      onClose();
    } catch {
      alertCompat('No mail app opened', `Write to ${LEGAL_CONTACT_EMAIL} — your text is still here.`);
    }
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, gradientStyle(CARD_BG)]} accessibilityViewIsModal>
          <View style={styles.icon}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color={Dawn.primaryText} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Help me make this better for you
          </Text>
          <Text style={styles.body}>
            What would make your side quests better? An idea, something that got in your way, a quest
            that missed. I read every message, and the next updates are built from them.
          </Text>
          <Text style={styles.signature}>— Standa, who makes Side Quest Life</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            placeholder="What would make it better for you?"
            placeholderTextColor={Theme.textMuted}
            style={styles.input}
            accessibilityLabel="Your feedback"
          />
          <Pressable
            onPress={() => void send()}
            disabled={!text.trim()}
            accessibilityRole="button"
            accessibilityState={{ disabled: !text.trim() }}
            style={({ pressed }) => [styles.send, !text.trim() && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={16} color={Theme.accent} />
            <Text style={styles.footerText}>
              Anytime later: <Text style={styles.footerStrong}>Progress → Settings → Send feedback</Text>.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(24, 22, 14, 0.62)' },
  card: {
    backgroundColor: '#4a4433',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(240, 178, 122, 0.45)',
    padding: 20,
    boxShadow: '0 24px 60px rgba(10, 9, 5, 0.55)',
  },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.accent, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 16, fontSize: 24, lineHeight: 29, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  body: { marginTop: 8, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  signature: { marginTop: 10, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Dawn.secondaryText },
  input: {
    marginTop: 16,
    height: 108,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 234, 214, 0.4)',
    backgroundColor: Dawn.card,
    color: Theme.text,
    padding: 12,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
  },
  send: { marginTop: 14, minHeight: 52, borderRadius: 26, backgroundColor: Dawn.primaryFill, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
  notNow: { marginTop: 4, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  notNowText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 234, 214, 0.16)',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  footerStrong: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
