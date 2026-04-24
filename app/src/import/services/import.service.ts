import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';
import type { ImportResult } from '../../shared/types/domain';
import type { ValidatedImportRow } from '../validators/import.validator';

type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type QuestionRow = Database['public']['Tables']['questions']['Row'];

async function getExistingQuestionIds(scopeCoupleId: string | null, questionIds: string[]) {
  if (questionIds.length === 0) return new Set<string>();

  let query = supabase.from('questions').select('question_id').in('question_id', questionIds);
  query = scopeCoupleId ? query.eq('couple_id', scopeCoupleId) : query.is('couple_id', null);

  const { data, error } = await query;
  if (error) throw error;

  return new Set(data.map((row) => row.question_id).filter(Boolean) as string[]);
}

export const importService = {
  async importQuestions(params: {
    coupleId: string | null;
    createdBy: string | null;
    rows: ValidatedImportRow[];
    skippedExample: number;
    errors: string[];
  }): Promise<ImportResult> {
    const explicitIds = params.rows.map((row) => row.questionId).filter(Boolean) as string[];
    const existing = await getExistingQuestionIds(params.coupleId, explicitIds);

    const payload: QuestionInsert[] = [];
    let duplicates = 0;

    params.rows.forEach((row) => {
      if (row.questionId && existing.has(row.questionId)) {
        duplicates += 1;
        return;
      }

      payload.push({
        question_id: row.questionId,
        couple_id: params.coupleId,
        type: row.type,
        category: row.category,
        subcategory: row.subcategory,
        intensity: row.intensity,
        text: row.text,
        options: row.options,
        is_active: true,
        created_by: params.createdBy,
      });
    });

    if (payload.length > 0) {
      const { error } = await supabase.from('questions').insert(payload);
      if (error) throw error;
    }

    return {
      read: params.rows.length + params.skippedExample + params.errors.length,
      skippedExample: params.skippedExample,
      inserted: payload.length,
      duplicates,
      rejected: params.errors.length,
      errors: params.errors,
    };
  },

  async listScopeQuestions(coupleId: string | null): Promise<QuestionRow[]> {
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false });
    query = coupleId ? query.eq('couple_id', coupleId) : query.is('couple_id', null);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
