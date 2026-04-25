-- ============================================================
-- 00_apply_all.sql
-- Ejecutar en Supabase SQL Editor sobre schema vacio
-- Orden consolidado:
--   1) tablas
--   2) indices
--   3) funciones y triggers
--   4) RLS y policies
-- ============================================================

-- ------------------------------------------------------------
-- 01_tables.sql
-- ------------------------------------------------------------

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 80),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE couples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  invite_code       TEXT NOT NULL UNIQUE CHECK (char_length(invite_code) BETWEEN 6 AND 16),
  invite_expires_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE couple_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (couple_id, user_id)
);

CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT,
  couple_id   UUID REFERENCES couples(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('multiple_choice', 'hybrid', 'free_text')),
  category    TEXT NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  subcategory TEXT NOT NULL CHECK (char_length(btrim(subcategory)) BETWEEN 1 AND 80),
  intensity   SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  text        TEXT NOT NULL CHECK (char_length(btrim(text)) BETWEEN 1 AND 500),
  options     JSONB CHECK (
               (type = 'free_text' AND options IS NULL)
               OR
               (type IN ('multiple_choice', 'hybrid') AND jsonb_typeof(options) = 'array')
             ),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category     TEXT CHECK (category IS NULL OR char_length(btrim(category)) BETWEEN 1 AND 80),
  status       TEXT NOT NULL DEFAULT 'phase1'
               CHECK (status IN ('phase1', 'phase2', 'phase3', 'completed')),
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE session_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
  UNIQUE (session_id, question_id),
  UNIQUE (session_id, position)
);

CREATE TABLE user_session_state (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES profiles(id),
  phase1_completed     BOOLEAN NOT NULL DEFAULT false,
  phase1_completed_at  TIMESTAMPTZ,
  phase2_completed     BOOLEAN NOT NULL DEFAULT false,
  phase2_completed_at  TIMESTAMPTZ,
  reveal_position      SMALLINT NOT NULL DEFAULT 0 CHECK (reveal_position BETWEEN 0 AND 10),
  UNIQUE (session_id, user_id)
);

CREATE TABLE answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES questions(id),
  user_id            UUID NOT NULL REFERENCES profiles(id),
  selected_option_id TEXT,
  free_text          TEXT CHECK (free_text IS NULL OR char_length(btrim(free_text)) BETWEEN 1 AND 1000),
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, user_id)
);

CREATE TABLE predictions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id          UUID NOT NULL REFERENCES questions(id),
  predictor_id         UUID NOT NULL REFERENCES profiles(id),
  predicted_option_id  TEXT,
  predicted_free_text  TEXT CHECK (predicted_free_text IS NULL OR char_length(btrim(predicted_free_text)) BETWEEN 1 AND 1000),
  is_correct           BOOLEAN,
  predicted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (predicted_option_id IS NOT NULL AND predicted_free_text IS NULL)
    OR
    (predicted_option_id IS NULL AND predicted_free_text IS NOT NULL)
  ),
  UNIQUE (session_id, question_id, predictor_id)
);

CREATE TABLE free_text_validations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  validator_id  UUID NOT NULL REFERENCES profiles(id),
  is_correct    BOOLEAN NOT NULL,
  validated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 02_indexes.sql
-- ------------------------------------------------------------

CREATE INDEX idx_couples_invite_code ON couples(invite_code);
CREATE INDEX idx_couple_members_user_id ON couple_members(user_id);
CREATE INDEX idx_couple_members_couple_id ON couple_members(couple_id);
CREATE UNIQUE INDEX uq_questions_global_question_id
  ON questions(question_id)
  WHERE question_id IS NOT NULL AND couple_id IS NULL;
CREATE UNIQUE INDEX uq_questions_couple_question_id
  ON questions(couple_id, question_id)
  WHERE question_id IS NOT NULL AND couple_id IS NOT NULL;
CREATE INDEX idx_questions_couple_id ON questions(couple_id);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_import_lookup
  ON questions(couple_id, question_id)
  WHERE question_id IS NOT NULL;
CREATE INDEX idx_game_sessions_couple_id ON game_sessions(couple_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status) WHERE status != 'completed';
CREATE INDEX idx_game_sessions_active_by_couple
  ON game_sessions(couple_id, created_at DESC)
  WHERE status != 'completed';
