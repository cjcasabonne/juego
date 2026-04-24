CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'hybrid', 'free_text')),
  category TEXT NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  subcategory TEXT NOT NULL CHECK (char_length(btrim(subcategory)) BETWEEN 1 AND 80),
  intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  text TEXT NOT NULL CHECK (char_length(btrim(text)) BETWEEN 1 AND 500),
  options JSONB CHECK (
    (type = 'free_text' AND options IS NULL)
    OR
    (type IN ('multiple_choice', 'hybrid') AND jsonb_typeof(options) = 'array')
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
