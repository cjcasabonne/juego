import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../shared/types/db';

type AnswerRow = Database['public']['Tables']['answers']['Row'];
type AnswerInsert = Database['public']['Tables']['answers']['Insert'];

export interface SubmitAnswerInput {
  sessionId: string;
  questionId: string;
  userId: string;
  selectedOptionId?: string | null;
  freeText?: string | null;
}

export const answersService = {
  async listMyAnswers(sessionId: string, userId: string): Promise<AnswerRow[]> {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('answered_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  async submitAnswer(input: SubmitAnswerInput): Promise<AnswerRow> {
    const payload: AnswerInsert = {
      session_id: input.sessionId,
      question_id: input.questionId,
      user_id: input.userId,
      selected_option_id: input.selectedOptionId ?? null,
      free_text: input.freeText ?? null,
    };

    const { data, error } = await supabase.from('answers').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  },
};
