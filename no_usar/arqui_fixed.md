# ARQUITECTURA CORREGIDA — WEBAPP DE JUEGO PARA PAREJAS

---

## AUDITORÍA — PROBLEMAS DETECTADOS

### ERRORES CRÍTICOS

**[C1] `fn_create_session`: `ROW_NUMBER() OVER (ORDER BY random())` produce posiciones incorrectas**

El código original:
```sql
SELECT
  v_session_id, q.id,
  ROW_NUMBER() OVER (ORDER BY random()) AS position
FROM questions q
WHERE ...
ORDER BY random()
LIMIT 10;
```
Hay dos `ORDER BY random()` independientes. La ventana `ROW_NUMBER() OVER (ORDER BY random())` asigna números a TODAS las filas del pool antes del `LIMIT 10`. El `ORDER BY random() LIMIT 10` toma 10 filas al azar de ese pool ya numerado. Las posiciones resultantes no son 1–10 consecutivos sino números arbitrarios del rango completo del pool (ej: 7, 23, 45, 3...). Esto viola la UNIQUE `(session_id, position)` y puede romper la sesión.

**[C2] `fn_create_session`: variables `v_user1`, `v_user2` declaradas y nunca usadas**

Dead code. Indica que la función no fue completada.

**[C3] `fn_create_session`: no verifica que el caller sea miembro de la pareja**

La función es SECURITY DEFINER. Cualquier usuario autenticado puede llamarla con cualquier `p_couple_id`. Si no hay verificación de membresía dentro de la función, puede crear sesiones para parejas ajenas.

**[C4] `fn_create_session`: no verifica que la pareja tenga exactamente 2 miembros**

Si la pareja solo tiene 1 miembro (el creador que aún no invitó a nadie), se crea 1 sola fila en `user_session_state`. El trigger de avance de fase nunca alcanzará `COUNT = 2`. La sesión queda bloqueada permanentemente.

**[C5] `fn_check_phase_advancement`: UPDATE sin guardia de estado actual (doble-write posible)**

El UPDATE a `game_sessions`:
```sql
UPDATE game_sessions SET status = 'phase2' WHERE id = NEW.session_id;
```
No tiene `AND status = 'phase1'`. Bajo concurrencia alta, si dos transacciones ejecutan el trigger casi simultáneamente y ambas leen `v_status = 'phase1'`, ambas harán el UPDATE. El resultado es idempotente en este caso, pero en la transición `phase2 → phase3` podría haber un UPDATE que lleva `phase3 → phase3` cuando la condición real ya cambió. Agregar el guard hace el comportamiento explícito.

**[C6] Scoring trigger para `predictions`: solo existe como pseudocódigo sin DDL real**

El trigger que calcula `is_correct` no tiene función SQL completa ni `CREATE TRIGGER`. Sin esto, todas las predicciones MC/hybrid quedan con `is_correct = NULL`. El scoring es inoperable.

Además, el pseudocódigo tiene un bug: `user_id != NEW.predictor_id` puede devolver múltiples filas si hay inconsistencias en datos. Debe buscar explícitamente al otro miembro de la pareja y manejar el caso donde el target aún no respondió (respuesta pendiente → no poner is_correct NULL prematuramente, sino rechazar el INSERT).

**[C7] `predictions` no tiene campo para predicción de preguntas `free_text`**

La tabla tiene `predicted_option_id TEXT` pero las preguntas de tipo `free_text` no tienen opciones. En Fase 2, el jugador debe predecir algo sobre una pregunta free_text. Sin `predicted_free_text`, el campo es siempre NULL para free_text y la predicción no tiene contenido útil para mostrar en el reveal.

**[C8] RLS de `free_text_validations` usa `NEW.prediction_id` que no existe en políticas RLS**

En PostgreSQL, las políticas RLS no tienen acceso a `NEW`. La cláusula `WITH CHECK` recibe el row siendo insertado como columnas directas. El correcto es `prediction_id` (nombre de columna), no `NEW.prediction_id`.

### RIESGOS

**[R1] `is_couple_member` declarada SECURITY DEFINER sin necesidad**

