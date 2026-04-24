CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_check_couple_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM couple_members WHERE couple_id = NEW.couple_id) >= 2 THEN
    RAISE EXCEPTION 'couple_full: La pareja ya tiene 2 miembros';
  END IF;
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION is_couple_member(p_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;
