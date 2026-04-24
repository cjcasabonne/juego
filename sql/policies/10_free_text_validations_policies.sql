DROP POLICY IF EXISTS "ftv: miembros pueden leer" ON free_text_validations;
CREATE POLICY "ftv: miembros pueden leer"
ON free_text_validations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM predictions p
    JOIN game_sessions gs ON gs.id = p.session_id
    WHERE p.id = prediction_id
      AND is_couple_member(gs.couple_id)
  )
);

DROP POLICY IF EXISTS "ftv: solo respondente puede validar" ON free_text_validations;
CREATE POLICY "ftv: solo respondente puede validar"
ON free_text_validations FOR INSERT TO authenticated
WITH CHECK (
  validator_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM answers a
    JOIN predictions p ON p.id = prediction_id
    WHERE a.session_id = p.session_id
      AND a.question_id = p.question_id
      AND a.user_id = auth.uid()
  )
);
