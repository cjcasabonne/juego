CREATE OR REPLACE FUNCTION fn_calculate_prediction_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_question_type TEXT;
  v_session_status TEXT;
  v_partner_id UUID;
  v_target_answer TEXT;
BEGIN
  SELECT status INTO v_session_status
  FROM game_sessions
  WHERE id = NEW.session_id;

  IF v_session_status != 'phase2' THEN
    RAISE EXCEPTION 'invalid_prediction_state: solo se permiten predicciones en phase2';
  END IF;

  SELECT type INTO v_question_type
  FROM questions
  WHERE id = NEW.question_id;

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
  WHERE session_id = NEW.session_id
    AND user_id != NEW.predictor_id
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
