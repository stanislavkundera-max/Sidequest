import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_JURISDICTION,
  LEGAL_LAST_UPDATED,
} from '@/constants/legal';
import { Theme } from '@/constants/Theme';

const LAST_UPDATED = LEGAL_LAST_UPDATED;

/**
 * ~~DRAFT — has a bracketed placeholder~~ — stale as of 2026-09-06. The
 * governing-law entity and jurisdiction are real values in `constants/legal.ts`
 * (`Stanislav Kundera`, `the Czech Republic`) and no bracketed placeholder
 * remains in any section. The warning outlived the problem by two weeks and
 * would have sent the next reader looking for a blocker that was already gone.
 */
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Agreement',
    body:
      'By using Side Quest Life ("the app"), you agree to these terms. If you do not agree, please ' +
      "don't use the app.",
  },
  {
    heading: 'What the app is',
    body:
      'Side Quest Life suggests real-world activities ("quests") and helps you keep a record of ' +
      "them. It's a personal companion, not a safety, medical, or professional service. Some " +
      'quests involve physical activity or risk — cold water, heights, being outdoors after dark, ' +
      'or booking an activity with a commercial operator. Judging whether one is right for you, ' +
      'and doing it safely, is yours to do: check the conditions, use licensed operators where ' +
      "they're involved, and stop if something isn't right. You take part at your own risk.",
  },
  {
    heading: 'Your account',
    body:
      "You're responsible for whatever happens under your account. If you create an account with an " +
      'email and password, keep that password to yourself.',
  },
  {
    heading: 'Your content',
    body:
      'Notes, photos, and anything else you add stay yours. By adding them, you give us a limited ' +
      "license to store and show that content back to you within the app — that's it, we don't use " +
      'it for anything else, and we don’t publish it anywhere.',
  },
  {
    heading: 'Acceptable use',
    body:
      "Don't use the app to do anything illegal, to harass anyone, or to try to break, reverse-" +
      'engineer, or abuse the service.',
  },
  {
    heading: 'Ending your use',
    body:
      'You can stop using the app any time, and you can permanently delete your account from ' +
      'Progress → Delete account in the app. We may suspend or terminate access for a violation of ' +
      'these terms.',
  },
  {
    heading: 'No warranty',
    body:
      'The app is provided "as is." We don’t guarantee it will be uninterrupted, error-free, or ' +
      'fit for a particular purpose, and quest suggestions are exactly that — suggestions, not ' +
      'advice.',
  },
  {
    heading: 'Limitation of liability',
    body:
      "To the extent allowed by law, we aren't liable for indirect, incidental, or consequential " +
      'damages arising from your use of the app, including anything that happens while doing a ' +
      'quest in the real world.',
  },
  {
    heading: 'Governing law',
    body:
      `Side Quest Life is operated by ${LEGAL_ENTITY_NAME}, a private individual based in ` +
      `${LEGAL_JURISDICTION}. These terms are governed by the laws of ${LEGAL_JURISDICTION}, and ` +
      `its courts have jurisdiction over any dispute. Questions: ${LEGAL_CONTACT_EMAIL}.`,
  },
  {
    heading: 'Changes',
    body: `We'll update the date below if these terms change in a meaningful way. Last updated: ${LAST_UPDATED}.`,
  },
];

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Terms of Service</Text>
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
  title: { fontSize: 26, fontFamily: 'Fraunces_700Bold', fontWeight: '700', color: Theme.text },
  updated: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginTop: -12 },
  section: { gap: 6 },
  heading: { fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, color: Theme.textMuted },
});
