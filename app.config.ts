import type { ExpoConfig, ConfigContext } from 'expo/config';

function envTrim(key: string): string {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Side Quest Life',
  slug: 'side-quest-life',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'sidequestlife',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#f4f1ec',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sidequestlife.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#f4f1ec',
    },
    edgeToEdgeEnabled: true,
    package: 'com.sidequestlife.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-calendar',
      {
        calendarPermission:
          'Side Quest Life adds a dated reminder to your calendar so side quests happen in real life.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Side Quest Life needs access to your photos to attach an image to a memory.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: envTrim('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: envTrim('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    devLoginEmail: envTrim('EXPO_PUBLIC_DEV_LOGIN_EMAIL'),
    devLoginPassword: envTrim('EXPO_PUBLIC_DEV_LOGIN_PASSWORD'),
  },
});
