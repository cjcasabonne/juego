# ARQUITECTURA — WEBAPP DE JUEGO PARA PAREJAS (v2 base)

---

## A. DIAGNÓSTICO DEL PROBLEMA REAL

Un motor de juego emocional stateful con sincronización asimétrica entre dos jugadores. No es un quiz: es una máquina de estados distribuida donde la información debe estar parcialmente oculta hasta que las condiciones del juego lo permiten.

**Complejidad real:**
1. Gating de fases — vive en DB, no en frontend
2. Asimetría de información — RLS, no lógica de UI
3. Estado bifurcado global (sesión) vs individual (usuario dentro de sesión)
4. Múltiples sesiones coexistentes por pareja
5. Importación idempotente de preguntas

---

## B. ARQUITECTURA FINAL PROPUESTA

```
┌──────────────────────────────────────────────────────┐
│               Cloudflare Pages                        │
│               React + Vite (SPA)                      │
│  - UX, navegación, estado local de formularios        │
│  - Supabase JS client directo                         │
│  - SheetJS para parse/export Excel (client-side)      │
│  - Supabase Realtime (solo cambios de fase)           │
└─────────────────────────┬────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼────────────────────────────┐
│                     Supabase                           │
│  Auth · PostgreSQL + RLS + Triggers · Realtime         │
└───────────────────────────────────────────────────────┘
```

| Componente | Responsabilidad |
|---|---|
| React + Vite | UX, routing, estado de formularios en memoria |
| Supabase Auth | Identidad, JWT |
| PostgreSQL + RLS | Todo el estado del juego, control de acceso, transiciones |
| Triggers SQL | Avance automático de fase |
| Supabase Realtime | Notificar cambio de `game_sessions.status` |
| SheetJS (browser) | Parse y generación de .xlsx sin servidor |
| Cloudflare Pages | Hosting estático, CDN global |

---

## C. MODELO DE DATOS

### `profiles`
```sql
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();
```

### `couples`
```sql
CREATE TABLE couples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  invite_code       TEXT NOT NULL UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_couples_invite_code ON couples(invite_code);
```

### `couple_members`
```sql
CREATE TABLE couple_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (couple_id, user_id)
);
CREATE INDEX idx_couple_members_user_id  ON couple_members(user_id);
CREATE INDEX idx_couple_members_couple_id ON couple_members(couple_id);

-- Máximo 2 miembros por pareja
CREATE OR REPLACE FUNCTION fn_check_couple_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM couple_members WHERE couple_id = NEW.couple_id) >= 2 THEN
    RAISE EXCEPTION 'couple_full: La pareja ya tiene 2 miembros';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_couple_capacity
BEFORE INSERT ON couple_members
FOR EACH ROW EXECUTE FUNCTION fn_check_couple_capacity();
```

### `questions`
```sql
CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT UNIQUE,  -- idempotencia import; nullable para preguntas creadas en-app
  couple_id   UUID REFERENCES couples(id) ON DELETE SET NULL,  -- NULL = global
  type        TEXT NOT NULL CHECK (type IN ('multiple_choice', 'hybrid', 'free_text')),
  category    TEXT NOT NULL CHECK (category IN ('light', 'flirty', 'spicy', 'savage')),
  intensity   SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  options     JSONB,    -- [{id, text}], NULL para free_text
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_example  BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_couple_id ON questions(couple_id);
CREATE INDEX idx_questions_active    ON questions(is_active) WHERE is_active = true;
```

### `game_sessions`
```sql
CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'phase1'
               CHECK (status IN ('phase1', 'phase2', 'phase3', 'completed')),
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_game_sessions_couple_id ON game_sessions(couple_id);
CREATE INDEX idx_game_sessions_status    ON game_sessions(status) WHERE status != 'completed';
```

### `session_questions`
```sql
CREATE TABLE session_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  position    SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
  UNIQUE (session_id, question_id),
  UNIQUE (session_id, position)
);
CREATE INDEX idx_session_questions_session ON session_questions(session_id, position);
```

