import { useCallback, useEffect, useState } from 'react';
import { sessionQuestionsService, type SessionQuestionWithQuestion } from '../services/session-questions.service';

export function useSessionQuestions(sessionId: string | undefined) {
  const [items, setItems] = useState<SessionQuestionWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sessionId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setItems(await sessionQuestionsService.listSessionQuestions(sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las preguntas de la sesión');
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

  return { items, loading, error, reload };
}
