CREATE TABLE IF NOT EXISTS user_session_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  phase1_completed BOOLEAN NOT NULL DEFAULT false,
  phase1_completed_at TIMESTAMPTZ,
  phase2_completed BOOLEAN NOT NULL DEFAULT false,
  phase2_completed_at TIMESTAMPTZ,
  reveal_position SMALLINT NOT NULL DEFAULT 0 CHECK (reveal_position BETWEEN 0 AND 10),
  UNIQUE (session_id, user_id)
);
