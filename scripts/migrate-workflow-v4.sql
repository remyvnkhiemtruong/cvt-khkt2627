BEGIN;

CREATE TABLE IF NOT EXISTS student_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES portfolio_versions(id) ON DELETE CASCADE,
  reflection_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_reflections_portfolio_version_key UNIQUE(portfolio_id, version_id)
);

CREATE INDEX IF NOT EXISTS idx_student_reflections_portfolio ON student_reflections(portfolio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_reflections_version ON student_reflections(version_id);

CREATE OR REPLACE FUNCTION prevent_student_reflection_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'STUDENT_REFLECTION_IMMUTABLE';
END;
$$;

DROP TRIGGER IF EXISTS trg_student_reflections_immutable ON student_reflections;
CREATE TRIGGER trg_student_reflections_immutable
BEFORE UPDATE OR DELETE ON student_reflections
FOR EACH ROW EXECUTE FUNCTION prevent_student_reflection_mutation();

COMMIT;
