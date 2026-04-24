-- ============================================================
-- 04_rls.sql — Enable RLS and create all policies
-- Execute after 03_functions_triggers.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_text_validations ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: ver propio y de parejas"
ON profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR id IN (
    SELECT cm2.user_id FROM couple_members cm1
    JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = auth.uid()
  )
);
CREATE POLICY "profiles: insertar solo propio" ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: actualizar solo propio" ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- couples
CREATE POLICY "couples: ver solo las propias" ON couples FOR SELECT TO authenticated
USING (is_couple_member(id));
CREATE POLICY "couples: cualquiera puede crear" ON couples FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "couples: solo creador puede editar" ON couples FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- couple_members (INSERT bloqueado para usuarios directos; solo via fn_join_couple)
CREATE POLICY "couple_members: ver miembros de tus parejas" ON couple_members FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
CREATE POLICY "couple_members: salir solo propio" ON couple_members FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- questions (global)
CREATE POLICY "questions_global: todos pueden leer activas" ON questions FOR SELECT TO authenticated
USING (couple_id IS NULL AND is_active = true);

-- questions (couple)
CREATE POLICY "questions_couple: miembros pueden leer" ON questions FOR SELECT TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id));
CREATE POLICY "questions_couple: miembros pueden insertar" ON questions FOR INSERT TO authenticated
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id) AND created_by = auth.uid());
CREATE POLICY "questions_couple: miembros pueden desactivar" ON questions FOR UPDATE TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id))
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id));

-- game_sessions (INSERT via fn_create_session; UPDATE via trigger SECURITY DEFINER)
CREATE POLICY "game_sessions: miembros pueden leer" ON game_sessions FOR SELECT TO authenticated
USING (is_couple_member(couple_id));

-- session_questions (INSERT/UPDATE/DELETE bloqueado — solo via fn_create_session)
CREATE POLICY "session_questions: miembros pueden leer" ON session_questions FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);

-- user_session_state (INSERT bloqueado — solo via fn_create_session)
CREATE POLICY "uss: miembros pueden leer" ON user_session_state FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);
CREATE POLICY "uss: solo propio update" ON user_session_state FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- answers
CREATE POLICY "answers: ver propias siempre" ON answers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "answers: ver de pareja en fase 3" ON answers FOR SELECT TO authenticated
USING (
  user_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "answers: insertar propias en phase1" ON answers FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase1'
);

-- predictions
CREATE POLICY "predictions: ver propias siempre" ON predictions FOR SELECT TO authenticated
USING (predictor_id = auth.uid());

CREATE POLICY "predictions: ver de pareja en fase 3" ON predictions FOR SELECT TO authenticated
USING (
  predictor_id != auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "predictions: insertar propias en phase2" ON predictions FOR INSERT TO authenticated
WITH CHECK (
  predictor_id = auth.uid()
  AND is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase2'
);

-- free_text_validations
CREATE POLICY "ftv: miembros pueden leer" ON free_text_validations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM predictions p
    JOIN game_sessions gs ON gs.id = p.session_id
    WHERE p.id = prediction_id
      AND is_couple_member(gs.couple_id)
  )
);

CREATE POLICY "ftv: solo respondente puede validar" ON free_text_validations FOR INSERT TO authenticated
WITH CHECK (
  validator_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM answers a
    JOIN predictions p ON p.id = prediction_id
    WHERE a.session_id = p.session_id
      AND a.question_id = p.question_id
      AND a.user_id = auth.uid()
  )
);
