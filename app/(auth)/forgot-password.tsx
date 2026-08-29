import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { alertCompat } from '@/lib/alertCompat';
import { formatAuthErrorForUi } from '@/lib/authErrors';
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_CONFIGURE_HELP,
} from '@/lib/supabase';
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
      // call below has no authenticated user to act on.
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error('That code did not work. Request a new one and try again.');
      }
      setSession(data.session);

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.sub}>
            {phase === 'request'
              ? 'We will email you a short code to confirm it is you.'
              : 'Enter the code we emailed you, then pick a new password.'}
          </Text>

          {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
          {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, phase === 'verify' && styles.inputLocked]}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={phase === 'request' && !loading}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Theme.textMuted}
          />

          {phase === 'verify' ? (
            <>
              <Text style={styles.label}>Code from the email</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={Theme.textMuted}
              />

              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                placeholder={'At least ' + MIN_PASSWORD_LENGTH + ' characters'}
                placeholderTextColor={Theme.textMuted}
              />

              <Text style={styles.label}>Repeat new password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Theme.textMuted}
              />
            </>
          ) : null}

          <PrimaryButton
            label={phase === 'request' ? 'Send me a code' : 'Set new password'}
            loading={loading}
            disabled={!configured}
            onPress={phase === 'request' ? () => sendCode(false) : submitNewPassword}
          />

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
            onPress={() => router.back()}
            disabled={loading}
            style={styles.linkWrap}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>

          {!configured ? (
            <Text style={styles.hint}>
              Configure Supabase env vars to enable this.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  flex: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '600', color: Theme.text, marginBottom: 8 },
  sub: { fontSize: 16, lineHeight: 24, color: Theme.textMuted, marginBottom: 16 },
  bannerError: {
    backgroundColor: Theme.dangerSoft,
    color: Theme.danger,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  bannerInfo: {
    backgroundColor: Theme.accentSoft,
    color: Theme.accent,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: Theme.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.surface,
    marginBottom: 16,
  },
  inputLocked: { opacity: 0.6 },
  linkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    marginTop: 8,
  },
  link: { color: Theme.accent, fontSize: 15 },
  hint: { marginTop: 24, textAlign: 'center', color: Theme.danger, fontSize: 14 },
});
