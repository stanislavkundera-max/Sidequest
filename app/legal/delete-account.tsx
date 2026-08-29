import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/constants/legal';
import { Theme } from '@/constants/Theme';

const LAST_UPDATED = LEGAL_LAST_UPDATED;

/**
 * Public account-deletion page.
 *
 * Google Play requires this as a **web URL reachable without installing the
 * app** — an in-app delete button alone does not satisfy the policy. Because
 * this is a plain expo-router route with no auth gate, the web export publishes
 * it at /legal/delete-account, which is the URL to paste into Play Console
 * under Data safety → Account deletion.
 *
 * The "what is deleted" and "what is kept" lists below are not boilerplate:
 * they mirror `delete_own_account()` in supabase/schema.sql exactly. Everything
 * with an `on delete cascade` FK to auth.users goes; `analytics_events.user_id`
 * is `on delete set null`, and the function additionally strips the 'note' and
 * 'userId' keys out of that table's properties blob so the surviving rows are
 * genuinely anonymous rather than merely missing a column value.
 *
 * These are load-bearing claims in a public legal document. If
 * `delete_own_account()` changes, or a new analytics property starts carrying
 * user-written text, this page becomes false — change them together.
 *
 * The contact address comes from `constants/legal.ts`, shared with the privacy
 * policy and the terms. It has to be a mailbox that actually receives mail
 * before submission — this page is the one Google checks.
 */
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Deleting your Side Quest Life account',
    body:
      'You can delete your Side Quest Life account and its data at any time, either from inside ' +
      'the app or by asking us to do it for you. This page explains both, and exactly what gets ' +
      'removed.',
  },
  {
    heading: 'Delete it yourself, in the app',
    body:
      'Open the app and go to the Progress tab. In the account card at the top, choose ' +
      '"Delete account" and confirm. This happens immediately and cannot be undone.\n\n' +
      'Note that "Delete account" is not the same as "Delete all progress." Deleting progress ' +
      'clears your quests and memories but keeps your account; deleting the account removes the ' +
      'account itself as well.',
  },
  {
    heading: 'Request deletion without the app',
    body:
      `If you no longer have the app installed, email ${LEGAL_CONTACT_EMAIL} ` +
      'from the address you signed up with, and ask for your account to be deleted. We will ' +
      'confirm and complete the deletion within 30 days.\n\n' +
      'We ask you to write from the signed-up address because it is the only way to check that ' +
      'the request really comes from the account holder.',
  },
  {
    heading: 'What gets deleted',
    body:
      'Your sign-in account and email address.\n\n' +
      'Your profile and onboarding preferences, including the two optional baseline answers ' +
      '(nature connection and isolation).\n\n' +
      'Every quest you started, saved, or completed, and any answers you typed while working ' +
      'through a quest.\n\n' +
      'Every memory you saved, including its notes and any photos you attached. Photos are ' +
      'removed from storage as part of the same operation.\n\n' +
      'Any future goals you set.',
  },
  {
    heading: 'What is kept, and why',
    body:
      'Basic usage events are kept — a record that something like "quest started" or "memory ' +
      'saved" happened, when it happened, and which quest it referred to.\n\n' +
      'The link to you is removed as part of the deletion: the account reference on those events ' +
      'is erased, and any text you had written that was attached to them is stripped at the same ' +
      'time. What is left is counts of actions, with nothing pointing back to you.\n\n' +
      'It holds no email address, no memories, no photos, and no text you wrote.',
  },
  {
    heading: 'Questions',
    body: `Anything unclear about deletion or your data: ${LEGAL_CONTACT_EMAIL}.`,
  },
];

export default function DeleteAccountScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Delete your account</Text>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 48, gap: 20 },
  title: { fontSize: 26, fontWeight: '700', color: Theme.text },
  updated: { fontSize: 13, color: Theme.textMuted, marginTop: -12 },
  section: { gap: 6 },
  heading: { fontSize: 16, fontWeight: '700', color: Theme.text },
  body: { fontSize: 14, lineHeight: 21, color: Theme.textMuted },
});
