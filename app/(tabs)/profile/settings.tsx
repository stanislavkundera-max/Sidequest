import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountCard } from '@/components/progress/AccountCard';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { Theme } from '@/constants/Theme';

/** Settings (redesign screen 35), opened from the gear on Progress. */
export default function SettingsScreen() {
  return (
    <DawnBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <HeaderBackButton fallback="/(tabs)/profile" accessibilityLabel="Back to Progress" />
          <Text style={styles.title} accessibilityRole="header">
            Settings
          </Text>
        </View>
        <ScrollView>
          <AccountCard />
        </ScrollView>
      </SafeAreaView>
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.4, color: Theme.text },
});