CREATE INDEX idx_session_questions_session ON session_questions(session_id, position);
CREATE INDEX idx_user_session_state_session ON user_session_state(session_id, user_id);
CREATE INDEX idx_answers_session_user ON answers(session_id, user_id);
CREATE INDEX idx_answers_lookup ON answers(session_id, question_id, user_id);
CREATE INDEX idx_predictions_session_predictor ON predictions(session_id, predictor_id);
CREATE INDEX idx_predictions_free_text_pending
  ON predictions(session_id, question_id)
  WHERE predicted_free_text IS NOT NULL AND is_correct IS NULL;

-- ------------------------------------------------------------
-- 03_functions_triggers.sql
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

CREATE OR REPLACE FUNCTION fn_check_couple_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM couple_members WHERE couple_id = NEW.couple_id) >= 2 THEN
    RAISE EXCEPTION 'couple_full: La pareja ya tiene 2 miembros';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_couple_capacity
BEFORE INSERT ON couple_members
FOR EACH ROW EXECUTE FUNCTION fn_check_couple_capacity();

CREATE OR REPLACE FUNCTION fn_protect_phase_flags()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.phase1_completed = true AND NEW.phase1_completed = false THEN
    RAISE EXCEPTION 'immutable: phase1_completed no puede revertirse';
  END IF;
  IF OLD.phase2_completed = true AND NEW.phase2_completed = false THEN
    RAISE EXCEPTION 'immutable: phase2_completed no puede revertirse';
  END IF;
  IF NEW.phase1_completed = true AND OLD.phase1_completed = false THEN
    NEW.phase1_completed_at := now();
  END IF;
  IF NEW.phase2_completed = true AND OLD.phase2_completed = false THEN
    NEW.phase2_completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_phase_flags
BEFORE UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_protect_phase_flags();

CREATE OR REPLACE FUNCTION fn_validate_answer_payload()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_question_type TEXT;
BEGIN
  SELECT type INTO v_question_type FROM questions WHERE id = NEW.question_id;

  IF v_question_type = 'multiple_choice' THEN
    IF NEW.selected_option_id IS NULL OR NEW.free_text IS NOT NULL THEN
      RAISE EXCEPTION 'invalid_answer_payload: multiple_choice requiere selected_option_id y free_text debe ser NULL';
    END IF;
  ELSIF v_question_type = 'hybrid' THEN
    IF NEW.selected_option_id IS NULL THEN
      RAISE EXCEPTION 'invalid_answer_payload: hybrid requiere selected_option_id';
    END IF;
  ELSIF v_question_type = 'free_text' THEN
    IF NEW.selected_option_id IS NOT NULL OR NEW.free_text IS NULL THEN
      RAISE EXCEPTION 'invalid_answer_payload: free_text requiere free_text y selected_option_id debe ser NULL';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_answer_payload: tipo de pregunta desconocido';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_answer_payload
BEFORE INSERT OR UPDATE ON answers
FOR EACH ROW EXECUTE FUNCTION fn_validate_answer_payload();

CREATE OR REPLACE FUNCTION fn_check_phase_advancement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status    TEXT;
  v_both_done BOOLEAN;
BEGIN
  IF (NEW.phase1_completed = OLD.phase1_completed) AND
     (NEW.phase2_completed = OLD.phase2_completed) AND
     (NEW.reveal_position = OLD.reveal_position) THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM game_sessions WHERE id = NEW.session_id;

  IF NEW.phase1_completed = true AND v_status = 'phase1' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase1_completed = true;

    IF v_both_done THEN
      UPDATE game_sessions SET status = 'phase2'
      WHERE id = NEW.session_id AND status = 'phase1';
    END IF;

  ELSIF NEW.phase2_completed = true AND v_status = 'phase2' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase2_completed = true;

    IF v_both_done THEN
      UPDATE game_sessions SET status = 'phase3'
      WHERE id = NEW.session_id AND status = 'phase2';
    END IF;

  ELSIF NEW.reveal_position = 10 AND v_status = 'phase3' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND reveal_position = 10;

    IF v_both_done THEN
      UPDATE game_sessions
      SET status = 'completed', completed_at = now()
      WHERE id = NEW.session_id AND status = 'phase3' AND completed_at IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phase_advancement
AFTER UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_check_phase_advancement();

CREATE OR REPLACE FUNCTION fn_calculate_prediction_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_question_type  TEXT;
  v_session_status TEXT;
  v_partner_id     UUID;
  v_target_answer  TEXT;
