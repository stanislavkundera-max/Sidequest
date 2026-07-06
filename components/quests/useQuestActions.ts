import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { alertCompat } from '@/lib/alertCompat';
import { activeQuestResumePath } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { UserQuest } from '@/src/types/quest';

/**
 * Shared quest-engagement actions (start / like / continue) plus the
 * "active path full" modal wiring, used by Explore and Journey.
 */
export function useQuestActions(userId: string) {
  const router = useRouter();
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const pending = useQuestDomainStore((s) => s.pending);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const refreshUserQuests = useQuestDomainStore((s) => s.refreshUserQuests);
  const assignQuestToUser = useQuestDomainStore((s) => s.assignQuestToUser);
  const saveQuestForLater = useQuestDomainStore((s) => s.saveQuestForLater);
  const deactivateQuest = useQuestDomainStore((s) => s.deactivateQuest);

  const [pathFullOpen, setPathFullOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingActivationRef = useRef<string | null>(null);

  const activeForModal = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'active')
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    [userQuests]
  );

  const primaryBusy = pending || busy;

  const openPathFull = useCallback((questId: string) => {
    pendingActivationRef.current = questId;
    setPathFullOpen(true);
  }, []);

  const closePathFull = useCallback(() => {
    setPathFullOpen(false);
    pendingActivationRef.current = null;
  }, []);

  const runActivate = useCallback(
    async (questId: string, afterNavigate?: string) => {
      setBusy(true);
      try {
        const r = await assignQuestToUser(userId, questId);
        if (r.ok) {
          await refreshUserQuests(userId);
          setPathFullOpen(false);
          pendingActivationRef.current = null;
          if (afterNavigate) router.push(afterNavigate as never);
          return;
        }
        if (r.reason === 'active_path_full') {
          openPathFull(questId);
          return;
        }
        if (r.reason === 'already_active') {
          alertCompat('Already in motion', 'This one is already active.');
          return;
        }
        alertCompat('Cannot add', 'This quest is not available right now.');
      } finally {
        setBusy(false);
      }
    },
    [assignQuestToUser, openPathFull, refreshUserQuests, router, userId]
  );

  const onStartNow = useCallback(
    async (questId: string) => {
      const quest = getQuestById(questId);
      if (!quest) return;
      const existing = userQuests.find((uq) => uq.questId === questId && uq.status === 'active');
      if (existing) {
        router.push(activeQuestResumePath(quest, existing) as never);
        return;
      }
      await runActivate(questId, `/quest/run/${questId}`);
    },
    [getQuestById, router, runActivate, userQuests]
  );

  const onLike = useCallback(
    async (questId: string) => {
      setBusy(true);
      try {
        const r = await saveQuestForLater(userId, questId);
        if (!r.ok) {
          alertCompat('Could not save', r.reason);
          return;
        }
        await refreshUserQuests(userId);
      } finally {
        setBusy(false);
      }
    },
    [refreshUserQuests, saveQuestForLater, userId]
  );

  const onContinue = useCallback(
    (uq: UserQuest) => {
      const quest = getQuestById(uq.questId);
      const path = quest ? activeQuestResumePath(quest, uq) : `/quest/${uq.questId}`;
      router.push(path as never);
    },
    [getQuestById, router]
  );

  const onLetWait = useCallback(
    async (userQuestId: string) => {
      setBusy(true);
      try {
        const r = await deactivateQuest(userId, userQuestId);
        if (!r.ok) {
          alertCompat('Could not update', 'Try again in a moment.');
          return;
        }
        await refreshUserQuests(userId);
        const nextPending = pendingActivationRef.current;
        if (nextPending) {
          await runActivate(nextPending);
        } else {
          setPathFullOpen(false);
        }
      } finally {
        setBusy(false);
      }
    },
    [deactivateQuest, refreshUserQuests, runActivate, userId]
  );

  const openQuest = useCallback(
    (questId: string) => router.push(`/quest/${questId}` as never),
    [router]
  );

  return {
    primaryBusy,
    pathFullOpen,
    activeForModal,
    getQuestById,
    onStartNow,
    onLike,
    onContinue,
    onLetWait,
    closePathFull,
    openQuest,
  };
}
