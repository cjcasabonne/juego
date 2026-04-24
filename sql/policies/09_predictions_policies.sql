DROP POLICY IF EXISTS "predictions: ver propias siempre" ON predictions;
CREATE POLICY "predictions: ver propias siempre"
ON predictions FOR SELECT TO authenticated
USING (predictor_id = auth.uid());

DROP POLICY IF EXISTS "predictions: ver de pareja en fase 3" ON predictions;
CREATE POLICY "predictions: ver de pareja en fase 3"
ON predictions FOR SELECT TO authenticated
USING (
  predictor_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

DROP POLICY IF EXISTS "predictions: insertar propias en phase2" ON predictions;
CREATE POLICY "predictions: insertar propias en phase2"
ON predictions FOR INSERT TO authenticated
WITH CHECK (
  predictor_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase2'
);
