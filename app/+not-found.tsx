import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';

/**
 * A link to nowhere (redesign screen 38): a calm dead end with one way back, not "Oops!" and a
 * blue link from the project template.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <DawnBackground>
        <View style={styles.container}>
          <EmptyState
            art={<Ionicons name="trail-sign-outline" size={44} color={Theme.accent} />}
            title="This path doesn't go anywhere"
            message="The screen you were looking for isn't here."
            actionLabel="Back to the map"
            onAction={() => router.replace('/(tabs)/explore')}
          />
        </View>
      </DawnBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
