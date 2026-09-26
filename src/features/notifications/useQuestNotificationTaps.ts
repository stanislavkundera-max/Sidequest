import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { configureQuestNotifications } from '@/src/features/notifications/questNotifications';

/**
 * Tapping a quest notification opens that quest's runner, on the step you are on — whether the app
 * was open, in the background, or closed. Waits for the session so a cold start does not navigate
 * before auth has settled.
 */
export function useQuestNotificationTaps(sessionReady: boolean): void {
  const router = useRouter();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    configureQuestNotifications();
  }, []);

  useEffect(() => {
    if (!sessionReady || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const key = response.notification.request.identifier + response.notification.date;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      const url = (response.notification.request.content.data as { url?: unknown } | undefined)?.url;
      if (typeof url === 'string' && url.startsWith('/quest/run/')) router.push(url as never);
    };

    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [sessionReady, router]);
}
