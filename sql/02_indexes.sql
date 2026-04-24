-- 02_indexes.sql
-- Run after 01_tables.sql

CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);

CREATE INDEX IF NOT EXISTS idx_couple_members_user_id ON couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id ON couple_members(couple_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_global_question_id
  ON questions(question_id)
  WHERE question_id IS NOT NULL AND couple_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_couple_question_id
  ON questions(couple_id, question_id)
  WHERE question_id IS NOT NULL AND couple_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_couple_id ON questions(couple_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_questions_import_lookup
  ON questions(couple_id, question_id)
  WHERE question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_sessions_couple_id ON game_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status) WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_game_sessions_active_by_couple
  ON game_sessions(couple_id, created_at DESC)
  WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id, position);

CREATE INDEX IF NOT EXISTS idx_user_session_state_session ON user_session_state(session_id, user_id);

CREATE INDEX IF NOT EXISTS idx_answers_session_user ON answers(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_answers_lookup ON answers(session_id, question_id, user_id);

CREATE INDEX IF NOT EXISTS idx_predictions_session_predictor ON predictions(session_id, predictor_id);

CREATE INDEX IF NOT EXISTS idx_predictions_free_text_pending
  ON predictions(session_id, question_id)
  WHERE predicted_free_text IS NOT NULL AND is_correct IS NULL;