BEGIN
  SELECT status INTO v_session_status FROM game_sessions WHERE id = NEW.session_id;

  IF v_session_status != 'phase2' THEN
    RAISE EXCEPTION 'invalid_prediction_state: solo se permiten predicciones en phase2';
  END IF;

  SELECT type INTO v_question_type FROM questions WHERE id = NEW.question_id;

  IF v_question_type = 'free_text' THEN
    IF NEW.predicted_free_text IS NULL OR NEW.predicted_option_id IS NOT NULL THEN
      RAISE EXCEPTION 'invalid_prediction_payload: free_text requiere predicted_free_text';
    END IF;
    NEW.is_correct := NULL;
    RETURN NEW;
  ELSIF v_question_type IN ('multiple_choice', 'hybrid') THEN
    IF NEW.predicted_option_id IS NULL OR NEW.predicted_free_text IS NOT NULL THEN
      RAISE EXCEPTION 'invalid_prediction_payload: multiple_choice/hybrid requiere predicted_option_id';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_prediction_payload: tipo de pregunta desconocido';
  END IF;

  SELECT user_id INTO v_partner_id
  FROM user_session_state
  WHERE session_id = NEW.session_id AND user_id != NEW.predictor_id
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    NEW.is_correct := NULL;
    RETURN NEW;
  END IF;

  SELECT selected_option_id INTO v_target_answer
  FROM answers
  WHERE session_id = NEW.session_id
    AND question_id = NEW.question_id
    AND user_id = v_partner_id;

  IF v_target_answer IS NULL THEN
    NEW.is_correct := NULL;
    RETURN NEW;
  END IF;

  NEW.is_correct := (NEW.predicted_option_id = v_target_answer);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_score_prediction
BEFORE INSERT ON predictions
FOR EACH ROW EXECUTE FUNCTION fn_calculate_prediction_score();

CREATE OR REPLACE FUNCTION is_couple_member(p_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION fn_create_session(p_couple_id UUID, p_category TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id   UUID;
  v_member_count INT;
  v_pool_count   INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized: no eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = p_couple_id;
  IF v_member_count != 2 THEN
    RAISE EXCEPTION 'couple_incomplete: la pareja necesita 2 miembros para iniciar una sesión';
  END IF;

  SELECT COUNT(*) INTO v_pool_count FROM questions
  WHERE is_active = true AND (couple_id IS NULL OR couple_id = p_couple_id);

  IF v_pool_count < 10 THEN
    RAISE EXCEPTION 'insufficient_questions_pool: se requieren al menos 10 preguntas activas y solo hay % para esta pareja', v_pool_count;
  END IF;

  INSERT INTO game_sessions (couple_id, created_by, status)
  VALUES (p_couple_id, auth.uid(), 'phase1')
  RETURNING id INTO v_session_id;

  INSERT INTO session_questions (session_id, question_id, position)
  SELECT v_session_id, q.id, ROW_NUMBER() OVER () AS position
  FROM (
    SELECT id FROM questions
    WHERE is_active = true AND (couple_id IS NULL OR couple_id = p_couple_id)
    ORDER BY random()
    LIMIT 10
  ) q;

  INSERT INTO user_session_state (session_id, user_id)
  SELECT v_session_id, user_id FROM couple_members WHERE couple_id = p_couple_id;

  RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_join_couple(p_invite_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id    UUID;
  v_expires_at   TIMESTAMPTZ;
  v_member_count INT;
BEGIN
  SELECT id, invite_expires_at INTO v_couple_id, v_expires_at
  FROM couples WHERE invite_code = p_invite_code;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code: código de invitación no válido';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'expired_code: el código de invitación expiró';
  END IF;

  IF EXISTS (SELECT 1 FROM couple_members WHERE couple_id = v_couple_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already_member: ya eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = v_couple_id;
  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: la pareja ya está completa';
  END IF;

  INSERT INTO couple_members (couple_id, user_id) VALUES (v_couple_id, auth.uid());

  RETURN v_couple_id;
END;
$$;

-- ------------------------------------------------------------
-- 04_rls.sql
-- ------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_text_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: ver propio y de parejas"
ON profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR id IN (
    SELECT cm2.user_id FROM couple_members cm1
    JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = auth.uid()
  )
);
CREATE POLICY "profiles: insertar solo propio" ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: actualizar solo propio" ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "couples: ver solo las propias" ON couples FOR SELECT TO authenticated
USING (is_couple_member(id));
CREATE POLICY "couples: cualquiera puede crear" ON couples FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "couples: solo creador puede editar" ON couples FOR UPDATE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "couple_members: ver miembros de tus parejas" ON couple_members FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
CREATE POLICY "couple_members: salir solo propio" ON couple_members FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "questions_global: todos pueden leer activas" ON questions FOR SELECT TO authenticated
USING (couple_id IS NULL AND is_active = true);

CREATE POLICY "questions_couple: miembros pueden leer" ON questions FOR SELECT TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id));
CREATE POLICY "questions_couple: miembros pueden insertar" ON questions FOR INSERT TO authenticated
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id) AND created_by = auth.uid());
CREATE POLICY "questions_couple: miembros pueden desactivar" ON questions FOR UPDATE TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id))
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id));

