import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';

const LAST_UPDATED = 'August 2026';

/**
 * Public account-deletion page.
 *
 * Google Play requires this as a **web URL reachable without installing the
 * app** — an in-app delete button alone does not satisfy the policy. Because
 * this is a plain expo-router route with no auth gate, the web export publishes
 * it at /legal/delete-account, which is the URL to paste into Play Console
 * under Data safety → Account deletion.
 *
 * The "what is deleted" list below is not boilerplate: it mirrors
 * `delete_own_account()` in supabase/schema.sql exactly. Everything with an
 * `on delete cascade` FK to auth.users goes; `analytics_events.user_id` is
 * `on delete set null` by design, so those rows survive without any link to a
 * person. If that function changes, this page has to change with it.
 *
 * DRAFT — has one bracketed placeholder (contact email) that needs a real value
 * before this ships. See docs/play-store-handoff.md.
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
      'If you no longer have the app installed, email [contact email — confirm before publishing] ' +
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
      'Basic usage events (for example "quest started" or "memory saved") are kept, but the link ' +
      'to you is permanently removed at the moment of deletion — the account reference is erased ' +
      'and cannot be restored or traced back to you.\n\n' +
      'What remains is anonymous counts used to understand how the app is used overall. It ' +
      'contains no email address, no notes, no photos, and nothing you wrote.',
  },
  {
    heading: 'Questions',
    body: 'Anything unclear about deletion or your data: [contact email — confirm before publishing].',
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
