import { ErrorState } from '@/components/ui/ErrorState';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { useSessionStore } from '@/stores/session';

/**
 * Shown where the quests would be when loading them failed — usually no signal when the app
 * started. It used to be a spinner that never stopped: nothing ever tried again until the app was
 * killed (code review 2026-09-27). The app also retries by itself when it comes back to the
 * foreground (appLifecycle).
 */
export function CatalogLoadFailed() {
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  return (
    <ErrorState
      message="The quests could not be loaded. Check your connection, then try again."
      onRetry={userId ? () => void bootstrap(userId) : undefined}
    />
  );
}

/** True when there is no catalogue because the last load failed (not while it is loading). */
export function useCatalogLoadFailed(): boolean {
  return useQuestDomainStore((s) => s.catalogFailed && !s.loading && s.quests.length === 0);
}
