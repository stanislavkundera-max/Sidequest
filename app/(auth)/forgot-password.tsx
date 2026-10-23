import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AUTH_PLACEHOLDER, authStyles } from '@/components/auth/authStyles';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { formatAuthErrorForUi } from '@/lib/authErrors';
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_CONFIGURE_HELP,
} from '@/lib/supabase';
import { UserFacingError } from '@/lib/userFacingError';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

/**
 * Password recovery, by emailed one-time code rather than by emailed link.
 *
 * The link flow would need deep-link handling this app does not have: the
 * Supabase client is created with `detectSessionInUrl: false` and nothing in
 * the codebase imports `expo-linking`. A code the user types works identically
 * on web and native with no linking infrastructure at all, which matters most
 * during the Play closed test — a tester locked out of their account is a
 * tester who stops being active, and the 14-day clock restarts.
 *
 * REQUIRES a one-time Supabase dashboard change: Authentication → Emails →
 * "Reset password" template must include the `{{ .Token }}` variable. The
 * default template only has `{{ .ConfirmationURL }}`, and with that template
 * no code is ever sent. See docs/play-store-handoff.md.
 */

/**
 * Client-side floor. Supabase enforces its own minimum server-side (6 by
 * default); this is deliberately stricter so a too-short password fails as a
 * clear inline message instead of a raw API error. Note the sign-up screen
 * currently has no length rule at all — worth aligning, but a separate change.
 */
const MIN_PASSWORD_LENGTH = 8;

