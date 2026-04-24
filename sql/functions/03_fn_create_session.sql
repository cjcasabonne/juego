CREATE OR REPLACE FUNCTION fn_create_session(p_couple_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
  v_member_count INT;
  v_pool_count INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM couple_members
    WHERE couple_id = p_couple_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized: no eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM couple_members
  WHERE couple_id = p_couple_id;

  IF v_member_count != 2 THEN
    RAISE EXCEPTION 'couple_incomplete: la pareja necesita 2 miembros para iniciar una sesion';
  END IF;

  SELECT COUNT(*) INTO v_pool_count
  FROM questions
  WHERE is_active = true
    AND (couple_id IS NULL OR couple_id = p_couple_id);

  IF v_pool_count < 10 THEN
    RAISE EXCEPTION 'insufficient_questions_pool: se requieren al menos 10 preguntas activas y solo hay % para esta pareja', v_pool_count;
  END IF;

  INSERT INTO game_sessions (couple_id, created_by, status)
  VALUES (p_couple_id, auth.uid(), 'phase1')
  RETURNING id INTO v_session_id;

  INSERT INTO session_questions (session_id, question_id, position)
  SELECT v_session_id, q.id, ROW_NUMBER() OVER () AS position
  FROM (
    SELECT id
    FROM questions
    WHERE is_active = true
      AND (couple_id IS NULL OR couple_id = p_couple_id)
    ORDER BY random()
    LIMIT 10
  ) q;

  INSERT INTO user_session_state (session_id, user_id)
  SELECT v_session_id, user_id
  FROM couple_members
  WHERE couple_id = p_couple_id;

  RETURN v_session_id;
END;
$$;
