import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';

const LAST_UPDATED = 'August 2026';

/**
 * DRAFT — has 3 bracketed placeholders (contact email, Supabase hosting
 * region, governing-law entity) that need real values before this ships.
 * See docs/launch-plan.md, Pillar 1.
 */
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'What this covers',
    body:
      'This policy explains what Side Quest Life ("the app", "we") collects when you use the app, ' +
      'why, and what control you have over it. It applies to the mobile app and its web version.',
  },
  {
    heading: 'What we collect',
    body:
      'Account: an email address only if you choose to create an account with one — the app also ' +
      'works with an anonymous session that has no email attached.\n\n' +
      'Preferences: the categories, pace, and intensity you pick during onboarding, plus two ' +
      'optional baseline scale answers (how connected you feel to nature, how often you feel ' +
      'isolated) used only to personalize quest suggestions for you.\n\n' +
      'Content you create: which quests you start or finish, any notes and photos you add to a ' +
      'memory, and free-text answers you type while completing a quest step.\n\n' +
      'Usage data: basic app-usage events (e.g. "quest started," "memory saved") tied to your ' +
      'account, used only to understand how the app is used and improve it. This is first-party ' +
      'only — we do not use any third-party analytics, advertising, or cross-app tracking SDKs, ' +
      'and nothing you do here is shared with ad networks.',
  },
  {
    heading: 'Why we collect it',
    body:
      'To run the app (save your progress, show your memories back to you), to personalize which ' +
      'quests get recommended to you, and to understand and improve how the app works. We do not ' +
      'use your data for advertising and do not sell it to anyone.',
  },
  {
    heading: 'Who we share it with',
    body:
      'Your data is stored with Supabase, our database and authentication provider, acting as our ' +
      'data processor — they host the data on our behalf and do not use it for their own purposes. ' +
      'Data is stored in [Supabase project region — confirm before publishing]. We do not sell or ' +
      'share your data with advertisers or other third parties.',
  },
  {
    heading: 'How long we keep it',
    body:
      'For as long as your account exists. You can permanently delete your account and everything ' +
      'tied to it at any time from Progress → Delete account, in the app — this is immediate and ' +
      'cannot be undone.',
  },
  {
    heading: 'Your rights',
    body:
      'You can access, correct, or export your data by contacting us, and delete your account ' +
      'yourself at any time (see above). If you are in the EU/EEA, this includes the rights ' +
      'guaranteed under GDPR: access, rectification, erasure, restriction, portability, and ' +
      'objection.',
  },
  {
    heading: 'Children',
    body: 'Side Quest Life is not directed at children under 16 and we do not knowingly collect data from them.',
  },
  {
    heading: 'Changes to this policy',
    body:
      `We'll update the date below if this policy changes in a meaningful way. Last updated: ${LAST_UPDATED}.`,
  },
  {
    heading: 'Contact',
    body: 'Questions about this policy or your data: [contact email — confirm before publishing].',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Privacy Policy</Text>
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