CREATE POLICY "game_sessions: miembros pueden leer" ON game_sessions FOR SELECT TO authenticated
USING (is_couple_member(couple_id));

CREATE POLICY "session_questions: miembros pueden leer" ON session_questions FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);

CREATE POLICY "uss: miembros pueden leer" ON user_session_state FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);
CREATE POLICY "uss: solo propio update" ON user_session_state FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "answers: ver propias siempre" ON answers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "answers: ver de pareja en fase 3" ON answers FOR SELECT TO authenticated
USING (
  user_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "answers: insertar propias en phase1" ON answers FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase1'
);

CREATE POLICY "predictions: ver propias siempre" ON predictions FOR SELECT TO authenticated
USING (predictor_id = auth.uid());

CREATE POLICY "predictions: ver de pareja en fase 3" ON predictions FOR SELECT TO authenticated
USING (
  predictor_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "predictions: insertar propias en phase2" ON predictions FOR INSERT TO authenticated
WITH CHECK (
  predictor_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase2'
);

CREATE POLICY "ftv: miembros pueden leer" ON free_text_validations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM predictions p
    JOIN game_sessions gs ON gs.id = p.session_id
    WHERE p.id = prediction_id
      AND is_couple_member(gs.couple_id)
  )
);

CREATE POLICY "ftv: solo respondente puede validar" ON free_text_validations FOR INSERT TO authenticated
WITH CHECK (
  validator_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM answers a
    JOIN predictions p ON p.id = prediction_id
    WHERE a.session_id = p.session_id
      AND a.question_id = p.question_id
      AND a.user_id = auth.uid()
  )
);

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS category TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'game_sessions_category_not_blank'
  ) THEN
    ALTER TABLE game_sessions
      ADD CONSTRAINT game_sessions_category_not_blank
      CHECK (category IS NULL OR char_length(btrim(category)) BETWEEN 1 AND 80);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION fn_create_session(p_couple_id UUID, p_category TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id   UUID;
  v_member_count INT;
  v_pool_count   INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized: no eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = p_couple_id;
  IF v_member_count != 2 THEN
    RAISE EXCEPTION 'couple_incomplete: la pareja necesita 2 miembros para iniciar una sesion';
  END IF;

  IF p_category IS NULL OR char_length(btrim(p_category)) = 0 THEN
    RAISE EXCEPTION 'invalid_category: debes elegir una categoria para iniciar la sesion';
  END IF;

  SELECT COUNT(*) INTO v_pool_count FROM questions
  WHERE is_active = true
    AND category = p_category
    AND (couple_id IS NULL OR couple_id = p_couple_id)
    AND NOT EXISTS (
      SELECT 1
      FROM session_questions sq
      JOIN game_sessions gs ON gs.id = sq.session_id
      WHERE sq.question_id = questions.id
        AND gs.couple_id = p_couple_id
        AND gs.status = 'completed'
    );

  IF v_pool_count < 10 THEN
    RAISE EXCEPTION 'insufficient_questions_pool: se requieren al menos 10 preguntas activas sin repetir en la categoria % y solo hay % disponibles para esta pareja', p_category, v_pool_count;
  END IF;

  INSERT INTO game_sessions (couple_id, category, created_by, status)
  VALUES (p_couple_id, p_category, auth.uid(), 'phase1')
  RETURNING id INTO v_session_id;

  INSERT INTO session_questions (session_id, question_id, position)
  SELECT v_session_id, q.id, ROW_NUMBER() OVER () AS position
  FROM (
    SELECT id FROM questions
    WHERE is_active = true
      AND category = p_category
      AND (couple_id IS NULL OR couple_id = p_couple_id)
      AND NOT EXISTS (
        SELECT 1
        FROM session_questions sq
        JOIN game_sessions gs ON gs.id = sq.session_id
        WHERE sq.question_id = questions.id
          AND gs.couple_id = p_couple_id
          AND gs.status = 'completed'
      )
    ORDER BY random()
    LIMIT 10
  ) q;

  INSERT INTO user_session_state (session_id, user_id)
  SELECT v_session_id, user_id FROM couple_members WHERE couple_id = p_couple_id;

  RETURN v_session_id;
END;
$$;
