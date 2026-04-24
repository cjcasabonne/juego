import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Database } from '../../../shared/types/db';
import { answersService } from '../services/answers.service';

type AnswerRow = Database['public']['Tables']['answers']['Row'];

export function usePhase1Answers(sessionId: string | undefined, userId: string | undefined) {
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredQuestionIds = useMemo(() => new Set(answers.map((answer) => answer.question_id)), [answers]);

  const reload = useCallback(async () => {
    if (!sessionId || !userId) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setAnswers(await answersService.listMyAnswers(sessionId, userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las respuestas');
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

  const submitAnswer = async (input: { questionId: string; selectedOptionId?: string | null; freeText?: string | null }) => {
    if (!sessionId || !userId) {
      throw new Error('Sesión no disponible');
    }

    setSaving(true);
    setError(null);

    try {
      const answer = await answersService.submitAnswer({
        sessionId,
        questionId: input.questionId,
        userId,
        selectedOptionId: input.selectedOptionId,
        freeText: input.freeText,
      });
      setAnswers((current) => [...current, answer]);
      return answer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la respuesta';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { answers, answeredQuestionIds, loading, saving, error, reload, submitAnswer };
}