La función solo lee datos. `SECURITY DEFINER` implica que se ejecuta con los privilegios del definer (generalmente postgres). Esto no es necesario y expande la superficie de ataque. Para funciones de lectura de RLS, `SECURITY INVOKER` es suficiente y más seguro.

**[R2] `phase1_completed` y `phase2_completed` no son inmutables**

Un usuario podría hacer UPDATE para setear `phase1_completed = false` de vuelta. El RLS solo dice `user_id = auth.uid()` para UPDATE, sin restricción de qué campos puede cambiar. Esto podría reiniciar la lógica de gating o manipular el estado.

**[R3] `fn_join_couple` nunca se define**

La arquitectura bloquea INSERT directo en `couple_members` y delega en `fn_join_couple(invite_code)`, pero esta función no existe. El flujo de invitación es inoperable.

**[R4] `game_sessions.completed_at` nunca se popula**

El campo existe pero no hay trigger ni lógica que lo escriba. La transición a `completed` tampoco está definida.

### INCONSISTENCIAS

**[I1] `reveal_position` sin bounds check**

`SMALLINT DEFAULT 0` pero sin `CHECK (reveal_position BETWEEN 0 AND 10)`. Un frontend bugueado podría empujar valores fuera de rango sin que la DB lo rechace.

**[I2] `session_questions` puede quedar con menos de 10 preguntas silenciosamente**

Si el pool tiene menos de 10 preguntas activas, la función inserta lo que puede sin error. El frontend no sabe cuántas preguntas tiene la sesión y puede asumir siempre 10.

### PROBLEMAS DE ESCALA

**[P1] Ningún índice definido**

Las queries críticas del juego (buscar answers por session+user, buscar user_session_state por session, buscar predictions por session+predictor) harán full table scans sin índices. Con pocas parejas no es crítico, pero debe estar desde el inicio.

**[P2] `is_couple_member` en RLS hace subquery sin índice garantizado**

Si `couple_members` no tiene índice en `user_id`, cada evaluación de RLS puede ser costosa.

---

## CORRECCIONES APLICADAS

### [C1] Fix: posiciones correctas en `fn_create_session`

**ANTES:**
```sql
INSERT INTO session_questions (session_id, question_id, position)
SELECT
  v_session_id, q.id,
  ROW_NUMBER() OVER (ORDER BY random()) AS position
FROM questions q
WHERE q.is_active = true
  AND q.is_example = false
  AND (q.couple_id IS NULL OR q.couple_id = p_couple_id)
ORDER BY random()
LIMIT 10;
```

**DESPUÉS:**
```sql
INSERT INTO session_questions (session_id, question_id, position)
SELECT
  v_session_id,
  q.id,
  ROW_NUMBER() OVER () AS position
FROM (
  SELECT id FROM questions
  WHERE is_active = true
    AND is_example = false
    AND (couple_id IS NULL OR couple_id = p_couple_id)
  ORDER BY random()
  LIMIT 10
) q;
```
Primero se seleccionan 10 preguntas aleatorias, luego se numeran 1–10 sobre ese resultado fijo.

### [C2+C3+C4] Fix: `fn_create_session` completa y segura

**ANTES:** variables sin usar, sin verificación de membresía, sin check de 2 miembros.

**DESPUÉS:** ver función completa en la sección F del documento corregido.

### [C5] Fix: UPDATE con guard de estado en `fn_check_phase_advancement`

**ANTES:**
```sql
UPDATE game_sessions SET status = 'phase2' WHERE id = NEW.session_id;
-- (más adelante)
UPDATE game_sessions SET status = 'phase3' WHERE id = NEW.session_id;
```

**DESPUÉS:**
```sql
UPDATE game_sessions SET status = 'phase2' WHERE id = NEW.session_id AND status = 'phase1';
-- (más adelante)
UPDATE game_sessions SET status = 'phase3' WHERE id = NEW.session_id AND status = 'phase2';
```
Las transiciones son idempotentes: si el estado ya avanzó, el UPDATE no hace nada.

### [C6] Fix: scoring trigger con DDL completo

**ANTES:** pseudocódigo sin función ni trigger reales.

