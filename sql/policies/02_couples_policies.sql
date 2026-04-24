DROP POLICY IF EXISTS "couples: ver solo las propias" ON couples;
CREATE POLICY "couples: ver solo las propias"
ON couples FOR SELECT TO authenticated
USING (is_couple_member(id));

DROP POLICY IF EXISTS "couples: cualquiera puede crear" ON couples;
CREATE POLICY "couples: cualquiera puede crear"
ON couples FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "couples: solo creador puede editar" ON couples;
CREATE POLICY "couples: solo creador puede editar"
ON couples FOR UPDATE TO authenticated
USING (created_by = auth.uid());
