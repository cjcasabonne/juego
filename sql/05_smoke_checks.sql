-- ============================================================
-- 05_smoke_checks.sql
-- Ejecutar despues de aplicar 00_apply_all.sql o 01..04
-- Devuelve evidencia minima de que el backend quedo listo
-- ============================================================

-- 1. Tablas esperadas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'couples',
    'couple_members',
    'questions',
    'game_sessions',
    'session_questions',
    'user_session_state',
    'answers',
    'predictions',
    'free_text_validations'
  )
ORDER BY tablename;

-- 2. Funciones esperadas
SELECT proname
FROM pg_proc
WHERE proname IN (
  'fn_handle_new_user',
  'fn_check_couple_capacity',
  'fn_protect_phase_flags',
  'fn_validate_answer_payload',
  'fn_check_phase_advancement',
  'fn_calculate_prediction_score',
  'is_couple_member',
  'fn_create_session',
  'fn_join_couple'
)
ORDER BY proname;

-- 3. Triggers esperados
SELECT tgname
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN (
    'trg_on_auth_user_created',
    'trg_couple_capacity',
    'trg_protect_phase_flags',
    'trg_validate_answer_payload',
    'trg_phase_advancement',
    'trg_score_prediction'
  )
ORDER BY tgname;

-- 4. RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'couples',
    'couple_members',
    'questions',
    'game_sessions',
    'session_questions',
    'user_session_state',
    'answers',
    'predictions',
    'free_text_validations'
  )
ORDER BY tablename;

-- 5. Policies creadas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Indices criticos
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_couples_invite_code',
    'idx_couple_members_user_id',
    'idx_couple_members_couple_id',
    'uq_questions_global_question_id',
    'uq_questions_couple_question_id',
    'idx_questions_couple_id',
    'idx_questions_active',
    'idx_questions_import_lookup',
    'idx_game_sessions_couple_id',
    'idx_game_sessions_status',
    'idx_game_sessions_active_by_couple',
    'idx_session_questions_session',
    'idx_user_session_state_session',
    'idx_answers_session_user',
    'idx_answers_lookup',
    'idx_predictions_session_predictor',
    'idx_predictions_free_text_pending'
  )
ORDER BY indexname;

-- 7. Checks de integridad basicos ya presentes en metadata
SELECT conname, contype, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid::regclass::text IN (
  'questions',
  'game_sessions',
  'session_questions',
  'user_session_state',
  'answers',
  'predictions'
)
ORDER BY table_name, conname;
