import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import {
  addEmailToGuestAccount,
  confirmGuestEmailWithCode,
  describeAccountSaveError,
  refreshGuestAccount,
  resendGuestAccountEmail,
  setAccountPassword,
} from '@/src/repositories/accountRepository';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

/** Same floor as password reset (forgot-password.tsx). */
const MIN_PASSWORD_LENGTH = 8;

type Phase = 'email' | 'confirm';

/**
 * Create an account from the guest one — keeping everything (see accountRepository).
 *
 * Two screens' worth in one: first the e-mail, then — once the confirmation e-mail is there —
 * the code from it (or its link, tapped in the browser) and a password. Someone who left half-way
 * and comes back finds their pending e-mail already filled in.
 */
export default function SaveAccountScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const pendingEmail = user?.is_anonymous ? (user.new_email ?? null) : null;

  const [phase, setPhase] = useState<Phase>(pendingEmail ? 'confirm' : 'email');
  const [email, setEmail] = useState(pendingEmail ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(
    pendingEmail ? confirmInstructions(pendingEmail) : null
  );

  /**
   * The e-mail is confirmed. A code works once, so if setting the password fails after it (a
   * dropped connection, a server-side password rule), a retry must only set the password.
   */
  const confirmedRef = useRef(false);

  // Decided once, on arrival: confirming the e-mail below turns this very session into an account,
  // and the password step must stay on screen until it is done.
  const [openedAsAccount] = useState(() => Boolean(user && !user.is_anonymous));

  if (openedAsAccount && user) {
    // Already an account — someone came back here after finishing.
    return (
      <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.inner}>
          <MiniCairn />
          <Text style={[styles.title, styles.doneTitle]}>You have an account</Text>
          <Text style={styles.sub}>
            {user.email
              ? `Sign in with ${user.email} on any phone. Everything you have done is in it.`
              : 'Everything you have done is saved in it.'}
          </Text>
          <PrimaryButton label="Done" onPress={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
      </DawnBackground>
    );
  }

  async function sendEmail(resend: boolean) {
    setFormError(null);
    setFormInfo(null);
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setFormError('Enter the e-mail address you want to sign in with.');
      return;
    }
    setLoading(true);
    try {
      if (resend) await resendGuestAccountEmail(address);
      else await addEmailToGuestAccount(address);
      confirmedRef.current = false;
      setPhase('confirm');
      setFormInfo(confirmInstructions(address));
    } catch (e: unknown) {
      logError('account.save.sendEmail', e, { resend });
      setFormError(describeAccountSaveError(e));
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    setFormError(null);
    setFormInfo(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (!confirmedRef.current) {
        if (code.trim()) {
          await confirmGuestEmailWithCode(email, code);
        } else if (!(await refreshGuestAccount())) {
          setFormError(
            'Your e-mail is not confirmed yet. Type the code from the e-mail, or tap its link first, then come back here.'
          );
          return;
        }
        confirmedRef.current = true;
      }
      await setAccountPassword(password);
      alertCompat(
        'Your account is saved',
        `Sign in with ${email.trim()} on any phone. Everything you did as a guest is in it.`
      );
      router.back();
    } catch (e: unknown) {
      logError('account.save.finish', e, { confirmed: confirmedRef.current });
      setFormError(describeAccountSaveError(e));
    } finally {
      setLoading(false);
    }
  }

  function useDifferentEmail() {
    confirmedRef.current = false;
    setCode('');
    setFormError(null);
    setFormInfo(null);
    setPhase('email');
  }

  // 14 · Keep everything (canvas screen 14): turning the guest into an account.
  return (
    <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
            <View style={styles.keepCard}>
              <MiniCairn />
              <View style={styles.keepText}>
                <Text style={styles.keepTitle} accessibilityRole="header">
                  Keep everything you have done
                </Text>
                <Text style={styles.keepBody}>
                  {phase === 'email'
                    ? 'Your quests, memories and photos stay exactly as they are — this only adds an e-mail and a password, so you can sign in again, on this phone or a new one.'
                    : 'Almost there. Confirm your e-mail, then choose a password.'}
                </Text>
              </View>
            </View>

            {formError ? <Text style={styles.bannerError}>{formError}</Text> : null}
            {formInfo ? <Text style={styles.bannerInfo}>{formInfo}</Text> : null}

            {phase === 'email' ? (
              <>
                <Text style={styles.label}>E-mail</Text>
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
                <Text style={styles.label}>Code from the e-mail (if it has one)</Text>
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

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  placeholderTextColor={AUTH_PLACEHOLDER}
                />

                <Text style={styles.label}>Repeat password</Text>
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
                label={phase === 'email' ? 'Send confirmation e-mail' : 'Save my account'}
                loading={loading}
                onPress={phase === 'email' ? () => void sendEmail(false) : () => void finish()}
              />
            </View>

            {phase === 'confirm' ? (
              <View style={styles.links}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send the confirmation e-mail again"
                  onPress={() => void sendEmail(true)}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.link}>No e-mail? Send it again</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use a different e-mail address"
                  onPress={useDifferentEmail}
                  disabled={loading}
                  style={styles.linkWrap}>
                  <Text style={styles.linkBack}>Use a different e-mail</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DawnBackground>
  );
}

/** The cairn, small: what an account keeps. Orange, like everywhere in Dawn. */
function MiniCairn() {
  return (
    <View style={styles.cairn} accessible={false}>
      <View style={[styles.stone, { width: 14, height: 10 }]} />
      <View style={[styles.stone, { width: 22, height: 12, marginLeft: -3 }]} />
      <View style={[styles.stone, { width: 30, height: 13, marginLeft: 3 }]} />
      <View style={[styles.stone, { width: 40, height: 15 }]} />
    </View>
  );
}

function confirmInstructions(address: string): string {
  return `We sent an e-mail to ${address}. Type its code below — or tap its link, come back, and leave the code empty. Check spam if it does not arrive.`;
}

const styles = {
  ...authStyles,
  ...StyleSheet.create({
    keepCard: {
      borderRadius: 22,
      backgroundColor: Dawn.card,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 18,
    },
    keepText: { flex: 1, minWidth: 0 },
    keepTitle: { fontSize: 18, lineHeight: 23, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
    keepBody: { marginTop: 4, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: '#d9d1ba' },
    cairn: { width: 48, alignItems: 'center', gap: 1 },
    stone: { borderRadius: 999, backgroundColor: Dawn.cairn },
    doneTitle: { marginTop: 8 },
  }),
};
