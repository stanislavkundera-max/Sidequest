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

  const configured = isSupabaseConfigured();

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
      alertCompat('Missing fields', msg);
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
            'This email is already registered. If you already confirmed it, sign in instead. If not, check your inbox (including spam) for the original confirmation link.'
          );
        } else {
          setFormInfo(
            'Account created. Confirm your email via the link Supabase sent you, then sign in. (In Supabase: disable "Confirm email" for immediate access after sign-up.)'
          );
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
      alertCompat('Auth error', message);
    } finally {
      setLoading(false);
    }
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  flex: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 24, justifyContent: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
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
  label: {
    fontSize: 13,
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
  secondaryBtnText: { color: Theme.accent, fontWeight: '600', fontSize: 15 },
  forgotWrap: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  forgot: { color: Theme.accent, fontSize: 14 },
  switchWrap: { marginTop: 20, alignItems: 'center' },
  switch: { color: Theme.accent, fontSize: 15 },
  hint: {
    marginTop: 24,
    textAlign: 'center',
    color: Theme.danger,
    fontSize: 14,
  },
});
