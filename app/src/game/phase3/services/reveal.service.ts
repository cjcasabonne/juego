import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../shared/types/db';
import { sessionQuestionsService, type SessionQuestionWithQuestion } from '../../../sessions/services/session-questions.service';

type AnswerRow = Database['public']['Tables']['answers']['Row'];
type PredictionRow = Database['public']['Tables']['predictions']['Row'];
type ValidationRow = Database['public']['Tables']['free_text_validations']['Row'];

export interface RevealItem extends SessionQuestionWithQuestion {
  myAnswer: AnswerRow | null;
  partnerAnswer: AnswerRow | null;
  myPrediction: PredictionRow | null;
  partnerPrediction: PredictionRow | null;
  myPredictionValidation: ValidationRow | null;
  partnerPredictionValidation: ValidationRow | null;
}

async function listAnswers(sessionId: string): Promise<AnswerRow[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('answered_at', { ascending: true });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase.from('free_text_validations').select('*').order('validated_at', { ascending: true });
  if (error) throw error;
  return data;
}

export const revealService = {
  async getRevealFeed(sessionId: string, userId: string): Promise<RevealItem[]> {
    const [sessionQuestions, answers, predictions, validations] = await Promise.all([
      sessionQuestionsService.listSessionQuestions(sessionId),
      listAnswers(sessionId),
      listPredictions(sessionId),
      listValidations(),
    ]);

    const validationMap = new Map<string, ValidationRow>(validations.map((item) => [item.prediction_id, item]));

    return sessionQuestions.map((item) => {
      const answerSet = answers.filter((answer) => answer.question_id === item.question_id);
      const predictionSet = predictions.filter((prediction) => prediction.question_id === item.question_id);

      const myAnswer = answerSet.find((answer) => answer.user_id === userId) ?? null;
      const partnerAnswer = answerSet.find((answer) => answer.user_id !== userId) ?? null;
      const myPrediction = predictionSet.find((prediction) => prediction.predictor_id === userId) ?? null;
      const partnerPrediction = predictionSet.find((prediction) => prediction.predictor_id !== userId) ?? null;

      return {
        ...item,
        myAnswer,
        partnerAnswer,
        myPrediction,
        partnerPrediction,
        myPredictionValidation: myPrediction ? validationMap.get(myPrediction.id) ?? null : null,
        partnerPredictionValidation: partnerPrediction ? validationMap.get(partnerPrediction.id) ?? null : null,
      };
    });
  },
};
