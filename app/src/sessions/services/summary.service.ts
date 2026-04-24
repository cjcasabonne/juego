import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';

type PredictionRow = Database['public']['Tables']['predictions']['Row'];
type ValidationRow = Database['public']['Tables']['free_text_validations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface SessionScoreRow {
  predictorId: string;
  displayName: string;
  correct: number;
  scoredTotal: number;
  pending: number;
}

async function listPredictions(sessionId: string): Promise<PredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('session_id', sessionId)
    .order('predicted_at', { ascending: true });

  if (error) throw error;
  return data;
}

async function listValidations(): Promise<ValidationRow[]> {
  const { data, error } = await supabase
    .from('free_text_validations')
    .select('*')
    .order('validated_at', { ascending: true });

  if (error) throw error;
  return data;
}

async function listProfiles(userIds: string[]): Promise<ProfileRow[]> {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);
  if (error) throw error;
  return data;
}

export const summaryService = {
  async getSessionScore(sessionId: string): Promise<SessionScoreRow[]> {
    const [predictions, validations] = await Promise.all([listPredictions(sessionId), listValidations()]);
    const validationMap = new Map<string, ValidationRow>(validations.map((item) => [item.prediction_id, item]));
    const predictorIds = [...new Set(predictions.map((prediction) => prediction.predictor_id))];
    const profiles = await listProfiles(predictorIds);
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const scores = predictorIds.map<SessionScoreRow>((predictorId) => ({
      predictorId,
      displayName: profileMap.get(predictorId)?.display_name ?? predictorId.slice(0, 8),
      correct: 0,
      scoredTotal: 0,
      pending: 0,
    }));

    const scoreMap = new Map(scores.map((score) => [score.predictorId, score]));

    predictions.forEach((prediction) => {
      const target = scoreMap.get(prediction.predictor_id);
      if (!target) return;

      if (prediction.is_correct !== null) {
        target.scoredTotal += 1;
        if (prediction.is_correct) target.correct += 1;
        return;
      }

      const validation = validationMap.get(prediction.id);
      if (validation) {
        target.scoredTotal += 1;
        if (validation.is_correct) target.correct += 1;
      } else {
        target.pending += 1;
      }
    });

    return scores.sort((a, b) => b.correct - a.correct);
  },
};
