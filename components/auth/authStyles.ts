import { StyleSheet } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';

/**
 * Sign in, the e-mail code, password reset and saving a guest account (redesign screens 11–14)
 * share one form on the Dawn ground: translucent rounded fields with a light rim, a peach link
 * for the next step and a quieter cream one for the way back. Four screens carried four copies.
 */
export const authStyles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
    color: Theme.text,
  },
  sub: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    color: '#e6dfca',
  },
  bannerError: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.dangerBorder,
    backgroundColor: Theme.dangerSoft,
    color: Theme.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  bannerInfo: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(224, 130, 61, 0.35)',
    backgroundColor: 'rgba(224, 130, 61, 0.12)',
    color: '#f3e2cc',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#d9d1ba',
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 234, 214, 0.4)',
    backgroundColor: Dawn.card,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Theme.text,
    marginBottom: 14,
  },
  /** A sent-to address you can no longer edit: no rim, just the value. */
  inputLocked: { borderColor: 'transparent', backgroundColor: 'rgba(243, 242, 236, 0.05)', color: '#e6dfca' },
  inputCode: { fontSize: 18, fontFamily: 'Inter_600SemiBold', fontWeight: '600', letterSpacing: 5 },
  actions: { marginTop: 8 },
  links: { marginTop: 14, alignItems: 'center' },
  linkWrap: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  /** The next step ("Send a new code"). */
  link: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Dawn.cairn },
  /** The way back ("Back to sign in", "Use a different e-mail"). */
  linkBack: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#e6dfca' },
  /** The rare case ("The e-mail has a link, no code?"). */
  linkQuiet: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#bfb69c' },
  footnote: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', color: '#bfb69c', textAlign: 'center' },
  hint: { marginTop: 24, textAlign: 'center', color: Theme.danger, fontSize: 14, fontFamily: 'Inter_400Regular' },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(246, 234, 214, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Placeholder text on the Dawn fields. */
export const AUTH_PLACEHOLDER = '#a39a80';
