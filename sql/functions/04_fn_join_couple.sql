CREATE OR REPLACE FUNCTION fn_join_couple(p_invite_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_member_count INT;
BEGIN
  SELECT id, invite_expires_at INTO v_couple_id, v_expires_at
  FROM couples
  WHERE invite_code = p_invite_code;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code: codigo de invitacion no valido';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'expired_code: el codigo de invitacion expiro';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM couple_members
    WHERE couple_id = v_couple_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_member: ya eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM couple_members
  WHERE couple_id = v_couple_id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: la pareja ya esta completa';
  END IF;

  INSERT INTO couple_members (couple_id, user_id)
  VALUES (v_couple_id, auth.uid());

  RETURN v_couple_id;
END;
$$;
