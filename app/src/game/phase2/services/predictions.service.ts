import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../shared/types/db';

type PredictionRow = Database['public']['Tables']['predictions']['Row'];
type PredictionInsert = Database['public']['Tables']['predictions']['Insert'];

export interface SubmitPredictionInput {
  sessionId: string;
  questionId: string;
  predictorId: string;
  predictedOptionId?: string | null;
  predictedFreeText?: string | null;
}

export const predictionsService = {
  async listMyPredictions(sessionId: string, predictorId: string): Promise<PredictionRow[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('predictor_id', predictorId)
      .order('predicted_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async submitPrediction(input: SubmitPredictionInput): Promise<PredictionRow> {
    const payload: PredictionInsert = {
      session_id: input.sessionId,
      question_id: input.questionId,
      predictor_id: input.predictorId,
      predicted_option_id: input.predictedOptionId ?? null,
      predicted_free_text: input.predictedFreeText ?? null,
    };

    const { data, error } = await supabase.from('predictions').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },
};
