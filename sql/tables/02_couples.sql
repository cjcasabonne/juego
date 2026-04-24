CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT NOT NULL UNIQUE CHECK (char_length(invite_code) BETWEEN 6 AND 16),
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