### `user_session_state`
```sql
CREATE TABLE user_session_state (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id),
  phase1_completed    BOOLEAN NOT NULL DEFAULT false,
  phase1_completed_at TIMESTAMPTZ,
  phase2_completed    BOOLEAN NOT NULL DEFAULT false,
  phase2_completed_at TIMESTAMPTZ,
  reveal_position     SMALLINT NOT NULL DEFAULT 0 CHECK (reveal_position BETWEEN 0 AND 10),
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_user_session_state_session ON user_session_state(session_id, user_id);

-- phase*_completed no puede revertirse + auto-timestamp
CREATE OR REPLACE FUNCTION fn_protect_phase_flags()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.phase1_completed = true AND NEW.phase1_completed = false THEN
    RAISE EXCEPTION 'immutable: phase1_completed no puede revertirse';
  END IF;
  IF OLD.phase2_completed = true AND NEW.phase2_completed = false THEN
    RAISE EXCEPTION 'immutable: phase2_completed no puede revertirse';
  END IF;
  IF NEW.phase1_completed = true AND OLD.phase1_completed = false THEN
    NEW.phase1_completed_at := now();
  END IF;
  IF NEW.phase2_completed = true AND OLD.phase2_completed = false THEN
    NEW.phase2_completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_protect_phase_flags
BEFORE UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_protect_phase_flags();
```

### `answers`
```sql
CREATE TABLE answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES questions(id),
  user_id            UUID NOT NULL REFERENCES profiles(id),
  selected_option_id TEXT,  -- MC e híbrida
  free_text          TEXT,  -- híbrida y free_text
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, user_id)
);
CREATE INDEX idx_answers_session_user ON answers(session_id, user_id);
CREATE INDEX idx_answers_lookup       ON answers(session_id, question_id, user_id);
```

### `predictions`
```sql
CREATE TABLE predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES questions(id),
  predictor_id        UUID NOT NULL REFERENCES profiles(id),
  predicted_option_id TEXT,     -- MC e híbrida
  predicted_free_text TEXT,     -- free_text
  is_correct          BOOLEAN,  -- NULL para free_text hasta validación manual
  predicted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, predictor_id)
);
CREATE INDEX idx_predictions_session_predictor ON predictions(session_id, predictor_id);
```

### `free_text_validations`
```sql
CREATE TABLE free_text_validations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  validator_id  UUID NOT NULL REFERENCES profiles(id),
  is_correct    BOOLEAN NOT NULL,
  validated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## D. MÁQUINA DE ESTADOS

```
[phase1] ──(ambos completan answers)──▶ [phase2] ──(ambos completan predictions)──▶ [phase3] ──▶ [completed]
```

Transiciones disparadas exclusivamente por triggers SQL. El frontend solo lee `game_sessions.status` vía Realtime.

```sql
CREATE OR REPLACE FUNCTION fn_check_phase_advancement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status    TEXT;
  v_both_done BOOLEAN;
BEGIN
  IF (NEW.phase1_completed = OLD.phase1_completed) AND
     (NEW.phase2_completed = OLD.phase2_completed) THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM game_sessions WHERE id = NEW.session_id;

  IF NEW.phase1_completed = true AND v_status = 'phase1' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase1_completed = true;
    IF v_both_done THEN
      UPDATE game_sessions SET status = 'phase2'
      WHERE id = NEW.session_id AND status = 'phase1';
    END IF;

  ELSIF NEW.phase2_completed = true AND v_status = 'phase2' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase2_completed = true;
    IF v_both_done THEN
      UPDATE game_sessions SET status = 'phase3'
      WHERE id = NEW.session_id AND status = 'phase2';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phase_advancement
AFTER UPDATE ON user_session_state
FOR EACH ROW EXECUTE FUNCTION fn_check_phase_advancement();
```

**Retoma:** el frontend carga `game_sessions` (status != completed) + `user_session_state` del usuario → sabe fase, pregunta y posición de reveal exactas.

**Bloqueo:** sin timeout. La pareja puede crear otra sesión independiente mientras una esté bloqueada.

---

## E. ESTRATEGIA DE SCORING

```sql
CREATE OR REPLACE FUNCTION fn_calculate_prediction_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_question_type TEXT;
  v_partner_id    UUID;
  v_target_answer TEXT;
