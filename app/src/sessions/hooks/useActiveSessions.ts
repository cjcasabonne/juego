import { useCallback, useEffect, useState } from 'react';
import type { Database } from '../../shared/types/db';
import { sessionsService } from '../services/sessions.service';

type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];

export function useActiveSessions() {
  const [sessions, setSessions] = useState<GameSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await sessionsService.listActiveSessions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las sesiones activas');
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { sessions, loading, error, reload };
}
