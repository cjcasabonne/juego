DROP POLICY IF EXISTS "profiles: ver propio y de parejas" ON profiles;
CREATE POLICY "profiles: ver propio y de parejas"
ON profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR id IN (
    SELECT cm2.user_id
    FROM couple_members cm1
    JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "profiles: insertar solo propio" ON profiles;
CREATE POLICY "profiles: insertar solo propio"
ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles: actualizar solo propio" ON profiles;
CREATE POLICY "profiles: actualizar solo propio"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