BEGIN
  SELECT type INTO v_question_type FROM questions WHERE id = NEW.question_id;

  IF v_question_type = 'free_text' THEN
    NEW.is_correct := NULL;
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_partner_id
  FROM user_session_state
  WHERE session_id = NEW.session_id AND user_id != NEW.predictor_id
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'score_error: no se encontró partner en la sesión';
  END IF;

  SELECT selected_option_id INTO v_target_answer
  FROM answers
  WHERE session_id = NEW.session_id
    AND question_id = NEW.question_id
    AND user_id = v_partner_id;

  IF v_target_answer IS NULL THEN
    RAISE EXCEPTION 'score_error: el partner no ha respondido esta pregunta aún';
  END IF;

  NEW.is_correct := (NEW.predicted_option_id = v_target_answer);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_score_prediction
BEFORE INSERT ON predictions
FOR EACH ROW EXECUTE FUNCTION fn_calculate_prediction_score();
```

**Score final (on-demand):**
```sql
SELECT
  predictor_id,
  COUNT(*) FILTER (WHERE is_correct = true)      AS correct,
  COUNT(*) FILTER (WHERE is_correct IS NOT NULL) AS scored_total
FROM predictions WHERE session_id = $1
GROUP BY predictor_id;
```

---

## F. SELECCIÓN DE PREGUNTAS

```sql
CREATE OR REPLACE FUNCTION fn_create_session(p_couple_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id   UUID;
  v_member_count INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized: no eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM couple_members WHERE couple_id = p_couple_id;

  IF v_member_count != 2 THEN
    RAISE EXCEPTION 'couple_incomplete: la pareja necesita 2 miembros para iniciar una sesión';
  END IF;

  INSERT INTO game_sessions (couple_id, created_by, status)
  VALUES (p_couple_id, auth.uid(), 'phase1')
  RETURNING id INTO v_session_id;

  INSERT INTO session_questions (session_id, question_id, position)
  SELECT v_session_id, q.id, ROW_NUMBER() OVER () AS position
  FROM (
    SELECT id FROM questions
    WHERE is_active = true
      AND is_example = false
      AND (couple_id IS NULL OR couple_id = p_couple_id)
    ORDER BY random()
    LIMIT 10
  ) q;

  INSERT INTO user_session_state (session_id, user_id)
  SELECT v_session_id, user_id
  FROM couple_members WHERE couple_id = p_couple_id;

  RETURN v_session_id;
END;
$$;
```

**Mezcla:** pool unificado (globales + pareja). Random puro en v1. Anti-repetición inter-sesiones en v2.

---

## G. IMPORTACIÓN / EXPORTACIÓN EXCEL

Hoja `Instrucciones` (texto) + hoja `Preguntas` (datos).

| Col | Campo | Validación |
|---|---|---|
| A | question_id | Dejar vacío para nuevas |
| B | is_example | Dropdown TRUE/FALSE |
| C | type | Dropdown multiple_choice/hybrid/free_text |
| D | category | Dropdown light/flirty/spicy/savage |
| E | intensity | Número 1–5 |
| F | text | Texto |
| G–J | option_1..4 | Texto, vacío si free_text |

**Flujo client-side (SheetJS):** parsear → filtrar is_example → filtrar question_id existente → validar campos → bulk INSERT en lotes de 100.

**Idempotencia:** `is_example = TRUE` → skip; `question_id` existente → skip; vacío → generar UUID nuevo; valor nuevo → insertar con ese ID.

---

## H. POLÍTICAS RLS

```sql
CREATE OR REPLACE FUNCTION is_couple_member(p_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples               ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_text_validations ENABLE ROW LEVEL SECURITY;
```

### `profiles`
```sql
CREATE POLICY "profiles: ver propio y de parejas" ON profiles FOR SELECT TO authenticated
USING (
  id = auth.uid() OR id IN (
    SELECT cm2.user_id FROM couple_members cm1
    JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = auth.uid()
  )
);
CREATE POLICY "profiles: insertar solo propio" ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: actualizar solo propio" ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
```

### `couples`
```sql
CREATE POLICY "couples: ver solo las propias" ON couples FOR SELECT TO authenticated
USING (is_couple_member(id));
CREATE POLICY "couples: cualquiera puede crear" ON couples FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "couples: solo creador puede editar" ON couples FOR UPDATE TO authenticated
USING (created_by = auth.uid());
```

### `couple_members`
```sql
-- INSERT: bloqueado para usuarios; solo via fn_join_couple (SECURITY DEFINER) y trigger trg_auto_join_creator
CREATE POLICY "couple_members: ver miembros de tus parejas" ON couple_members FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
CREATE POLICY "couple_members: salir solo propio" ON couple_members FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### `questions` (globales)
```sql
CREATE POLICY "questions_global: leer activas" ON questions FOR SELECT TO authenticated
USING (couple_id IS NULL AND is_active = true AND is_example = false);
```

### `questions` (de pareja)
```sql
CREATE POLICY "questions_couple: miembros pueden leer" ON questions FOR SELECT TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id));
CREATE POLICY "questions_couple: miembros pueden insertar" ON questions FOR INSERT TO authenticated
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id) AND created_by = auth.uid());
CREATE POLICY "questions_couple: miembros pueden desactivar" ON questions FOR UPDATE TO authenticated
USING (couple_id IS NOT NULL AND is_couple_member(couple_id))
WITH CHECK (couple_id IS NOT NULL AND is_couple_member(couple_id));
```

### `game_sessions`
```sql
CREATE POLICY "game_sessions: miembros pueden leer" ON game_sessions FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
-- INSERT: solo via fn_create_session (SECURITY DEFINER) — sin política = bloqueado
-- UPDATE: solo via triggers SECURITY DEFINER — sin política = bloqueado
```

### `session_questions`
```sql
CREATE POLICY "session_questions: miembros pueden leer" ON session_questions FOR SELECT TO authenticated
USING (is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id)));
```

### `user_session_state`
```sql
CREATE POLICY "uss: miembros pueden leer" ON user_session_state FOR SELECT TO authenticated
USING (is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id)));
-- INSERT: bloqueado (solo via fn_create_session)
CREATE POLICY "uss: solo propio update" ON user_session_state FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### `answers`
```sql
CREATE POLICY "answers: ver propias siempre" ON answers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "answers: ver de pareja en fase 3" ON answers FOR SELECT TO authenticated
USING (
  user_id != auth.uid()
  AND is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id))
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "answers: insertar propias en phase1" ON answers FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id))
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase1'
);
```

### `predictions`
```sql
CREATE POLICY "predictions: ver propias siempre" ON predictions FOR SELECT TO authenticated
USING (predictor_id = auth.uid());

