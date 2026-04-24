DROP POLICY IF EXISTS "answers: ver propias siempre" ON answers;
CREATE POLICY "answers: ver propias siempre"
ON answers FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "answers: ver de pareja en fase 3" ON answers;
CREATE POLICY "answers: ver de pareja en fase 3"
ON answers FOR SELECT TO authenticated
USING (
  user_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

DROP POLICY IF EXISTS "answers: insertar propias en phase1" ON answers;
CREATE POLICY "answers: insertar propias en phase1"
ON answers FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase1'
);
