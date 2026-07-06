import { Redirect } from 'expo-router';

/** Legacy routes `profile/monthly` and `profile/yearly` redirect to the main Progress screen. */
export default function ProfileTimeframeScreen() {
  return <Redirect href="/(tabs)/profile" />;
}
