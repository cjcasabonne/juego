import { useState } from 'react';
import { questionsService } from '../services/questions.service';

export function useDisableQuestion() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disableQuestion = async (questionId: string) => {
    setLoadingId(questionId);
    setError(null);

    try {
      await questionsService.disableQuestion(questionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo desactivar la pregunta';
      setError(message);
      throw err;
    } finally {
      setLoadingId(null);
    }
  };

  return { disableQuestion, loadingId, error };
}
