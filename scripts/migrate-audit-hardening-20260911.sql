BEGIN;

-- P0: academic-workflow-v4 relies on this partial unique index for
-- idempotent AI feedback publication.
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_ai_review_unique
  ON feedbacks(source_ai_review_id)
  WHERE source_ai_review_id IS NOT NULL;

-- P0: academic-v3 submitRubric() uses this exact ON CONFLICT target.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rubric_submissions_evaluator_unique
  ON rubric_submissions(portfolio_id, version_id, evaluator_id, evaluator_role);

-- Preserve immutable ordering even if application locking changes later.
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_portfolio_sequence
  ON portfolio_versions(portfolio_id, sequence_no)
  WHERE sequence_no IS NOT NULL;

-- Read path used by snapshot/review screens.
CREATE INDEX IF NOT EXISTS idx_rubric_submissions_portfolio_time
  ON rubric_submissions(portfolio_id, submitted_at DESC);

COMMIT;
