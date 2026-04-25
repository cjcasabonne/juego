ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS category TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'game_sessions_category_not_blank'
  ) THEN
    ALTER TABLE public.game_sessions
      ADD CONSTRAINT game_sessions_category_not_blank
      CHECK (category IS NULL OR char_length(btrim(category)) BETWEEN 1 AND 80);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fn_create_session(p_couple_id UUID, p_category TEXT)
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
