DROP POLICY IF EXISTS "game_sessions: miembros pueden leer" ON game_sessions;
CREATE POLICY "game_sessions: miembros pueden leer"
ON game_sessions FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
