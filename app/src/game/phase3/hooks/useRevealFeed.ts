import { useCallback, useEffect, useState } from 'react';
import { revealService, type RevealItem } from '../services/reveal.service';

export function useRevealFeed(sessionId: string | undefined, userId: string | undefined) {
  const [items, setItems] = useState<RevealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sessionId || !userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setItems(await revealService.getRevealFeed(sessionId, userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reveal');
    } finally {
      setLoading(false);
    }
  }, [sessionId, userId]);

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

  return { items, loading, error, reload };
}
