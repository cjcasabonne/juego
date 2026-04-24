import { supabase } from '../../lib/supabase';
import type { Database } from '../../shared/types/db';
import { resolveOptionText } from '../../shared/utils/questions';
import { sessionQuestionsService } from './session-questions.service';

type AnswerRow = Database['public']['Tables']['answers']['Row'];
type PredictionRow = Database['public']['Tables']['predictions']['Row'];
type ValidationRow = Database['public']['Tables']['free_text_validations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface SessionScoreDetailRow {
  predictionId: string;
  questionId: string;
  questionText: string;
  position: number;
  predictedText: string;
  actualText: string;
  result: 'correct' | 'incorrect' | 'pending';
}

export interface SessionScoreRow {
  predictorId: string;
  displayName: string;
  correct: number;
  scoredTotal: number;
  pending: number;
  details: SessionScoreDetailRow[];
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

async function listAnswers(sessionId: string): Promise<AnswerRow[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('answered_at', { ascending: true });

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
    const [predictions, validations, answers, sessionQuestions] = await Promise.all([
      listPredictions(sessionId),
      listValidations(),
      listAnswers(sessionId),
      sessionQuestionsService.listSessionQuestions(sessionId),
    ]);

    const validationMap = new Map<string, ValidationRow>(validations.map((item) => [item.prediction_id, item]));
    const predictorIds = [...new Set(predictions.map((prediction) => prediction.predictor_id))];
    const profiles = await listProfiles(predictorIds);
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const sessionQuestionMap = new Map(sessionQuestions.map((item) => [item.question_id, item]));

    const scores = predictorIds.map<SessionScoreRow>((predictorId) => ({
      predictorId,
      displayName: profileMap.get(predictorId)?.display_name ?? predictorId.slice(0, 8),
      correct: 0,
      scoredTotal: 0,
      pending: 0,
      details: [],
    }));

    const scoreMap = new Map(scores.map((score) => [score.predictorId, score]));

    predictions.forEach((prediction) => {
      const target = scoreMap.get(prediction.predictor_id);
      if (!target) return;

      const sessionQuestion = sessionQuestionMap.get(prediction.question_id);
      const answer = answers.find(
        (item) => item.question_id === prediction.question_id && item.user_id !== prediction.predictor_id,
      );
      const validation = validationMap.get(prediction.id);

      const predictedText = prediction.predicted_free_text
        ?? resolveOptionText(sessionQuestion?.question.options, prediction.predicted_option_id, 'Sin prediccion');
      const actualText = answer?.free_text
        ?? resolveOptionText(sessionQuestion?.question.options, answer?.selected_option_id, 'Sin respuesta');

      let result: SessionScoreDetailRow['result'] = 'pending';

      if (prediction.is_correct !== null) {
        target.scoredTotal += 1;
        if (prediction.is_correct) target.correct += 1;
        result = prediction.is_correct ? 'correct' : 'incorrect';
      } else if (validation) {
        target.scoredTotal += 1;
        if (validation.is_correct) target.correct += 1;
        result = validation.is_correct ? 'correct' : 'incorrect';
      } else {
        target.pending += 1;
      }

      target.details.push({
        predictionId: prediction.id,
        questionId: prediction.question_id,
        questionText: sessionQuestion?.question.text ?? 'Pregunta sin texto',
        position: sessionQuestion?.position ?? target.details.length + 1,
        predictedText,
        actualText,
        result,
      });
    });

    scores.forEach((score) => {
      score.details.sort((a, b) => a.position - b.position);
    });

    return scores.sort((a, b) => b.correct - a.correct);
  },
};