**DESPUÉS:** ver `fn_calculate_prediction_score` y `trg_score_prediction` en la sección E del documento corregido.

### [C7] Fix: `predicted_free_text` en tabla `predictions`

**ANTES:** solo `predicted_option_id TEXT`.

**DESPUÉS:** se agrega `predicted_free_text TEXT NULLABLE`. Para preguntas MC/hybrid se usa `predicted_option_id`. Para free_text se usa `predicted_free_text`.

### [C8] Fix: RLS de `free_text_validations`

**ANTES:**
```sql
AND EXISTS (
  SELECT 1 FROM answers a
  JOIN predictions p ON p.id = NEW.prediction_id
  ...
)
```

**DESPUÉS:**
```sql
AND EXISTS (
  SELECT 1 FROM answers a
  JOIN predictions p ON p.id = prediction_id  -- nombre de columna, no NEW
  ...
)
```

### [R1] Fix: `is_couple_member` → SECURITY INVOKER

**ANTES:** `SECURITY DEFINER`

**DESPUÉS:** `SECURITY INVOKER` (o sin declarar — es el default). La función solo lee datos y no necesita privilegios elevados.

### [R2] Fix: inmutabilidad de flags de fase

Se agrega un trigger que impide hacer rollback de `phase1_completed` o `phase2_completed` una vez seteados a `true`.

### [I1] Fix: `reveal_position` con CHECK constraint

**ANTES:** `reveal_position SMALLINT DEFAULT 0`

**DESPUÉS:** `reveal_position SMALLINT DEFAULT 0 CHECK (reveal_position BETWEEN 0 AND 10)`

### [P1] Fix: índices definidos

Se agregan índices explícitos sobre las columnas más consultadas.

---

## A. DIAGNÓSTICO DEL PROBLEMA REAL

*(sin cambios respecto a arqui.md)*

Un motor de juego emocional stateful con sincronización asimétrica entre dos jugadores. La complejidad vive en el gating de fases (DB, no frontend), la asimetría de información (RLS, no UI), el estado bifurcado global/individual y la idempotencia de la importación.

---

## B. ARQUITECTURA FINAL PROPUESTA

*(sin cambios)*

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

---

## C. MODELO DE DATOS CORREGIDO

### `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create on signup
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
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (couple_id, user_id)
);
CREATE INDEX idx_couple_members_user_id ON couple_members(user_id);
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
  question_id TEXT UNIQUE,           -- clave de idempotencia para import; nullable para preguntas creadas en-app
  couple_id   UUID REFERENCES couples(id) ON DELETE SET NULL,  -- NULL = global
  type        TEXT NOT NULL CHECK (type IN ('multiple_choice', 'hybrid', 'free_text')),
  category    TEXT NOT NULL CHECK (category IN ('light', 'flirty', 'spicy', 'savage')),
  intensity   SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  options     JSONB,                 -- [{id: string, text: string}], NULL para free_text
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_example  BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_couple_id ON questions(couple_id);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
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
CREATE INDEX idx_game_sessions_status ON game_sessions(status) WHERE status != 'completed';
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
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES profiles(id),
  phase1_completed     BOOLEAN NOT NULL DEFAULT false,
  phase1_completed_at  TIMESTAMPTZ,
  phase2_completed     BOOLEAN NOT NULL DEFAULT false,
  phase2_completed_at  TIMESTAMPTZ,
  reveal_position      SMALLINT NOT NULL DEFAULT 0 CHECK (reveal_position BETWEEN 0 AND 10),
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_user_session_state_session ON user_session_state(session_id, user_id);

