import { useCallback, useEffect, useState } from 'react';
import { summaryService, type SessionScoreRow } from '../services/summary.service';

export function useSessionScore(sessionId: string | undefined) {
  const [score, setScore] = useState<SessionScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sessionId) {
      setScore([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setScore(await summaryService.getSessionScore(sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo calcular el resumen');
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

  return { score, loading, error, reload };
}
