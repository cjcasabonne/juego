Paso 1:
- Crear proyecto nuevo en Supabase.
- Entrar a `Project Settings > API`.
- Copiar `Project URL`.
- Copiar `anon public key`.
- Copiar `service_role key`.

Paso 2:
- Entrar a `Authentication > URL Configuration`.
- Configurar `Site URL` con la URL local del frontend.
- Configurar `Redirect URLs` con:
- `http://localhost:5173/auth/callback`
- URL final de Cloudflare Pages + `/auth/callback`

Paso 3:
- Crear app frontend con Vite React.
- Ejecutar:
```bash
npm create vite@latest . -- --template react-ts
npm install
```

Paso 4:
- Instalar dependencias de runtime.
- Ejecutar:
```bash
npm install @supabase/supabase-js react-router-dom zustand xlsx
```

Paso 5:
- Instalar dependencias de desarrollo mínimas.
- Ejecutar:
```bash
npm install -D typescript @types/react @types/react-dom
```

Paso 6:
- Crear `.env`.
- Agregar:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Paso 7:
- Crear estructura de carpetas exactamente como está en `scaffolding.md`.
- No crear módulos extra.

Paso 8:
- Crear `src/lib/supabase.ts`.
- Inicializar un único cliente Supabase con `persistSession: true`.
- Exportar ese cliente.

Paso 9:
- Crear `src/config/env.ts`.
- Leer `VITE_SUPABASE_URL`.
- Leer `VITE_SUPABASE_ANON_KEY`.
- Fallar en runtime si falta alguna variable.

Paso 10:
- Crear `src/app/router.tsx`.
- Definir rutas:
- `/`
- `/login`
- `/auth/callback`
- `/couples`
- `/couples/new`
- `/couples/join`
- `/questions`
- `/questions/new`
- `/import/questions`
- `/session/:sessionId`
- `/session/:sessionId/phase1`
- `/session/:sessionId/phase2`
- `/session/:sessionId/phase3`
- `/session/:sessionId/summary`

Paso 11:
- Crear `src/auth/services/auth.service.ts`.
- Implementar:
- `signInWithOtp` o proveedor elegido
- `signOut`
- `getSession`
- `onAuthStateChange`

Paso 12:
- Crear `src/auth/hooks/useAuthSession.ts`.
- Exponer:
- sesión actual
- usuario actual
- estado loading

Paso 13:
- Crear `src/auth/components/AuthGuard.tsx`.
- Si no hay sesión, redirigir a `/login`.
- Si hay sesión, renderizar children.

Paso 14:
- Crear `src/auth/pages/LoginPage.tsx`.
- Mostrar formulario de acceso.
- Conectar con `auth.service.ts`.

Paso 15:
- Crear `src/auth/pages/AuthCallbackPage.tsx`.
- Resolver callback de Supabase.
- Redirigir a `/`.

Paso 16:
- Ir a Supabase SQL Editor.
- Crear una query nueva llamada `01_schema.sql`.
- Pegar solo el bloque de tablas de `arqui_final.md`.
- Ejecutar.

Paso 17:
- Verificar en `Table Editor` que existan estas tablas:
- `profiles`
- `couples`
- `couple_members`
- `questions`
- `game_sessions`
- `session_questions`
- `user_session_state`
- `answers`
- `predictions`
- `free_text_validations`

Paso 18:
- Crear una query nueva llamada `02_indexes.sql`.
- Pegar todos los índices de `arqui_final.md`.
- Ejecutar.

Paso 19:
- Crear una query nueva llamada `03_functions_and_triggers.sql`.
- Pegar funciones y triggers en este orden:
- `fn_handle_new_user`
- `trg_on_auth_user_created`
- `fn_check_couple_capacity`
- `trg_couple_capacity`
- `fn_protect_phase_flags`
- `trg_protect_phase_flags`
- `fn_validate_answer_payload`
- `trg_validate_answer_payload`
- `fn_check_phase_advancement`
- `trg_phase_advancement`
- `fn_calculate_prediction_score`
- `trg_score_prediction`
- `is_couple_member`
- `fn_create_session`
- `fn_join_couple`
- Ejecutar.