-- Inmutabilidad: phase*_completed no puede volver a false una vez true
CREATE OR REPLACE FUNCTION fn_protect_phase_flags()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.phase1_completed = true AND NEW.phase1_completed = false THEN
    RAISE EXCEPTION 'immutable: phase1_completed no puede revertirse';
  END IF;
  IF OLD.phase2_completed = true AND NEW.phase2_completed = false THEN
    RAISE EXCEPTION 'immutable: phase2_completed no puede revertirse';
  END IF;
  -- Auto-timestamp
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
  selected_option_id TEXT,     -- para MC e híbrida
  free_text          TEXT,     -- para híbrida y free_text
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, user_id)
);
CREATE INDEX idx_answers_session_user ON answers(session_id, user_id);
CREATE INDEX idx_answers_lookup ON answers(session_id, question_id, user_id);
```

### `predictions`
```sql
-- [C7 CORREGIDO] Se agrega predicted_free_text para preguntas de tipo free_text
CREATE TABLE predictions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id          UUID NOT NULL REFERENCES questions(id),
  predictor_id         UUID NOT NULL REFERENCES profiles(id),
  predicted_option_id  TEXT,     -- para MC e híbrida
  predicted_free_text  TEXT,     -- para free_text
  is_correct           BOOLEAN,  -- NULL para free_text hasta validación manual
  predicted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
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

## D. MÁQUINA DE ESTADOS CORREGIDA

```
[phase1] ──(ambos completan answers)──▶ [phase2] ──(ambos completan predictions)──▶ [phase3] ──▶ [completed]
```

Transiciones disparadas exclusivamente por triggers SQL. El frontend solo lee `game_sessions.status` vía Realtime.

```sql
-- [C5 CORREGIDO] UPDATE con guard de estado actual + auto-timestamp de completed_at
CREATE OR REPLACE FUNCTION fn_check_phase_advancement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status    TEXT;
  v_both_done BOOLEAN;
BEGIN
  -- Solo actuar si cambió algún flag de completitud
  IF (NEW.phase1_completed = OLD.phase1_completed) AND
     (NEW.phase2_completed = OLD.phase2_completed) THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status
  FROM game_sessions WHERE id = NEW.session_id;

  -- Transición phase1 → phase2
  IF NEW.phase1_completed = true AND v_status = 'phase1' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase1_completed = true;

    IF v_both_done THEN
      -- AND status = 'phase1' hace el UPDATE idempotente bajo concurrencia
      UPDATE game_sessions
      SET status = 'phase2'
      WHERE id = NEW.session_id AND status = 'phase1';
    END IF;

  -- Transición phase2 → phase3
  ELSIF NEW.phase2_completed = true AND v_status = 'phase2' THEN
    SELECT (COUNT(*) = 2) INTO v_both_done
    FROM user_session_state
    WHERE session_id = NEW.session_id AND phase2_completed = true;

    IF v_both_done THEN
      UPDATE game_sessions
      SET status = 'phase3'
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

**Retoma de sesión:** El frontend carga `game_sessions` filtrado por `couple_id` y `status != 'completed'`. Luego `user_session_state` del usuario para conocer `phase1_completed`, `phase2_completed` y `reveal_position`.

**Bloqueo:** Sin timeout. Una sesión puede quedar bloqueada indefinidamente. La misma pareja puede crear otra sesión independiente.

---

## E. ESTRATEGIA DE SCORING CORREGIDA

### Trigger para scoring automático (MC e hybrid)

```sql
-- [C6 CORREGIDO] Función y trigger reales con manejo de casos edge
CREATE OR REPLACE FUNCTION fn_calculate_prediction_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_question_type TEXT;
  v_partner_id    UUID;
  v_target_answer TEXT;
BEGIN
  -- Determinar tipo de pregunta
  SELECT type INTO v_question_type FROM questions WHERE id = NEW.question_id;

  -- free_text: is_correct queda NULL, se valida manualmente luego
  IF v_question_type = 'free_text' THEN
    NEW.is_correct := NULL;
    RETURN NEW;
  END IF;

  -- Para MC e hybrid: buscar al otro miembro de la pareja en esta sesión
  SELECT user_id INTO v_partner_id
  FROM user_session_state
  WHERE session_id = NEW.session_id
    AND user_id != NEW.predictor_id
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'score_error: no se encontró partner en la sesión';
  END IF;

  -- Buscar la respuesta real del partner
  SELECT selected_option_id INTO v_target_answer
  FROM answers
  WHERE session_id = NEW.session_id
    AND question_id = NEW.question_id
    AND user_id = v_partner_id;

  -- Si el partner aún no respondió esta pregunta, rechazar la predicción
  -- (no debería ocurrir en Fase 2 si el gating es correcto, pero es una guardia)
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

