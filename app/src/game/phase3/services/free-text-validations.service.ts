import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../shared/types/db';

type ValidationRow = Database['public']['Tables']['free_text_validations']['Row'];
type ValidationInsert = Database['public']['Tables']['free_text_validations']['Insert'];

export const freeTextValidationsService = {
  async createValidation(input: {
    predictionId: string;
    validatorId: string;
    isCorrect: boolean;
  }): Promise<ValidationRow> {
    const payload: ValidationInsert = {
      prediction_id: input.predictionId,
      validator_id: input.validatorId,
      is_correct: input.isCorrect,
    };

    const { data, error } = await supabase
      .from('free_text_validations')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
