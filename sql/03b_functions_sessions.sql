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
    RAISE EXCEPTION 'invalid_code: codigo de invitacion no valido';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'expired_code: el codigo de invitacion expiro';
  END IF;

  IF EXISTS (SELECT 1 FROM couple_members WHERE couple_id = v_couple_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already_member: ya eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = v_couple_id;
  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: la pareja ya esta completa';
  END IF;

  INSERT INTO couple_members (couple_id, user_id) VALUES (v_couple_id, auth.uid());

  RETURN v_couple_id;
END;
$$;
