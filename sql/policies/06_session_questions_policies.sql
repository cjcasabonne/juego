DROP POLICY IF EXISTS "session_questions: miembros pueden leer" ON session_questions;
CREATE POLICY "session_questions: miembros pueden leer"
ON session_questions FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);
