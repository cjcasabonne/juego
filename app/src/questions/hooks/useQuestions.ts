import { useCallback, useEffect, useState } from 'react';
import type { Database } from '../../shared/types/db';
import { questionsService } from '../services/questions.service';

type QuestionRow = Database['public']['Tables']['questions']['Row'];

export function useQuestions(coupleId: string | null) {
  const [globalQuestions, setGlobalQuestions] = useState<QuestionRow[]>([]);
  const [coupleQuestions, setCoupleQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [globalData, coupleData] = await Promise.all([
        questionsService.listGlobalQuestions(),
        coupleId ? questionsService.listCoupleQuestions(coupleId) : Promise.resolve([]),
      ]);

      setGlobalQuestions(globalData);
      setCoupleQuestions(coupleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las preguntas');
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

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

  return {
    globalQuestions,
    coupleQuestions,
    loading,
    error,
    reload,
  };
}
