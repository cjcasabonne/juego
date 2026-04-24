import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';

type SessionQuestionRow = Database['public']['Tables']['session_questions']['Row'];
type QuestionRow = Database['public']['Tables']['questions']['Row'];

export interface SessionQuestionWithQuestion extends SessionQuestionRow {
  question: QuestionRow;
}

export const sessionQuestionsService = {
  async listSessionQuestions(sessionId: string): Promise<SessionQuestionWithQuestion[]> {
    const { data: sessionQuestions, error: sqError } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('position', { ascending: true });

    if (sqError) throw new Error(sqError.message);

    const questionIds = sessionQuestions.map((item) => item.question_id);
    const { data: questions, error: qError } = await supabase.from('questions').select('*').in('id', questionIds);
    if (qError) throw new Error(qError.message);

    const questionMap = new Map<string, QuestionRow>(questions.map((question) => [question.id, question]));

    return sessionQuestions
      .map((item) => {
        const question = questionMap.get(item.question_id);
        if (!question) return null;
        return { ...item, question };
      })
      .filter((item): item is SessionQuestionWithQuestion => item !== null);
  },
};
