import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Theme } from '@/constants/Theme';

type Props = {
  /** Where to go when there is no screen behind this one. */
  fallback?: string;
  accessibilityLabel?: string;
};

/**
 * A back control that always works.
 *
 * React Navigation only draws its own back button when the stack has something
 * behind it. Every screen outside the tabs relied on that, so arriving cold —
 * a shared link, a browser refresh, a notification later on — left people with
 * no way out at all. The quest runner was the worst case: its only header
 * control was "Leave", so the sole exit from a quest you were part-way through
 * was to abandon it.
 *
 * `navigation.canGoBack()` is the navigator's own state, and is what to trust.
 * Deliberately not `router.canGoBack()`, which returns true on web for history
 * belonging to some other site entirely — that mistake sent the password-reset
 * screen back to onboarding in August.
 */
export function HeaderBackButton({
  fallback = '/(tabs)/journey',
  accessibilityLabel = 'Back',
}: Props) {
  const navigation = useNavigation();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={() => {
        if (navigation.canGoBack()) router.back();
        else router.replace(fallback as never);
      }}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Ionicons name="chevron-back" size={24} color={Theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4, paddingVertical: 4 },
  pressed: { opacity: 0.6 },
});