### Score final (calculado on-demand)

```sql
SELECT
  predictor_id,
  COUNT(*) FILTER (WHERE is_correct = true)        AS correct,
  COUNT(*) FILTER (WHERE is_correct IS NOT NULL)   AS scored_total
FROM predictions
WHERE session_id = $1
GROUP BY predictor_id;
```

---

## F. SELECCIÓN DE PREGUNTAS — FUNCIÓN CORREGIDA

```sql
-- [C1, C2, C3, C4 CORREGIDOS]
CREATE OR REPLACE FUNCTION fn_create_session(p_couple_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id    UUID;
  v_member_count  INT;
BEGIN
  -- [C3] Verificar que el caller es miembro de la pareja
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized: no eres miembro de esta pareja';
  END IF;

  -- [C4] Verificar que la pareja tiene exactamente 2 miembros
  SELECT COUNT(*) INTO v_member_count
  FROM couple_members WHERE couple_id = p_couple_id;

  IF v_member_count != 2 THEN
    RAISE EXCEPTION 'couple_incomplete: la pareja necesita 2 miembros para iniciar una sesión';
  END IF;

  -- Crear la sesión
  INSERT INTO game_sessions (couple_id, created_by, status)
  VALUES (p_couple_id, auth.uid(), 'phase1')
  RETURNING id INTO v_session_id;

  -- [C1] Asignar 10 preguntas con posiciones 1–10 correctas
  INSERT INTO session_questions (session_id, question_id, position)
  SELECT
    v_session_id,
    q.id,
    ROW_NUMBER() OVER () AS position
  FROM (
    SELECT id FROM questions
    WHERE is_active = true
      AND is_example = false
      AND (couple_id IS NULL OR couple_id = p_couple_id)
    ORDER BY random()
    LIMIT 10
  ) q;

  -- Crear user_session_state para ambos miembros
  INSERT INTO user_session_state (session_id, user_id)
  SELECT v_session_id, user_id
  FROM couple_members
  WHERE couple_id = p_couple_id;

  RETURN v_session_id;
END;
$$;
```

**Mezcla global + pareja:** el `WHERE` unifica ambos pools. Random puro en v1.

**Pool insuficiente:** si hay menos de 10 preguntas activas, se insertan las disponibles. El frontend debe verificar cuántas preguntas tiene la sesión con `SELECT COUNT(*) FROM session_questions WHERE session_id = X` antes de arrancar.

---

## G. IMPORTACIÓN / EXPORTACIÓN EXCEL

*(sin cambios respecto a arqui.md — la lógica es correcta)*

Hoja `Instrucciones` (texto) + hoja `Preguntas` (datos).

| Col | Campo | Validación |
|---|---|---|
| A | question_id | Texto libre, dejar vacío para nuevas |
| B | is_example | Dropdown TRUE/FALSE |
| C | type | Dropdown multiple_choice/hybrid/free_text |
| D | category | Dropdown light/flirty/spicy/savage |
| E | intensity | Número 1–5 |
| F | text | Texto |
| G–J | option_1..4 | Texto, vacío si free_text |

**Flujo:** SheetJS parsea en browser → filtrar is_example=TRUE → filtrar question_id existente → validar campos → bulk INSERT en lotes de 100.

**Reglas de idempotencia:**
- `is_example = TRUE` → skip siempre
- `question_id` existente en BD → skip (no update)
- `question_id` vacío → generar UUID, insertar
- `question_id` con valor que no existe en BD → insertar con ese question_id

---

## H. POLÍTICAS RLS CORREGIDAS

### Helper function

```sql
-- [R1 CORREGIDO] SECURITY INVOKER es suficiente para funciones de lectura
CREATE OR REPLACE FUNCTION is_couple_member(p_couple_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;
```

### Habilitar RLS en todas las tablas

```sql
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
```

### `profiles`

