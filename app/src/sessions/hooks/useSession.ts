import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Database } from '../../shared/types/db';
import { sessionsService } from '../services/sessions.service';

type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];

export function useSession(sessionId: string | undefined): {
  session: GameSessionRow | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setSession: Dispatch<SetStateAction<GameSessionRow | null>>;
} {
  const [session, setSession] = useState<GameSessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setSession(await sessionsService.getSession(sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la sesión');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      await reload();
    };

    void load();

    return () => {
      active = false;
    };
  }, [reload]);

  return { session, loading, error, reload, setSession };
}
