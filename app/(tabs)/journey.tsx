import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllQuestsList } from '@/components/journey/AllQuestsList';
import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';
import { useSessionStore } from '@/stores/session';

export default function JourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const user = useSessionStore((s) => s.user);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to view your Journey."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Journey</Text>
        <Text style={styles.pageSub}>Every quest in the world — pick anything that calls to you.</Text>
        <AllQuestsList userId={user.id} initialCategoryId={params.category ?? null} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 32 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.text,
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 6,
  },
  pageSub: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.textMuted,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});
