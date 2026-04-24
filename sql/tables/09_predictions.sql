CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  predictor_id UUID NOT NULL REFERENCES profiles(id),
  predicted_option_id TEXT,
  predicted_free_text TEXT CHECK (predicted_free_text IS NULL OR char_length(btrim(predicted_free_text)) BETWEEN 1 AND 1000),
  is_correct BOOLEAN,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (predicted_option_id IS NOT NULL AND predicted_free_text IS NULL)
    OR
    (predicted_option_id IS NULL AND predicted_free_text IS NOT NULL)
  ),
  UNIQUE (session_id, question_id, predictor_id)
);
