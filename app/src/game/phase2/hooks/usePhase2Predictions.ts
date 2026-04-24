import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Database } from '../../../shared/types/db';
import { predictionsService } from '../services/predictions.service';

type PredictionRow = Database['public']['Tables']['predictions']['Row'];

export function usePhase2Predictions(sessionId: string | undefined, predictorId: string | undefined) {
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictedQuestionIds = useMemo(
    () => new Set(predictions.map((prediction) => prediction.question_id)),
    [predictions],
  );

  const reload = useCallback(async () => {
    if (!sessionId || !predictorId) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setPredictions(await predictionsService.listMyPredictions(sessionId, predictorId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las predicciones');
    } finally {
      setLoading(false);
    }
  }, [predictorId, sessionId]);

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

  const submitPrediction = async (input: {
    questionId: string;
    predictedOptionId?: string | null;
    predictedFreeText?: string | null;
  }) => {
    if (!sessionId || !predictorId) {
      throw new Error('Sesión no disponible');
    }

    setSaving(true);
    setError(null);

    try {
      const prediction = await predictionsService.submitPrediction({
        sessionId,
        questionId: input.questionId,
        predictorId,
        predictedOptionId: input.predictedOptionId,
        predictedFreeText: input.predictedFreeText,
      });
      setPredictions((current) => [...current, prediction]);
      return prediction;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la predicción';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { predictions, predictedQuestionIds, loading, saving, error, reload, submitPrediction };
}
