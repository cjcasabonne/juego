DROP POLICY IF EXISTS "questions_global: todos pueden leer activas" ON questions;
CREATE POLICY "questions_global: todos pueden leer activas"
ON questions FOR SELECT TO authenticated
USING (couple_id IS NULL AND is_active = true);

DROP POLICY IF EXISTS "questions_couple: miembros pueden leer" ON questions;
CREATE POLICY "questions_couple: miembros pueden leer"
ON questions FOR SELECT TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id));

DROP POLICY IF EXISTS "questions_couple: miembros pueden insertar" ON questions;
CREATE POLICY "questions_couple: miembros pueden insertar"
ON questions FOR INSERT TO authenticated
WITH CHECK (
  couple_id IS NOT NULL
  AND is_couple_member(couple_id)
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "questions_couple: miembros pueden desactivar" ON questions;
CREATE POLICY "questions_couple: miembros pueden desactivar"
ON questions FOR UPDATE TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id))
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id));