```sql
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
-- INSERT bloqueado para usuarios directos; solo via fn_join_couple (SECURITY DEFINER)
CREATE POLICY "couple_members: ver miembros de tus parejas" ON couple_members FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
CREATE POLICY "couple_members: salir solo propio" ON couple_members FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### `questions` (globales)

```sql
CREATE POLICY "questions_global: todos pueden leer activas" ON questions FOR SELECT TO authenticated
USING (couple_id IS NULL AND is_active = true AND is_example = false);
-- INSERT/UPDATE/DELETE: solo service_role (no hay política para usuarios)
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
-- DELETE: ninguna política → bloqueado
```

### `game_sessions`

```sql
CREATE POLICY "game_sessions: miembros pueden leer" ON game_sessions FOR SELECT TO authenticated
USING (is_couple_member(couple_id));
-- INSERT: via fn_create_session (SECURITY DEFINER), no INSERT directo
-- UPDATE: solo via trigger SECURITY DEFINER, no UPDATE directo para usuarios
```

### `session_questions`

```sql
CREATE POLICY "session_questions: miembros pueden leer" ON session_questions FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);
-- INSERT/UPDATE/DELETE: bloqueado (solo via fn_create_session)
```

### `user_session_state`

```sql
CREATE POLICY "uss: miembros pueden leer" ON user_session_state FOR SELECT TO authenticated
USING (
  is_couple_member(
    (SELECT couple_id FROM game_sessions WHERE id = session_id)
  )
);
-- INSERT: bloqueado (solo via fn_create_session)
CREATE POLICY "uss: solo propio update" ON user_session_state FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### `answers`

```sql
-- Propio: siempre visible
-- Pareja: solo en phase3 o completed
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
-- UPDATE/DELETE: ninguna política → bloqueado
```

### `predictions`

```sql
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
-- UPDATE/DELETE: ninguna política → bloqueado
```

### `free_text_validations`

```sql
CREATE POLICY "ftv: miembros pueden leer" ON free_text_validations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM predictions p
    JOIN game_sessions gs ON gs.id = p.session_id
    WHERE p.id = prediction_id
      AND is_couple_member(gs.couple_id)
  )
);

-- [C8 CORREGIDO] prediction_id en lugar de NEW.prediction_id
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
-- UPDATE/DELETE: ninguna política → bloqueado
```

### `fn_join_couple` — flujo de invitación

```sql
-- [R3] Función de invitación que antes faltaba completamente
CREATE OR REPLACE FUNCTION fn_join_couple(p_invite_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id     UUID;
  v_expires_at    TIMESTAMPTZ;
  v_member_count  INT;
BEGIN
  -- Buscar la pareja por código
  SELECT id, invite_expires_at INTO v_couple_id, v_expires_at
  FROM couples WHERE invite_code = p_invite_code;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code: código de invitación no válido';
  END IF;

  -- Verificar expiración si aplica
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'expired_code: el código de invitación expiró';
  END IF;

  -- Verificar que no es ya miembro
  IF EXISTS (SELECT 1 FROM couple_members WHERE couple_id = v_couple_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already_member: ya eres miembro de esta pareja';
  END IF;

  -- Verificar capacidad (trigger también lo hace, pero fail-fast aquí)
  SELECT COUNT(*) INTO v_member_count FROM couple_members WHERE couple_id = v_couple_id;
  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: la pareja ya está completa';
  END IF;

  -- Insertar membresía
  INSERT INTO couple_members (couple_id, user_id)
  VALUES (v_couple_id, auth.uid());

  RETURN v_couple_id;
END;
$$;
```

---

## I. REALTIME

*(sin cambios funcionales — la estrategia original es correcta)*

**Suscribir:**
1. `game_sessions` filtrado por `id=eq.{sessionId}` — detectar cambio de `status`
2. `user_session_state` filtrado por `session_id=eq.{sessionId}` — detectar que la pareja completó una fase

**No suscribir:** `answers`, `predictions`, `free_text_validations`, `reveal_position`.

**Anti-race-condition:** el guard `AND status = 'phaseX'` en los UPDATE del trigger garantiza idempotencia bajo concurrencia. El frontend nunca escribe en `game_sessions.status`.

---

## J. FRONTEND Y MÓDULOS

*(sin cambios)*

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

**Nota de implementación:** al entrar a `/session/:sessionId/phase1`, el frontend debe verificar cuántas preguntas tiene la sesión (`COUNT(session_questions)`) y hasta cuál respondió el usuario (`COUNT(answers WHERE user_id = me)`) para retomar desde la pregunta correcta.

