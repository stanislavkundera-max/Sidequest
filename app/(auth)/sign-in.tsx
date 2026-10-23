import { isAuthError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AUTH_PLACEHOLDER, authStyles } from '@/components/auth/authStyles';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
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

const SKY = require('@/assets/images/dawn/signin-header.png');

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
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const { width } = useWindowDimensions();
  const skyHeight = Math.round((width * 250) / 390);

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

  // 12 · Confirm your e-mail (canvas screen 12).
  if (verifyEmail) {
    return (
      <DawnBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={useDifferentEmail}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={styles.round}>
                <Ionicons name="chevron-back" size={20} color={Theme.text} />
              </Pressable>
              <View style={styles.mailIcon}>
                <Ionicons name="mail-open-outline" size={42} color="#e0823d" />
              </View>
              <Text style={[styles.title, styles.centered]} accessibilityRole="header">
                Confirm your e-mail
              </Text>
              <Text style={[styles.sub, styles.centered]}>
                One last step: type the code we sent to <Text style={styles.strong}>{verifyEmail}</Text>.
              </Text>

              {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
              {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

              <Text style={styles.label}>Code from the e-mail</Text>
              <TextInput
                style={[styles.input, styles.inputCode, styles.codeBig]}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={AUTH_PLACEHOLDER}
              />

              <View style={styles.actions}>
                <PrimaryButton label="Confirm" loading={loading} onPress={() => void confirmCode()} />
              </View>

              <View style={styles.links}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send a new code"
                  onPress={() => void resendCode()}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.link}>No e-mail? Send a new code</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use a different e-mail address"
                  onPress={useDifferentEmail}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.linkBack}>Use a different e-mail</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="The e-mail has a link instead of a code"
                  onPress={signInAfterLink}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.linkQuiet}>The e-mail has a link, no code?</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </DawnBackground>
    );
  }

  function switchMode(next: 'signin' | 'signup') {
    if (next === mode) return;
    setFormError(null);
    setFormInfo(null);
    setMode(next);
  }

  // 11 · Sign in / create account (canvas screen 11): the dawn sky over the form.
  return (
    <DawnBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.signInScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.sky, { height: skyHeight }]}>
            <Image source={SKY} style={[styles.skyArt, { width, height: skyHeight }]} resizeMode="cover" accessible={false} />
            <SafeAreaView edges={['top']} style={styles.skyText}>
              <Text style={styles.wordmark}>SIDE QUEST LIFE</Text>
              <Text style={[styles.title, styles.skyTitle]} accessibilityRole="header">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </Text>
              <Text style={styles.skySub}>
                {mode === 'signin'
                  ? 'Sign in to continue your quests.'
                  : 'Create an account to save memories and progress.'}
              </Text>
            </SafeAreaView>
          </View>

          <View style={styles.form}>
            <View style={styles.segment} accessibilityRole="tablist">
              {(['signin', 'signup'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => switchMode(m)}
                  disabled={loading}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                  style={[styles.segmentItem, mode === m && styles.segmentItemOn]}>
                  <Text style={[styles.segmentText, mode === m && styles.segmentTextOn]}>
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
            {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

            {mode === 'signup' && formInfo ? (
              <Pressable onPress={() => switchMode('signin')} accessibilityRole="button" style={[styles.linkWrap, styles.alignStart]}>
                <Text style={styles.link}>Go to sign in</Text>
              </Pressable>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focused === 'email' && styles.inputFocused]}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="you@example.com"
              placeholderTextColor={AUTH_PLACEHOLDER}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focused === 'password' && styles.inputFocused]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              placeholderTextColor={AUTH_PLACEHOLDER}
            />

            {mode === 'signin' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset your password"
                onPress={() => router.push('/(auth)/forgot-password')}
                disabled={loading}
                style={[styles.linkWrap, styles.forgotWrap]}>
                <Text style={styles.link}>Forgot your password?</Text>
              </Pressable>
            ) : null}

            <View style={styles.actions}>
              <PrimaryButton
                label={mode === 'signin' ? 'Sign in' : 'Create account'}
                loading={loading}
                disabled={!configured}
                onPress={submit}
              />
            </View>

            {mode === 'signin' ? (
              <>
                <View style={styles.or}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.orLine} />
                </View>
                <SecondaryButton
                  icon="walk-outline"
                  chevron
                  label={guestLoading ? 'Starting…' : 'Continue without an account'}
                  onPress={() => void continueAsGuest()}
                  disabled={loading || guestLoading || !configured}
                />
                <Text style={[styles.footnote, styles.guestNote]}>
                  Without an account everything stays on this phone. You can create one later in Progress.
                </Text>
              </>
            ) : null}

            {!configured ? <Text style={styles.hint}>Configure Supabase env vars to enable sign-in.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DawnBackground>
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

const styles = {
  ...authStyles,
  ...StyleSheet.create({
    centered: { textAlign: 'center' },
    strong: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
    alignStart: { alignSelf: 'flex-start', marginTop: -6, marginBottom: 6 },
    mailIcon: {
      alignSelf: 'center',
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: 'rgba(224, 130, 61, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 28,
      marginBottom: 24,
    },
    codeBig: { height: 60, fontSize: 24, letterSpacing: 10, textAlign: 'center' },

    signInScroll: { flexGrow: 1, paddingBottom: 28 },
    sky: { width: '100%', overflow: 'hidden' },
    skyArt: { position: 'absolute', top: 0, left: 0 },
    skyText: { paddingHorizontal: 24 },
    wordmark: {
      marginTop: 20,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      fontWeight: '600',
      letterSpacing: 2.6,
      color: 'rgba(243, 242, 236, 0.85)',
    },
    skyTitle: { marginTop: 36, fontSize: 30, lineHeight: 36 },
    skySub: { marginTop: 6, fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(243, 242, 236, 0.88)' },
    form: { paddingHorizontal: 20, paddingTop: 22 },
    segment: {
      height: 48,
      borderRadius: 24,
      backgroundColor: Dawn.card,
      padding: 4,
      flexDirection: 'row',
      gap: 4,
      marginBottom: 22,
    },
    segmentItem: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    segmentItemOn: { backgroundColor: Dawn.cream },
    segmentText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
    segmentTextOn: { fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
    inputFocused: { borderColor: '#e0823d' },
    forgotWrap: { alignSelf: 'flex-end', marginTop: -6, paddingHorizontal: 0 },
    or: { marginTop: 22, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    orLine: { flex: 1, height: 1, backgroundColor: 'rgba(246, 234, 214, 0.3)' },
    orText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#bfb69c' },
    guestNote: { marginTop: 16, paddingHorizontal: 4 },
  }),
};
