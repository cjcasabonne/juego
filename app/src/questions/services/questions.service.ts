import { supabase } from '../../lib/supabase';
import type { Database, QuestionCategory, QuestionType } from '../../shared/types/db';

type QuestionRow = Database['public']['Tables']['questions']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type QuestionOption = Database['public']['Tables']['questions']['Row']['options'];

export interface CreateQuestionInput {
  coupleId: string;
  type: QuestionType;
  category: QuestionCategory;
  intensity: number;
  text: string;
  options: QuestionOption;
  createdBy: string;
  questionId?: string | null;
}

export const questionsService = {
  async listGlobalQuestions(): Promise<QuestionRow[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .is('couple_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async listCoupleQuestions(coupleId: string): Promise<QuestionRow[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createQuestion(input: CreateQuestionInput): Promise<QuestionRow> {
    const payload: QuestionInsert = {
      question_id: input.questionId ?? null,
      couple_id: input.coupleId,
      type: input.type,
      category: input.category,
      intensity: input.intensity,
      text: input.text.trim(),
      options: input.options,
      is_active: true,
      created_by: input.createdBy,
    };

    const { data, error } = await supabase.from('questions').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },

  async disableQuestion(questionId: string): Promise<void> {
    const { error } = await supabase.from('questions').update({ is_active: false }).eq('id', questionId);
    if (error) throw error;
  },
};
