import { useState } from 'react';
import { questionsService, type CreateQuestionInput } from '../services/questions.service';

export function useCreateQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuestion = async (input: CreateQuestionInput) => {
    setLoading(true);
    setError(null);

    try {
      return await questionsService.createQuestion(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la pregunta';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createQuestion, loading, error };
}
