-- Migracion para pasar de category unica a category + subcategory
-- Convencion legacy:
--   category = 'light' | 'flirty' | 'spicy' | 'savage'
-- Nueva convención:
--   category = familia (ej. 'sexy-questions')
--   subcategory = detalle dentro de la familia

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'questions'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.questions DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subcategory TEXT;

UPDATE public.questions
SET
  subcategory = COALESCE(subcategory, category),
  category = CASE
    WHEN category IN ('light', 'flirty', 'spicy', 'savage') THEN 'sexy-questions'
    ELSE category
  END
WHERE subcategory IS NULL
   OR category IN ('light', 'flirty', 'spicy', 'savage');

ALTER TABLE public.questions
  ALTER COLUMN category TYPE TEXT,
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN subcategory TYPE TEXT,
  ALTER COLUMN subcategory SET NOT NULL;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_category_not_blank
    CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  ADD CONSTRAINT questions_subcategory_not_blank
    CHECK (char_length(btrim(subcategory)) BETWEEN 1 AND 80);
