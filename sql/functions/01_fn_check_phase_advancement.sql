CREATE OR REPLACE FUNCTION fn_check_phase_advancement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status TEXT;
  v_both_done BOOLEAN;
BEGIN
  IF (NEW.phase1_completed = OLD.phase1_completed) AND
     (NEW.phase2_completed = OLD.phase2_completed) AND
     (NEW.reveal_position = OLD.reveal_position) THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status
  FROM game_sessions
  WHERE id = NEW.session_id;

  IF NEW.phase1_completed = true AND v_status = 'phase1' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id
      AND phase1_completed = true;

    IF v_both_done THEN
      UPDATE game_sessions
      SET status = 'phase2'
      WHERE id = NEW.session_id
        AND status = 'phase1';
    END IF;
  ELSIF NEW.phase2_completed = true AND v_status = 'phase2' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id
      AND phase2_completed = true;

    IF v_both_done THEN
      UPDATE game_sessions
      SET status = 'phase3'
      WHERE id = NEW.session_id
        AND status = 'phase2';
    END IF;
  ELSIF NEW.reveal_position = 10 AND v_status = 'phase3' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id
      AND reveal_position = 10;

    IF v_both_done THEN
      UPDATE game_sessions
      SET status = 'completed',
          completed_at = now()
      WHERE id = NEW.session_id
        AND status = 'phase3'
        AND completed_at IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
