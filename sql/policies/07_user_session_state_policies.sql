DROP POLICY IF EXISTS "uss: miembros pueden leer" ON user_session_state;
CREATE POLICY "uss: miembros pueden leer"
ON user_session_state FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);

DROP POLICY IF EXISTS "uss: solo propio update" ON user_session_state;
CREATE POLICY "uss: solo propio update"
ON user_session_state FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
