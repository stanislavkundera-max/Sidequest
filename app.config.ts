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
  // The app ships one palette: `constants/Theme.ts` exports `lightPalette` only,
  // and a dark one is structured but unwritten (tasks.md #6). 'automatic' told
  // the OS the app adapts to the system theme when it does not, and `expo
  // prebuild` warns the setting is inert on Android without `expo-system-ui`.
  // 'light' is what the app actually does. Revisit when a dark palette exists.
  userInterfaceStyle: 'light',
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
    /**
     * Permissions Expo's prebuild template adds by default and this app does
     * not use. The template itself labels them "OPTIONAL PERMISSIONS, REMOVE
     * WHATEVER YOU DO NOT NEED" — nobody ever did, so a `prebuild` on
     * 2026-08-29 produced a manifest asking to draw over other apps.
     *
     * SYSTEM_ALERT_WINDOW is the one that matters: it is React Native's
     * dev-menu overlay permission, useless in a release build, and one of the
     * permissions Play reviewers question. Asking for it while shipping a quest
     * journal invites a conversation nobody wants to have.
     *
     * RECORD_AUDIO is handled separately — see `microphonePermission` on the
     * expo-image-picker plugin below, which is the supported way to block it.
     *
     * The storage permissions are deliberately left alone: expo-image-picker
     * declares them in its own library manifest for picking from the camera
     * roll, and blocking them here would strip that too and could break photo
     * selection on Android 12 and below (minSdk is 24).
     */
    blockedPermissions: ['android.permission.SYSTEM_ALERT_WINDOW'],
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
        cameraPermission:
          'Side Quest Life uses your camera so a quest step can be finished with a photo.',
        // The plugin adds RECORD_AUDIO unconditionally (for video capture it
        // does not offer here). Nothing in this app records audio — verified
        // by grep: no expo-av, no recording APIs — and shipping a microphone
        // permission you never use is both a Data safety question to answer
        // and a reason for a reviewer to look harder. `false` is the plugin's
        // own supported way to block it.
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: envTrim('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: envTrim('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    // Dev-only auto-login credentials. `lib/devAuth.ts` already gates their
    // use behind `__DEV__`, but that only stops the *behavior* — the literal
    // string values still land in `extra` (and so in the shipped JS bundle)
    // regardless of `__DEV__` unless stripped here too. Belt-and-suspenders:
    // never include them at all outside a non-production build, so setting
    // these env vars for a `production` EAS build profile by mistake can't
    // leak real credentials into a release build.
    ...(process.env.NODE_ENV === 'production'
      ? {}
      : {
          devLoginEmail: envTrim('EXPO_PUBLIC_DEV_LOGIN_EMAIL'),
          devLoginPassword: envTrim('EXPO_PUBLIC_DEV_LOGIN_PASSWORD'),
        }),
  },
});
