CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  selected_option_id TEXT,
  free_text TEXT CHECK (free_text IS NULL OR char_length(btrim(free_text)) BETWEEN 1 AND 1000),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, user_id)
);
