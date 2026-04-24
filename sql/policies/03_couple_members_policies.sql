DROP POLICY IF EXISTS "couple_members: ver miembros de tus parejas" ON couple_members;
CREATE POLICY "couple_members: ver miembros de tus parejas"
ON couple_members FOR SELECT TO authenticated
USING (is_couple_member(couple_id));

DROP POLICY IF EXISTS "couple_members: salir solo propio" ON couple_members;
CREATE POLICY "couple_members: salir solo propio"
ON couple_members FOR DELETE TO authenticated
USING (user_id = auth.uid());
