import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { gradientStyle } from '@/components/ui/DawnBackground';
import { Dawn, Theme } from '@/constants/Theme';
import { plainErrorMessage } from '@/lib/userFacingError';
import { recordFeedbackSent } from '@/src/features/feedback/feedbackPrompt';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { sendAppFeedback } from '@/src/repositories/feedbackRepository';
import { useSessionStore } from '@/stores/session';

type Props = {
  visible: boolean;
  onClose: (outcome: 'sent' | 'dismissed') => void;
  /** Where it was opened from, for the analytics event. */
  source: 'settings' | 'prompt';
};

const CARD_BG = `radial-gradient(90% 60% at 100% 100%, rgba(240, 150, 120, 0.22) 0%, rgba(240, 150, 120, 0) 72%), linear-gradient(180deg, #4a4433 0%, #453f2f 100%)`;

/**
 * "Help me make this better for you" (redesign screen 39, task 60). Opened from Settings → Send
 * feedback, or now and then on its own (`FeedbackPromptHost`). Standa asked for the benefit up
 * front, in his own voice, so it reads as an invitation, not a nag. Sending from either place
 * stops the pop-up from asking again.
 *
 * Send stores the message straight away (`app_feedback`, read in the Supabase dashboard) with the
 * app version and platform. It used to open the phone's mail app, so people had to send it from
 * their own address (Standa, 1.1.0 phone test). Offline, the text stays and the sheet says so.
 */
export function FeedbackSheet({ visible, onClose, source }: Props) {
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [failure, setFailure] = useState<string | null>(null);

  // Each opening starts fresh; an unsent text is kept.
  useEffect(() => {
    if (!visible) return;
    setStatus('idle');
    setFailure(null);
  }, [visible]);

  async function send() {
    if (!userId || !text.trim() || status === 'sending') return;
    setStatus('sending');
    setFailure(null);
    try {
      await sendAppFeedback({ userId, message: text, source });
      trackEvent('feedback_sent', { sourceScreen: source }).catch(() => undefined);
      void recordFeedbackSent();
      setText('');
      setStatus('sent');
    } catch (e: unknown) {
      logError('feedback.send', e, { source });
      setFailure(plainErrorMessage(e, "That didn't go through. Try again in a moment."));
      setStatus('idle');
    }
  }

  function dismiss() {
    if (status === 'sent') {
      onClose('sent');
      return;
    }
    trackEvent('feedback_dismissed', { sourceScreen: source }).catch(() => undefined);
    onClose('dismissed');
  }

  const canSend = !!userId && !!text.trim() && status !== 'sending';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, gradientStyle(CARD_BG)]} accessibilityViewIsModal>
          <View style={styles.icon}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color={Dawn.primaryText} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {status === 'sent' ? 'Thank you' : 'Help me make this better for you'}
          </Text>
          {status === 'sent' ? (
            <>
              <Text style={styles.body} accessibilityLiveRegion="polite">
                It reached me. I read every message, and the next updates are built from them.
              </Text>
              <Text style={styles.signature}>— Standa</Text>
              <Pressable
                onPress={dismiss}
                accessibilityRole="button"
                style={({ pressed }) => [styles.send, pressed && styles.pressed]}>
                <Text style={styles.sendText}>Done</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.body}>
                What would make your side quests better? An idea, something that got in your way, a
                quest that missed. I read every message, and the next updates are built from them.
              </Text>
              <Text style={styles.signature}>— Standa, who makes Side Quest Life</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                maxLength={4000}
                editable={status !== 'sending'}
                textAlignVertical="top"
                placeholder="What would make it better for you?"
                placeholderTextColor={Theme.textMuted}
                style={styles.input}
                accessibilityLabel="Your feedback"
              />
              {failure ? (
                <Text style={styles.failure} accessibilityLiveRegion="polite">
                  {failure} Your text is still here.
                </Text>
              ) : null}
              <Pressable
                onPress={() => void send()}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend, busy: status === 'sending' }}
                style={({ pressed }) => [styles.send, !canSend && styles.disabled, pressed && styles.pressed]}>
                {status === 'sending' ? (
                  <ActivityIndicator color={Dawn.primaryText} />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </Pressable>
              <Pressable onPress={dismiss} accessibilityRole="button" style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}>
                <Text style={styles.notNowText}>Not now</Text>
              </Pressable>
            </>
          )}
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
  failure: { marginTop: 10, fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular', color: Theme.text },
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
