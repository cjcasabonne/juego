SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
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
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass AS table_name, conname, contype
FROM pg_constraint
WHERE conrelid::regclass::text IN (
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
ORDER BY table_name, conname;
