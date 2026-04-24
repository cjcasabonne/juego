-- 01_tables.sql
-- Run first

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 80),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT NOT NULL UNIQUE CHECK (char_length(invite_code) BETWEEN 6 AND 16),
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (couple_id, user_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'hybrid', 'free_text')),
  category TEXT NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  subcategory TEXT NOT NULL CHECK (char_length(btrim(subcategory)) BETWEEN 1 AND 80),
  intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  text TEXT NOT NULL CHECK (char_length(btrim(text)) BETWEEN 1 AND 500),
  options JSONB CHECK (
    (type = 'free_text' AND options IS NULL)
    OR
    (type IN ('multiple_choice', 'hybrid') AND jsonb_typeof(options) = 'array')
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'phase1'
    CHECK (status IN ('phase1', 'phase2', 'phase3', 'completed')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
  UNIQUE (session_id, question_id),
  UNIQUE (session_id, position)
);

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

CREATE TABLE IF NOT EXISTS free_text_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES profiles(id),
  is_correct BOOLEAN NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
