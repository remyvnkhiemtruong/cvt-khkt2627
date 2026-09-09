-- DEPRECATED compatibility marker.
-- The old demo seed used a teacher-gated AI flow and is intentionally retired.
-- Canonical KHKT 2026-2027 seed:
--   scripts/seed-khkt-2026-2027.sql
--
-- Current rule: the AI account is a manual ChatGPT-response intake. When the
-- operator sends the pasted response, the student sees the AI feedback
-- immediately. Teacher follow-up remains available; official rubric scoring is
-- teacher-only and server-calculated.

SELECT 'Use scripts/seed-khkt-2026-2027.sql' AS canonical_seed;
