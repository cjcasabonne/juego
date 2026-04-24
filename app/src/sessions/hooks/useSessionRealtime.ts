import { useEffect } from 'react';
import type { GameSessionStatus } from '../../shared/types/db';
import { subscribeToSession, unsubscribe } from '../../lib/realtime';

export function useSessionRealtime(sessionId: string | undefined, onStatusChange: (status: GameSessionStatus) => void) {
  useEffect(() => {
    if (!sessionId) return;

    const channel = subscribeToSession(sessionId, (status) => onStatusChange(status as GameSessionStatus));
    return () => {
      unsubscribe(channel);
    };
  }, [onStatusChange, sessionId]);
}