Paso 20:
- Crear una query nueva llamada `04_rls.sql`.
- Pegar:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- todas las `CREATE POLICY`
- Ejecutar.

Paso 21:
- Crear usuario de prueba A desde la app.
- Confirmar que se creó una fila en `profiles`.
- Crear usuario de prueba B desde la app.
- Confirmar que se creó una fila en `profiles`.

Paso 22:
- Crear `src/profiles/services/profiles.service.ts`.
- Implementar lectura de perfil actual por `auth.uid()`.

Paso 23:
- Crear `src/profiles/hooks/useProfile.ts`.
- Cargar perfil actual al entrar a la app autenticada.

Paso 24:
- Crear `src/couples/services/couples.service.ts`.
- Implementar:
- crear pareja
- listar parejas visibles del usuario
- leer pareja por id

Paso 25:
- Crear `src/couples/services/couple-members.service.ts`.
- Implementar:
- listar miembros por `couple_id`
- salir de pareja si aplica
- llamar RPC `fn_join_couple`

Paso 26:
- Crear `src/couples/hooks/useCouples.ts`.
- Cargar listado de parejas del usuario.

Paso 27:
- Crear `src/couples/hooks/useCreateCouple.ts`.
- Implementar create con:
- `name`
- `created_by`
- `invite_code`

Paso 28:
- Crear `src/couples/hooks/useJoinCouple.ts`.
- Llamar `rpc('fn_join_couple', { p_invite_code: code })`.

Paso 29:
- Crear `src/couples/pages/CreateCouplePage.tsx`.
- Crear formulario para nombre opcional.
- Generar `invite_code` desde frontend.
- Insertar en `couples`.

Paso 30:
- Crear `src/couples/pages/JoinCouplePage.tsx`.
- Capturar `invite_code`.
- Llamar RPC de join.
- Redirigir al listado de parejas.

Paso 31:
- Crear `src/couples/pages/CouplesPage.tsx`.
- Mostrar:
- parejas
- estado de miembros
- botón crear sesión cuando haya 2 miembros
- acceso a importar preguntas

Paso 32:
- Crear `src/questions/services/questions.service.ts`.
- Implementar:
- listar preguntas globales visibles
- listar preguntas de pareja
- crear pregunta de pareja
- desactivar pregunta de pareja

Paso 33:
- Crear `src/questions/hooks/useQuestions.ts`.
- Cargar preguntas por `couple_id`.

Paso 34:
- Crear `src/questions/hooks/useCreateQuestion.ts`.
- Construir payload válido:
- `type`
- `category`
- `intensity`
- `text`
- `options`
- `couple_id`
- `created_by`

Paso 35:
- Crear `src/questions/hooks/useDisableQuestion.ts`.
- Actualizar `is_active=false` solo sobre preguntas permitidas por RLS.

Paso 36:
- Crear `src/questions/pages/NewQuestionPage.tsx`.
- Mostrar formulario.
- Si `type = free_text`, enviar `options = null`.
- Si `type = multiple_choice` o `hybrid`, enviar `options` como array JSON.

Paso 37:
- Crear `src/questions/pages/QuestionsPage.tsx`.
- Listar preguntas de pareja.
- Permitir crear.
- Permitir desactivar.

Paso 38:
- Crear `src/import/parsers/excel.parser.ts`.
- Leer archivo Excel.
- Extraer hoja `Preguntas`.
- Convertir filas a objetos normalizados.

Paso 39:
- Crear `src/import/validators/import.validator.ts`.
- Validar por fila:
- `question_id`
- `type`
- `category`
- `intensity`
- `text`
- `option_1..4`
- `is_example`

