CREATE TABLE IF NOT EXISTS free_text_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES profiles(id),
  is_correct BOOLEAN NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
