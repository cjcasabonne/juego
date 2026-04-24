CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
  UNIQUE (session_id, question_id),
  UNIQUE (session_id, position)
);
