import { isAuthError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
import { UserFacingError } from '@/lib/userFacingError';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function SignInScreen() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);

  const [guestLoading, setGuestLoading] = useState(false);

  // A new account is confirmed with the code from the e-mail, typed here (task 39). The e-mail's
  // link went through the browser to the project's Site URL, which was never set — Supabase's
  // default `http://localhost:3000` — so every sign-up ended on an error page on the phone,
  // although the address was already confirmed by then. Set while that code is awaited.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const configured = isSupabaseConfigured();

  // The app already does this automatically on a cold start at "/" — see
  // app/index.tsx. But that only fires from that one entry point, so anyone
  // who reaches this screen directly (signed out, a deep link, a browser
  // refresh while on /sign-in) had no way back into an anonymous session at
  // all. This is that same call, reachable from here too.
  async function continueAsGuest() {
    if (!configured) {
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    setFormError(null);
    setFormInfo(null);
    setGuestLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
      }
      router.replace('/');
    } catch (e: unknown) {
      const message = formatAuthErrorForUi(e);
      logError('auth.continueAsGuest', e);
      setFormError(message);
      alertCompat("Couldn't continue", message);
    } finally {
      setGuestLoading(false);
    }
  }

  async function submit() {
    setFormError(null);
    setFormInfo(null);
    if (!configured) {
      setFormError(SUPABASE_CONFIGURE_HELP);
      alertCompat('Configuration', SUPABASE_CONFIGURE_HELP);
      return;
    }
    if (!email.trim() || !password) {
      const msg = 'Enter email and password.';
      setFormError(msg);
      alertCompat('Almost there', msg);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          router.replace('/');
          return;
        }
        // Supabase returns a "successful" empty-identities response instead of
        // an error when the email is already registered (to avoid leaking
        // which emails exist) — no new confirmation email is sent in that
        // case, so surfacing the generic "check your email" message here
        // would look identical to a working signup that quietly does nothing.
        if (data.user && data.user.identities?.length === 0) {
          setFormInfo(
            'This email is already registered. If you already confirmed it, sign in instead. If not, look in your inbox (including spam) for the e-mail we sent when you signed up.'
          );
        } else {
          setCode('');
          setVerifyEmail(email.trim());
          setFormInfo(codeSentMessage(email.trim()));
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
        }
        router.replace('/');
      }
    } catch (e: unknown) {
      const message = formatAuthErrorForUi(e);
      logError('auth.submit', e, { mode, emailProvided: Boolean(email.trim()) });
      setFormError(message);
      alertCompat(mode === 'signin' ? "Couldn't sign in" : "Couldn't create the account", message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode() {
    setFormError(null);
    setFormInfo(null);
    if (!verifyEmail) return;
    if (!code.trim()) {
      setFormError('Enter the code from the e-mail.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: verifyEmail,
        token: code.trim(),
        type: 'signup',
      });
      if (error) throw error;
      if (!data.session) {
        throw new UserFacingError('That code did not work. Send a new one and try again.');
      }
      setSession(data.session);
      router.replace('/');
    } catch (e: unknown) {
      logError('auth.signup.verify', e);
      setFormError(describeCodeError(e));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setFormError(null);
    setFormInfo(null);
    if (!verifyEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: verifyEmail });
      if (error) throw error;
      // A new code replaces the old one.
      setCode('');
      setFormInfo(`A new code is on its way to ${verifyEmail}. Check spam if it does not arrive.`);
    } catch (e: unknown) {
      logError('auth.signup.resend', e);
      setFormError(describeCodeError(e));
    } finally {
      setLoading(false);
    }
  }

  /** Back to the sign-up form — the typo case, where the code went to the wrong address. */
  function useDifferentEmail() {
    setVerifyEmail(null);
    setCode('');
    setFormError(null);
    setFormInfo(null);
  }

  /**
   * For an e-mail that still carries only the link (the Supabase template without the code): the
   * link confirms the address even though the page it lands on fails, so signing in then works.
   */
  function signInAfterLink() {
    setVerifyEmail(null);
    setCode('');
    setFormError(null);
    setFormInfo('Once you have tapped the link in the e-mail, sign in here with your password.');
    setMode('signin');
  }

  if (verifyEmail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inner}>
            <Text style={styles.title}>Confirm your e-mail</Text>
            <Text style={styles.sub}>One last step: type the code we sent you.</Text>

            {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
            {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

            <Text style={styles.label}>Code from the e-mail</Text>
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

            <PrimaryButton label="Confirm" loading={loading} onPress={() => void confirmCode()} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send a new code"
              onPress={() => void resendCode()}
              disabled={loading}
              style={styles.linkWrap}>
              <Text style={styles.switch}>No e-mail? Send a new code</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use a different e-mail address"
              onPress={useDifferentEmail}
              disabled={loading}
              style={styles.linkWrap}>
              <Text style={styles.switch}>Use a different e-mail</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="The e-mail has a link instead of a code"
              onPress={signInAfterLink}
              disabled={loading}
              style={styles.linkWrap}>
              <Text style={styles.guest}>The e-mail has a link, no code?</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'signin'
              ? 'Sign in to continue your quests.'
              : 'Create an account to save memories and progress.'}
          </Text>

          {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
          {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

          {mode === 'signup' && formInfo ? (
            <Pressable
              onPress={() => {
                setFormInfo(null);
                setMode('signin');
              }}
              style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Go to sign in</Text>
            </Pressable>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Theme.textMuted}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Theme.textMuted}
          />

          {mode === 'signin' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset your password"
              onPress={() => router.push('/(auth)/forgot-password')}
              disabled={loading}
              style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot your password?</Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            label={mode === 'signin' ? 'Sign in' : 'Sign up'}
            loading={loading}
            disabled={!configured}
            onPress={submit}
          />

          <Pressable
            onPress={() => {
              setFormError(null);
              setFormInfo(null);
              setMode(mode === 'signin' ? 'signup' : 'signin');
            }}
            disabled={loading}
            style={styles.switchWrap}>
            <Text style={styles.switch}>
              {mode === 'signin'
                ? 'Need an account? Sign up'
                : 'Have an account? Sign in'}
            </Text>
          </Pressable>

          {mode === 'signin' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue without an account"
              onPress={continueAsGuest}
              disabled={loading || guestLoading || !configured}
              style={styles.guestWrap}>
              <Text style={styles.guest}>
                {guestLoading ? 'Starting…' : 'Continue without an account'}
              </Text>
            </Pressable>
          ) : null}

          {!configured ? (
            <Text style={styles.hint}>
              Configure Supabase env vars to enable sign-in.
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function codeSentMessage(address: string): string {
  return `Account created. We sent a code to ${address} — type it below to finish. Check spam if it does not arrive within a few minutes.`;
}

/** What went wrong with a sign-up code, in words someone can act on. */
function describeCodeError(e: unknown): string {
  const code = isAuthError(e) ? e.code : undefined;
  const message = e instanceof Error ? e.message : '';
  if (code === 'otp_expired' || /expired or is invalid/i.test(message)) {
    return 'That code did not work. Check it, or send a new one.';
  }
  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return 'Too many e-mails in a short time. Wait a few minutes, then try again.';
  }
  return formatAuthErrorForUi(e);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  flex: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 24, justifyContent: 'center' },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    color: Theme.textMuted,
    marginBottom: 16,
  },
  bannerError: {
    backgroundColor: Theme.dangerSoft,
    color: Theme.danger,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  bannerInfo: {
    backgroundColor: Theme.accentSoft,
    color: Theme.accent,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Theme.text,
    backgroundColor: Theme.surface,
    marginBottom: 16,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryBtnText: { color: Theme.accent, fontWeight: '600', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  forgotWrap: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  forgot: { color: Theme.accent, fontSize: 14, fontFamily: 'Inter_400Regular' },
  switchWrap: { marginTop: 20, alignItems: 'center' },
  linkWrap: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  switch: { color: Theme.accent, fontSize: 15, fontFamily: 'Inter_400Regular' },
  guestWrap: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  guest: { color: Theme.textMuted, fontSize: 14, fontFamily: 'Inter_400Regular' },
  hint: {
    marginTop: 24,
    textAlign: 'center',
    color: Theme.danger,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