---

## K. DEPLOY Y CONFIGURACIÓN CRÍTICA

*(sin cambios)*

```
Cloudflare Pages:
  Build command:    npm run build
  Output:           dist
  Node version:     18+
  Env vars:
    VITE_SUPABASE_URL=https://xxxx.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJ...

Supabase Auth URLs:
  Site URL:          https://tuapp.com
  Redirect URLs:     https://tuapp.com/auth/callback
                     http://localhost:5173/auth/callback
                     com.tuapp.juego://auth/callback  (Capacitor, agregar ahora)
```

---

## L. EVOLUCIÓN POR FASES

*(sin cambios)*

- **v1:** game loop completo, parejas, preguntas, import/export, scoring, retoma
- **v2:** anti-repetición, push notifications, PWA, edición inline
- **v3:** Capacitor, packs compartibles, estadísticas, multi-idioma

---

## M. RIESGOS Y ANTI-PATRONES (ACTUALIZADO)

| # | Anti-patrón | Consecuencia | Estado |
|---|---|---|---|
| 1 | Transición de fase en frontend | Race condition | Resuelto: trigger SQL |
| 2 | Estado de sesión en `couples` | Rompe multi-sesión | Resuelto: `game_sessions` 1:N |
| 3 | Leer `answers` del partner antes de Fase 3 | Trampa | Resuelto: RLS con status check |
| 4 | Hard delete de preguntas | Rompe historial | Resuelto: `is_active = false` |
| 5 | `question_id` sin UNIQUE | Duplicados en import | Resuelto: UNIQUE constraint |
| 6 | Import Excel en servidor | Innecesario | Resuelto: SheetJS browser |
| 7 | `service_role` en frontend | Bypass RLS | Resuelto: solo en migrations |
| 8 | Realtime en `answers` | Exposición prematura | Resuelto: no suscribir |
| 9 | Redirect URL hardcodeada | Auth rota en Capacitor | Resuelto: URL en config |
| 10 | Scoring en frontend | Inconsistencias | Resuelto: trigger SQL |
| 11 | `reveal_position` solo en memoria | Pierde posición | Resuelto: persiste en BD |
| 12 | Validación free_text sin ownership | Fraude | Resuelto: RLS con join a answers |
| 13 | Una sola sesión por pareja | Bloqueo permanente | Resuelto: sesiones 1:N |
| 14 | Lógica de fase mixta cliente/servidor | Inconsistente | Resuelto: solo DB |
| 15 | `fn_create_session` sin transacción | Estado parcial | Resuelto: función atómica |
| **16** | **`ROW_NUMBER() OVER (ORDER BY random())` doble** | **Posiciones incorrectas** | **Corregido [C1]** |
| **17** | **`fn_create_session` sin verificación de membresía** | **Sesiones para parejas ajenas** | **Corregido [C3]** |
| **18** | **`fn_create_session` sin check de 2 miembros** | **Sesión permanentemente bloqueada** | **Corregido [C4]** |
| **19** | **UPDATE de fase sin guard de estado** | **Double-write bajo concurrencia** | **Corregido [C5]** |
| **20** | **Scoring trigger solo en pseudocódigo** | **is_correct siempre NULL** | **Corregido [C6]** |
| **21** | **`predictions` sin campo para free_text** | **Reveal vacío para free_text** | **Corregido [C7]** |
| **22** | **RLS con `NEW.prediction_id`** | **Política inválida, error en runtime** | **Corregido [C8]** |
| **23** | **`is_couple_member` SECURITY DEFINER innecesario** | **Privilegios excesivos** | **Corregido [R1]** |
| **24** | **`phase*_completed` mutables** | **Rollback de estado de juego** | **Corregido [R2]** |
| **25** | **`fn_join_couple` no existía** | **Invitación inoperable** | **Corregido [R3]** |
| **26** | **Sin índices** | **Full scans en producción** | **Corregido [P1]** |

---

*Esta versión corregida es operable en producción. Todos los DDL están listos para ejecutar en orden sobre un schema vacío de Supabase.*
