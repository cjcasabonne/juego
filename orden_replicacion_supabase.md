Paso 1:
- Crear proyecto en Supabase.
- Configurar `Authentication > URL Configuration`.
- Configurar `Project Settings > API`.
- Guardar `Project URL` y `anon key`.

Paso 2:
- Configurar `app/.env` con:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Paso 3:
- Ejecutar tablas una por una en Supabase SQL Editor:
- `sql/tables/01_profiles.sql`
- `sql/tables/02_couples.sql`
- `sql/tables/03_couple_members.sql`
- `sql/tables/04_questions.sql`
- `sql/tables/05_game_sessions.sql`
- `sql/tables/06_session_questions.sql`
- `sql/tables/07_user_session_state.sql`
- `sql/tables/08_answers.sql`
- `sql/tables/09_predictions.sql`
- `sql/tables/10_free_text_validations.sql`

Paso 4:
- Ejecutar `sql/02_indexes.sql`

Paso 5:
- Ejecutar funciones base:
- `sql/03a_functions_core.sql`

Paso 6:
- Ejecutar funciones largas una por una:
- `sql/functions/01_fn_check_phase_advancement.sql`
- `sql/functions/02_fn_calculate_prediction_score.sql`
- `sql/functions/03_fn_create_session.sql`
- `sql/functions/04_fn_join_couple.sql`

Paso 7:
- Ejecutar triggers:
- `sql/03c_triggers.sql`

Paso 8:
- Habilitar RLS:
- `sql/04a_enable_rls.sql`

Paso 9:
- Ejecutar policies una por una:
- `sql/policies/01_profiles_policies.sql`
- `sql/policies/02_couples_policies.sql`
- `sql/policies/03_couple_members_policies.sql`
- `sql/policies/04_questions_policies.sql`
- `sql/policies/05_game_sessions_policies.sql`
- `sql/policies/06_session_questions_policies.sql`
- `sql/policies/07_user_session_state_policies.sql`
- `sql/policies/08_answers_policies.sql`
- `sql/policies/09_predictions_policies.sql`
- `sql/policies/10_free_text_validations_policies.sql`

Paso 10:
- Validar estado final:
- `sql/05_smoke_checks.sql`

Paso 11:
- Si algo no coincide, inspeccionar estado real:
- `sql/05a_schema_inventory.sql`

Paso 12:
- Crear usuario de prueba A.
- Crear usuario de prueba B.
- Confirmar filas en `profiles`.

Paso 13:
- Cargar dataset inicial de preguntas.
- Confirmar al menos 10 preguntas activas.

Paso 14:
- Probar flujo completo:
- crear pareja
- join por invite code
- crear sesion
- phase1
- phase2
- phase3
- summary

Paso 15:
- Ejecutar QA de seguridad:
- no leer `answers` ajenas en `phase1`
- no leer `predictions` ajenas en `phase2`
- no crear sesion sobre pareja ajena
- no actualizar `user_session_state` ajeno
- no validar `free_text` sin ser respondente

Paso 16:
- Ejecutar `npm run build`

Paso 17:
- Desplegar en Cloudflare Pages.