Paso 40:
- Aplicar regla de importación:
- si `is_example = true`, descartar fila
- no guardar `is_example` en DB
- si `type = free_text`, `options = null`
- si `type = multiple_choice` o `hybrid`, construir array `options`

Paso 41:
- Crear `src/import/services/import.service.ts`.
- Implementar batch insert en `questions`.
- Antes de insertar, consultar existentes por `question_id` y scope.
- Saltar duplicadas.

Paso 42:
- Crear `src/import/hooks/useExcelImport.ts`.
- Coordinar:
- parseo
- validación
- deduplicación
- inserción
- resumen final

Paso 43:
- Crear `src/import/pages/ImportQuestionsPage.tsx`.
- Mostrar selector de archivo.
- Ejecutar importación.
- Mostrar resumen:
- total filas
- ignoradas por `is_example`
- inválidas
- duplicadas
- insertadas

Paso 44:
- Cargar un Excel de prueba con preguntas globales.
- Verificar en `questions` que existan al menos 10 activas.

Paso 45:
- Crear `src/sessions/services/sessions.service.ts`.
- Implementar:
- `createSession(coupleId)` usando RPC `fn_create_session`
- lectura de `game_sessions` por id
- lectura de sesiones activas del usuario

Paso 46:
- Crear `src/sessions/services/session-questions.service.ts`.
- Implementar lectura de `session_questions` por `session_id` ordenadas por `position`.

Paso 47:
- Crear `src/sessions/services/user-session-state.service.ts`.
- Implementar:
- lectura de estado del usuario en la sesión
- update de `phase1_completed`
- update de `phase2_completed`
- update de `reveal_position`

Paso 48:
- Crear `src/sessions/hooks/useCreateSession.ts`.
- Llamar `createSession(coupleId)`.
- Redirigir al router de sesión.

Paso 49:
- Crear `src/sessions/hooks/useActiveSessions.ts`.
- Consultar sesiones no completadas visibles por RLS.

Paso 50:
- Crear `src/sessions/hooks/useSession.ts`.
- Cargar `game_sessions` por `sessionId`.

Paso 51:
- Crear `src/sessions/hooks/useSessionQuestions.ts`.
- Cargar preguntas de la sesión con orden fijo.

Paso 52:
- Crear `src/lib/realtime.ts`.
- Crear helper para suscribirse a cambios de `game_sessions`.

Paso 53:
- Crear `src/sessions/hooks/useSessionRealtime.ts`.
- Suscribirse solo a `game_sessions` por `sessionId`.
- Refrescar `status` al cambiar.

Paso 54:
- Crear `src/sessions/pages/SessionRouterPage.tsx`.
- Cargar `game_sessions.status`.
- Redirigir según estado:
- `phase1`
- `phase2`
- `phase3`
- `completed`

Paso 55:
- Crear `src/game/phase1/services/answers.service.ts`.
- Implementar:
- insert de answer
- lectura de answers propias por sesión
- count de answers propias por sesión

Paso 56:
- Crear `src/game/phase1/hooks/usePhase1Answers.ts`.
- Guardar respuestas una por una.
- Rechazar reenvío si ya existe respuesta para esa pregunta.

Paso 57:
- Crear `src/game/phase1/hooks/usePhase1Progress.ts`.
- Calcular progreso con:
- total `session_questions`
- total `answers` propias

Paso 58:
- Crear `src/game/phase1/pages/Phase1Page.tsx`.
- Cargar preguntas.
- Cargar progreso.
- Mostrar una pregunta a la vez.
- Insertar respuesta.
- Cuando el conteo llegue a 10, actualizar `phase1_completed = true`.

Paso 59:
- Crear `src/sessions/pages/SessionWaitingPage.tsx`.
- Mostrar mensaje de espera.
- Mantener suscripción Realtime activa.