type Phase = 'request' | 'verify';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);

  /**
   * Whether the code has already been exchanged for a session.
   *
   * A recovery code is single-use. If `verifyOtp` succeeds but the
   * `updateUser` after it fails — a server-side password rule stricter than
   * ours, or the network dropping between the two calls — the code is spent
   * even though the password never changed. Re-running `verifyOtp` on retry
   * would then fail with "Token has expired or is invalid", which is both
   * wrong and unrecoverable: the user is in fact already authenticated and
   * only the second call needs repeating.
   *
   * A ref rather than state because the retry reads it inside the same
   * callback that sets it, where a state update would not have landed yet.
   */
  const verifiedRef = useRef(false);

  const configured = isSupabaseConfigured();

  function guardConfigured(): boolean {
    if (configured) return true;
    setFormError(SUPABASE_CONFIGURE_HELP);
    alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
    return false;
  }

  async function sendCode(resend: boolean) {
    setFormError(null);
    setFormInfo(null);
    if (!guardConfigured()) return;
    if (!email.trim()) {
      setFormError('Enter the email address you signed up with.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      // A newly issued code supersedes any earlier one, so a previous
      // verification no longer counts.
      verifiedRef.current = false;
      setPhase('verify');
      // Supabase answers the same way whether or not the address is
      // registered, so nothing here can promise an email is actually coming.
      setFormInfo(
        resend
          ? 'If that address has an account, a new code is on its way.'
          : 'If that address has an account, we sent it a 6-digit code. Enter it below along with your new password. Check spam if it does not arrive.'
      );
    } catch (e: unknown) {
      const message = formatAuthErrorForUi(e);
      logError('auth.resetPasswordForEmail', e, { resend });
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword() {
    setFormError(null);
    setFormInfo(null);
    if (!guardConfigured()) return;
    if (!code.trim()) {
      setFormError('Enter the code from the email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(
        'Use at least ' + MIN_PASSWORD_LENGTH + ' characters for the new password.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setFormError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // The code exchanges for a real session; without it the `updateUser`
      // call below has no authenticated user to act on. Skipped on a retry
      // where the exchange already succeeded — see `verifiedRef`.
      if (!verifiedRef.current) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'recovery',
        });
        if (error) throw error;
        if (!data.session) {
          throw new UserFacingError('That code did not work. Request a new one and try again.');
        }
        verifiedRef.current = true;
        setSession(data.session);
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      verifiedRef.current = false;
      alertCompat('Password changed', 'You are signed in with your new password.');
      router.replace('/');
    } catch (e: unknown) {
      const message = formatAuthErrorForUi(e);
      logError('auth.resetPassword.verify', e, {
        emailProvided: Boolean(email.trim()),
      });
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Back to phase 1 with everything cleared.
   *
   * Without this the screen is a trap: `resetPasswordForEmail` succeeds even
   * for an address that has no account (Supabase will not reveal which
   * addresses exist), so a typo advances to phase 2 exactly like a correct
   * address would — and phase 2 locks the email field. "Send another" would
   * only re-send to the same wrong address.
   */
  function useDifferentEmail() {
    verifiedRef.current = false;
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
    setFormInfo(null);
    setPhase('request');
  }

  /**
   * Navigates to sign-in explicitly rather than popping history.
   *
   * `router.back()` is wrong here and `canGoBack()` does not rescue it. This
   * route is public and exported as its own page, so it gets opened cold — from
   * a bookmark, a pasted link, a reload. On web, `canGoBack()` also answers
   * true for history that came from *outside* the app, so `back()` can walk to
   * `/`, which auto-signs-in anonymously and lands on onboarding. Measured:
   * both the plain `back()` and the `canGoBack()`-guarded version put the user
   * on /onboarding from a directly-loaded page.
   *
   * The label promises one specific destination, so the code names that
   * destination instead of guessing from history.
   */
  function backToSignIn() {
    router.replace('/(auth)/sign-in');
  }

  // 13 · Reset your password (canvas screen 13).
  return (
    <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
            <Pressable
              onPress={backToSignIn}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              style={styles.round}>
              <Ionicons name="chevron-back" size={20} color={Theme.text} />
            </Pressable>
            <Text style={[styles.title, styles.titleGap]} accessibilityRole="header">
              Reset your password
            </Text>
            <Text style={styles.sub}>
              {phase === 'request'
                ? 'We will email you a short code to confirm it is you.'
                : 'Enter the code we emailed you, then pick a new password.'}
            </Text>

            {/* Two steps: the e-mail, then the code and the new password. */}
            <View style={styles.steps} accessibilityLabel={`Step ${phase === 'request' ? 1 : 2} of 2`}>
              <View style={styles.step}>
                <View style={[styles.stepDot, phase === 'verify' ? styles.stepDotDone : styles.stepDotOn]}>
                  {phase === 'verify' ? (
                    <Ionicons name="checkmark" size={13} color={Dawn.primaryText} />
                  ) : (
                    <Text style={styles.stepNum}>1</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, phase === 'request' && styles.stepLabelOn]}>Email</Text>
              </View>
              <View style={[styles.stepLine, phase === 'verify' && styles.stepLineOn]} />
              <View style={styles.step}>
                <View style={[styles.stepDot, phase === 'verify' && styles.stepDotOn]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={[styles.stepLabel, phase === 'verify' && styles.stepLabelOn]}>New password</Text>
              </View>
            </View>

            {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
            {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

            {phase === 'request' ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={AUTH_PLACEHOLDER}
                />
              </>
            ) : (
              <>
                <View style={styles.sentTo}>
                  <Ionicons name="mail-outline" size={18} color={Theme.textMuted} />
                  <Text style={styles.sentToText} numberOfLines={1}>
                    {email.trim()}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Start over with a different email address"
                    onPress={useDifferentEmail}
                    disabled={loading}
                    hitSlop={12}>
                    <Text style={styles.link}>Change</Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>Code from the email</Text>
                <TextInput
                  style={[styles.input, styles.inputCode]}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  placeholderTextColor={AUTH_PLACEHOLDER}
                />

                <Text style={styles.label}>New password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={'At least ' + MIN_PASSWORD_LENGTH + ' characters'}
                  placeholderTextColor={AUTH_PLACEHOLDER}
                />

                <Text style={styles.label}>Repeat new password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={AUTH_PLACEHOLDER}
                />
              </>
            )}

            <View style={styles.actions}>
              <PrimaryButton
                label={phase === 'request' ? 'Send me a code' : 'Set new password'}
                loading={loading}
                disabled={!configured}
                onPress={phase === 'request' ? () => sendCode(false) : submitNewPassword}
              />
            </View>

            <View style={styles.links}>
              {phase === 'verify' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send a new code"
                  onPress={() => sendCode(true)}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.link}>Didn&apos;t get a code? Send another</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                onPress={backToSignIn}
                disabled={loading}
                style={styles.linkWrap}>
                <Text style={styles.linkBack}>Back to sign in</Text>
              </Pressable>
            </View>

            {!configured ? <Text style={styles.hint}>Configure Supabase env vars to enable this.</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DawnBackground>
  );
}

const styles = {
  ...authStyles,
  ...StyleSheet.create({
    titleGap: { marginTop: 20 },
    steps: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: 'rgba(246, 234, 214, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotOn: { borderColor: '#e0823d' },
    stepDotDone: { borderColor: '#e0823d', backgroundColor: '#e0823d' },
    stepNum: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
    stepLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#d9d1ba' },
    stepLabelOn: { color: Theme.text },
    stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(246, 234, 214, 0.25)' },
    stepLineOn: { backgroundColor: '#e0823d' },
    sentTo: {
      height: 52,
      borderRadius: 16,
      backgroundColor: 'rgba(243, 242, 236, 0.05)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    sentToText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#e6dfca' },
  }),
};