CREATE POLICY "predictions: ver de pareja en fase 3" ON predictions FOR SELECT TO authenticated
USING (
  predictor_id != auth.uid()
  AND is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id))
  AND (SELECT status FROM game_sessions WHERE id = session_id) IN ('phase3', 'completed')
);

CREATE POLICY "predictions: insertar propias en phase2" ON predictions FOR INSERT TO authenticated
WITH CHECK (
  predictor_id = auth.uid()
  AND is_couple_member((SELECT couple_id FROM game_sessions WHERE id = session_id))
  AND (SELECT status FROM game_sessions WHERE id = session_id) = 'phase2'
);
```

### `free_text_validations`
```sql
CREATE POLICY "ftv: miembros pueden leer" ON free_text_validations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM predictions p
    JOIN game_sessions gs ON gs.id = p.session_id
    WHERE p.id = prediction_id AND is_couple_member(gs.couple_id)
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
```

### `fn_join_couple`
```sql
CREATE OR REPLACE FUNCTION fn_join_couple(p_invite_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id    UUID;
  v_expires_at   TIMESTAMPTZ;
  v_member_count INT;
BEGIN
  SELECT id, invite_expires_at INTO v_couple_id, v_expires_at
  FROM couples WHERE invite_code = p_invite_code;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code: código de invitación no válido';
  END IF;
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'expired_code: el código de invitación expiró';
  END IF;
  IF EXISTS (SELECT 1 FROM couple_members WHERE couple_id = v_couple_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already_member: ya eres miembro de esta pareja';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = v_couple_id;
  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: la pareja ya está completa';
  END IF;

  INSERT INTO couple_members (couple_id, user_id) VALUES (v_couple_id, auth.uid());
  RETURN v_couple_id;
END;
$$;
```

---

## I. REALTIME

**Suscribir:**
1. `game_sessions` — `id=eq.{sessionId}` → detectar cambio de `status`
2. `user_session_state` — `session_id=eq.{sessionId}` → detectar que la pareja completó una fase

**No suscribir:** `answers`, `predictions`, `free_text_validations`, `reveal_position`.

**Race conditions:** resueltas por el guard `AND status = 'phaseX'` en los UPDATE del trigger. El frontend nunca escribe en `game_sessions.status`.

---

## J. FRONTEND Y MÓDULOS

```
/                           → Landing / login redirect
/auth                       → Login / signup
/auth/callback              → Supabase OAuth callback
/dashboard                  → Lista de parejas + sesiones activas
/couple/:coupleId           → Vista de pareja
/couple/:coupleId/invite    → Código QR + URL de invitación
/couple/:coupleId/questions → Gestión de preguntas + import/export
/session/:sessionId         → Enrutador de fase (redirige según status)
/session/:sessionId/phase1  → Respuestas
/session/:sessionId/phase2  → Predicciones
/session/:sessionId/phase3  → Reveal 1-by-1
/session/:sessionId/summary → Resumen final con scoring
```

| Dato | Dónde vive |
|---|---|
| Respuesta en progreso | useState local → BD al submit |
| Estado de sesión | Supabase query + Realtime |
| Lista de preguntas | Supabase query, cacheado |
| Predicción antes de submit | useState local con delay 1000ms |
| reveal_position | user_session_state en BD |

**Retoma:** `game_sessions.status` + `user_session_state` (phase*_completed, reveal_position) + COUNT de answers → sabe exactamente dónde retomar.

---

## K. DEPLOY Y CONFIGURACIÓN CRÍTICA

```
Cloudflare Pages:
  Build command:  npm run build
  Output:         dist
  Node version:   18+
  Env vars:
    VITE_SUPABASE_URL=https://xxxx.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJ...

Supabase Auth URLs:
  Site URL:       https://tuapp.com
  Redirect URLs:  https://tuapp.com/auth/callback
                  http://localhost:5173/auth/callback
                  com.tuapp.juego://auth/callback  (Capacitor — agregar ahora)
```

Nunca exponer `service_role` en el frontend. RLS depende de `anon` key.

---

## L. EVOLUCIÓN POR FASES

- **v1:** game loop completo, parejas, preguntas, import/export Excel, scoring, retoma de sesión
- **v2:** anti-repetición inter-sesiones, push notifications, PWA, edición inline de preguntas
- **v3:** Capacitor (Play Store), packs compartibles, estadísticas, multi-idioma

**NO va en v1:** notificaciones push, historial anti-repetición, edición de preguntas, estadísticas acumuladas, Capacitor.

---

## M. RIESGOS Y ANTI-PATRONES

| # | Anti-patrón | Consecuencia | Estado |
|---|---|---|---|
| 1–15 | (ver arqui_fixed.md v1) | — | Resueltos en pase 1 |
| 16 | ROW_NUMBER() doble | Posiciones incorrectas | Resuelto |
| 17 | fn_create_session sin membership check | Sesiones para parejas ajenas | Resuelto |
| 18 | fn_create_session sin check de 2 miembros | Sesión bloqueada permanente | Resuelto |
| 19 | UPDATE de fase sin guard de estado | Double-write bajo concurrencia | Resuelto |
| 20 | Scoring trigger solo en pseudocódigo | is_correct siempre NULL | Resuelto |
| 21 | predictions sin campo free_text | Reveal vacío | Resuelto |
| 22 | RLS con NEW.prediction_id | Error en runtime | Resuelto |
| 23 | is_couple_member SECURITY DEFINER | Privilegios excesivos | Resuelto |
| 24 | phase*_completed mutables | Rollback de estado | Resuelto |
| 25 | fn_join_couple inexistente | Invitación inoperable | Resuelto |
| 26 | Sin índices | Full scans | Resuelto |