Paso 60:
- Crear `src/game/phase2/services/predictions.service.ts`.
- Implementar:
- insert de prediction
- lectura de predictions propias por sesión
- count de predictions propias por sesión

Paso 61:
- Crear `src/game/phase2/hooks/usePhase2Predictions.ts`.
- Guardar predicción una por una.
- Enviar exactamente uno entre:
- `predicted_option_id`
- `predicted_free_text`

Paso 62:
- Crear `src/game/phase2/hooks/usePhase2Progress.ts`.
- Calcular progreso con:
- total `session_questions`
- total `predictions` propias

Paso 63:
- Crear `src/game/phase2/pages/Phase2Page.tsx`.
- Cargar preguntas.
- Mostrar UI según `questions.type`.
- Insertar predicción.
- Cuando el conteo llegue a 10, actualizar `phase2_completed = true`.

Paso 64:
- Crear `src/game/phase3/services/reveal.service.ts`.
- Implementar lectura combinada de:
- `session_questions`
- `answers`
- `predictions`
- `user_session_state`

Paso 65:
- Crear `src/game/phase3/services/free-text-validations.service.ts`.
- Implementar insert sobre `free_text_validations`.

Paso 66:
- Crear `src/game/phase3/hooks/useRevealState.ts`.
- Leer `reveal_position` actual del usuario.
- Calcular siguiente item visible.

Paso 67:
- Crear `src/game/phase3/hooks/useRevealFeed.ts`.
- Construir lista ordenada de reveal según `position`.

Paso 68:
- Crear `src/game/phase3/pages/Phase3Page.tsx`.
- Mostrar reveal uno por uno.
- Avanzar `reveal_position` después de cada tarjeta.
- Al llegar a 10, dejar que el trigger cierre sesión en `completed` cuando ambos terminen.

Paso 69:
- Cuando una predicción sea de texto libre y `is_correct` esté en `NULL`, mostrar acción de validación al respondente permitido.
- Insertar validación en `free_text_validations`.

Paso 70:
- Crear `src/sessions/pages/SessionSummaryPage.tsx`.
- Leer score final desde `predictions`.
- Mostrar:
- aciertos
- total puntuable
- cierre de sesión

Paso 71:
- Implementar home `/`.
- Si hay sesión activa, mostrar acceso directo a continuar.
- Si no hay sesión activa, mostrar acceso a parejas.

Paso 72:
- Probar flujo completo con usuario A y usuario B.
- Ejecutar:
- crear pareja
- unirse por código
- cargar preguntas
- crear sesión
- responder 10 preguntas
- predecir 10 preguntas
- completar reveal
- ver summary

Paso 73:
- Verificar reglas de seguridad con usuario A y usuario B:
- A no puede leer `answers` de B en `phase1`
- A no puede leer `predictions` de B en `phase2`
- A no puede crear sesión sobre pareja ajena
- A no puede actualizar `user_session_state` de B
- A no puede validar `free_text` ajeno si no es respondente

Paso 74:
- Probar errores esperados:
- crear sesión con menos de 10 preguntas activas
- insertar `answers` inválidas
- insertar `predictions` inválidas
- enviar predicción fuera de `phase2`

Paso 75:
- Ejecutar build local.
- Ejecutar:
```bash
npm run build
```
- Corregir errores de tipado o bundling.

Paso 76:
- Configurar proyecto en Cloudflare Pages.
- Conectar repositorio.
- Definir comando de build.
- Definir carpeta de salida.

Paso 77:
- Configurar variables en Cloudflare Pages:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Paso 78:
- Publicar deploy.
- Abrir URL final.
- Probar login.
- Probar callback.
- Probar creación de pareja.
- Probar reanudación de sesión.

Paso 79:
- Actualizar `estado_actual.md`.
- Marcar checks completados.
- Actualizar estado por módulo.
- Registrar bloqueos reales.

Paso 80:
- Congelar cambios de arquitectura.
- Continuar solo con implementación y corrección de bugs.
