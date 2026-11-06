import { useSegments } from 'expo-router';
import { useEffect } from 'react';

import { trackScreen } from '@/src/lib/analytics';

/**
 * Sends `screen_viewed` on every screen change (#67, 2026-11-06), so the first-party events can show
 * where people go and where they stop without a third-party SDK.
 *
 * Built from the route *segments* (`memory`, `[id]`), not the path: the pattern says which screen
 * it was and carries no memory or quest id. Mounted once, in the root layout.
 */
export function useScreenTracking(): void {
  const segments = useSegments();
  const route = `/${segments.join('/')}`;
  useEffect(() => {
    trackScreen(route).catch(() => undefined);
  }, [route]);
}
