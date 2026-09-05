import { createHash } from 'node:crypto';
import { getPool } from './db.js';
import {
  academicAction as legacyAcademicAction,
  academicHealth as legacyAcademicHealth,
  assertSameOrigin,
  emptyDraft,
  ensureAcademicSchema,
  getAcademicSnapshot as legacyGetAcademicSnapshot
} from './academic.js';

const AXES = [
  'plot_situation',
  'character_detail',
  'narrator_pov',
  'space_time',
  'language_tone_symbol',
  'form_argument'
];

let hardeningPromise = null;

function stableValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stableValue);
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function checksumContent(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function wordCount(content) {
  return Object.values(content || {}).reduce((sum, item) => {
    const text = String(item?.analysisText || '').trim();
    return sum + (text ? text.split(/\s+/).filter(Boolean).length : 0);
  }, 0);
}

function clientIp(req) {
  return String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').split(',')[0].trim();
}

async function audit(client, user, action, targetType, targetId, afterJson = null, req = null) {
  await client.query(`
    INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, after_json, ip_address)
    VALUES($1,$2,$3,$4,$5,$6,$7)
  `, [
    user?.id || null,
    user?.role || 'system',
    action,
    targetType || '',
    String(targetId || ''),
    afterJson ? JSON.stringify(afterJson) : null,
    req ? clientIp(req) : ''
  ]);
}

async function ensureHardeningSchema() {
  if (!hardeningPromise) {
    hardeningPromise = (async () => {
      await ensureAcademicSchema();
      const pool = await getPool();
      const statements = [
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_ai_review_unique ON feedbacks(source_ai_review_id) WHERE source_ai_review_id IS NOT NULL",
        "CREATE INDEX IF NOT EXISTS idx_rubric_submissions_portfolio_time ON rubric_submissions(portfolio_id, submitted_at DESC)",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_portfolio_sequence ON portfolio_versions(portfolio_id, sequence_no) WHERE sequence_no IS NOT NULL"
      ];
      for (const statement of statements) await pool.query(statement);

      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'version_feedback_links_feedback_fk'
          ) THEN
            ALTER TABLE version_feedback_links
            ADD CONSTRAINT version_feedback_links_feedback_fk
            FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE NOT VALID;
          END IF;
        END $$;
      `);

      try {
        await pool.query('ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_status_check');
        await pool.query(`ALTER TABLE portfolios ADD CONSTRAINT portfolios_status_check CHECK (status IN (
          'drafting','submitted_waiting_ai','ai_proposed_waiting_teacher','teacher_feedback_needed',
          'feedback_received','revising','waiting_official_rubric','completed','v1_submitted','v2_in_revision'
        ))`);
      } catch (error) {
        console.error('[academic-v2] status constraint migration failed', error);
        throw error;
      }
    })().catch(error => {
      hardeningPromise = null;
      throw error;
    });
  }
  return hardeningPromise;
}

async function portfolioByPublicIds(pool, assignmentPublicId, studentId) {
  const result = await pool.query(`
    SELECT p.*, a.public_id assignment_public_id, a.class_id, a.rubric_id, a.id assignment_db_id
    FROM portfolios p
    JOIN assignments a ON a.id = p.assignment_id
    WHERE a.public_id = $1 AND p.student_id = $2
    LIMIT 1
  `, [assignmentPublicId, studentId]);
  return result.rows[0] || null;
}

async function teacherCanAccessClass(client, classId, teacherId) {
  const result = await client.query(`
    SELECT 1 FROM class_members
    WHERE class_id = $1 AND user_id = $2 AND member_role = 'teacher'
    LIMIT 1
  `, [classId, teacherId]);
  return result.rows.length > 0;
}

async function getRubricMap(pool) {
  const rows = await pool.query(`
    SELECT r.public_id rubric_public_id, r.title rubric_title, r.description rubric_description,
           rc.public_id criterion_public_id, rc.axis_id, rc.title criterion_title,
           rc.weight, rc.levels_json, rc.sort_order
    FROM rubrics r
    LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
    ORDER BY r.created_at, rc.sort_order, rc.public_id
  `);
  const map = {};
  for (const row of rows.rows) {
    if (!map[row.rubric_public_id]) {
      map[row.rubric_public_id] = {
        id: row.rubric_public_id,
        title: row.rubric_title,
        description: row.rubric_description || '',
        criteria: []
      };
    }
    if (row.criterion_public_id) {
      map[row.rubric_public_id].criteria.push({
        id: row.criterion_public_id,
        axisId: row.axis_id,
        title: row.criterion_title,
        weight: Number(row.weight || 1),
        levels: Array.isArray(row.levels_json) ? row.levels_json : []
      });
    }
  }
  return map;
}

export async function getAcademicSnapshot(user) {
  await ensureHardeningSchema();
  const snapshot = await legacyGetAcademicSnapshot(user);
  const pool = await getPool();
  const rubrics = await getRubricMap(pool);
  snapshot.rubrics = rubrics;

  if (user.role === 'ai') {
    for (const portfolio of Object.values(snapshot.portfolios || {})) {
      portfolio.currentDraft = emptyDraft();
    }
  }

  return snapshot;
}

async function createVersion(user, input, req) {
  if (user.role !== 'student') throw new Error('FORBIDDEN');
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pRes = await client.query(`
      SELECT p.*, a.id assignment_db_id, a.public_id assignment_public_id, a.prompt, a.target_axes, a.class_id
      FROM portfolios p
      JOIN assignments a ON a.id = p.assignment_id
      WHERE a.public_id = $1 AND p.student_id = $2
      FOR UPDATE OF p
    `, [String(input.assignmentId || ''), user.id]);
    const portfolio = pRes.rows[0];
    if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

    const submissionKey = input.submissionKey ? String(input.submissionKey) : null;
    if (submissionKey) {
      const existing = await client.query(`
        SELECT * FROM portfolio_versions
        WHERE portfolio_id = $1 AND submission_key = $2
        LIMIT 1
      `, [portfolio.id, submissionKey]);
      if (existing.rows[0]) {
        const ver = existing.rows[0];
        await client.query('COMMIT');
        return {
          ok: true,
          isIdempotentRetry: true,
          version: {
            id: ver.id,
            versionNumber: ver.version_number,
            sequenceNo: ver.sequence_no,
            stage: ver.stage,
            createdAt: ver.submitted_at,
            contentChecksum: ver.content_checksum
          },
          portfolioStatus: portfolio.status
        };
      }
    }

    const draftRes = await client.query('SELECT content_json FROM portfolio_drafts WHERE portfolio_id = $1', [portfolio.id]);
    const content = input.content || draftRes.rows[0]?.content_json || emptyDraft();

    const previous = await client.query(`
      SELECT id, version_number, sequence_no, stage
      FROM portfolio_versions
      WHERE portfolio_id = $1
      ORDER BY sequence_no DESC NULLS LAST, submitted_at DESC, id DESC
      LIMIT 1
    `, [portfolio.id]);
    const prevVersion = previous.rows[0] || null;
    const nextSeq = prevVersion ? Number(prevVersion.sequence_no || 0) + 1 : 1;

    const nonPredictionCountResult = await client.query(`
      SELECT count(*)::int count
      FROM portfolio_versions
      WHERE portfolio_id = $1 AND stage <> 'prediction'
    `, [portfolio.id]);
    const nonPredictionCount = Number(nonPredictionCountResult.rows[0]?.count || 0);
    const isPrediction = String(input.stage || '') === 'prediction';

    if (isPrediction) {
      const priorPrediction = await client.query(`
        SELECT 1 FROM portfolio_versions WHERE portfolio_id = $1 AND stage = 'prediction' LIMIT 1
      `, [portfolio.id]);
      if (priorPrediction.rows.length) throw new Error('PREDICTION_ALREADY_SUBMITTED');
    }

    const stage = isPrediction ? 'prediction' : (nonPredictionCount === 0 ? 'initial' : 'revision');
    const versionNumber = isPrediction ? 'v0.0' : `v${nonPredictionCount + 1}.0`;

    if (stage === 'revision') {
      const reason = String(input.revisionReason || input.changeSummary || '').trim();
      if (!reason) throw new Error('REVISION_REASON_REQUIRED');
    }

    let confidence = input.confidence === undefined || input.confidence === null ? null : Number(input.confidence);
    if (confidence !== null && (!Number.isFinite(confidence) || confidence < 1 || confidence > 5)) throw new Error('INVALID_CONFIDENCE');

    const changeSource = String(input.changeSource || (stage === 'initial' ? 'initial_response' : stage === 'prediction' ? 'initial_prediction' : 'self')).slice(0, 50);
    const changeSummary = String(input.changeSummary || input.revisionReason || '').trim();
    const revisionReason = String(input.revisionReason || '').trim();
    const contentChecksum = checksumContent(content);

    const inserted = await client.query(`
      INSERT INTO portfolio_versions(
        portfolio_id, version_number, content_json, change_summary, created_by, word_count,
        sequence_no, stage, confidence, change_source, revision_reason, previous_version_id,
        content_checksum, submission_key
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id, submitted_at, version_number, sequence_no, stage, content_checksum
    `, [
      portfolio.id, versionNumber, content, changeSummary, user.id, wordCount(content),
      nextSeq, stage, confidence, changeSource, revisionReason, prevVersion?.id || null,
      contentChecksum, submissionKey
    ]);
    const newVersion = inserted.rows[0];

    const linkedFeedbackIds = Array.isArray(input.linkedFeedbackIds)
      ? input.linkedFeedbackIds.map(String).filter(Boolean)
      : [];
    if (linkedFeedbackIds.length) {
      const linked = await client.query(`
        INSERT INTO version_feedback_links(version_id, feedback_id, relation)
        SELECT $1, f.id, 'prompted_revision'
        FROM feedbacks f
        WHERE f.id = ANY($2::uuid[]) AND f.portfolio_id = $3
        ON CONFLICT(version_id, feedback_id) DO NOTHING
        RETURNING feedback_id
      `, [newVersion.id, linkedFeedbackIds, portfolio.id]);
      const validIds = linked.rows.map(row => row.feedback_id);
      if (validIds.length) {
        await client.query(`
          UPDATE feedbacks
          SET resolved = true, resolved_at = now(), resolved_by_version_id = $1
          WHERE id = ANY($2::uuid[]) AND portfolio_id = $3
        `, [newVersion.id, validIds, portfolio.id]);
      }
    }

    await client.query(`
      UPDATE portfolios
      SET active_version = $2, status = 'submitted_waiting_ai', updated_at = now()
      WHERE id = $1
    `, [portfolio.id, versionNumber]);

    const aiPrompt = isPrediction
      ? 'Nhận xét dự đoán trước đọc: chỉ đánh giá căn cứ quan sát, logic lí giải, câu hỏi tò mò và mức tự tin; không tiết lộ cốt truyện hoặc đáp án.'
      : 'Đề xuất phản hồi bài viết theo các trục thi pháp được giao. Nêu điểm mạnh, điểm cần cải thiện có dẫn chứng và bước chỉnh sửa tiếp theo. Đây chỉ là đề xuất để giáo viên duyệt.';
    await client.query(`
      INSERT INTO ai_review_requests(portfolio_id, version_id, prompt, stage)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(version_id) DO NOTHING
    `, [portfolio.id, newVersion.id, aiPrompt, stage]);

    await audit(client, user, 'STUDENT_SUBMIT_VERSION', 'portfolio', portfolio.id, {
      versionId: newVersion.id,
      versionNumber,
      sequenceNo: nextSeq,
      stage,
      contentChecksum
    }, req);

    await client.query('COMMIT');
    return {
      ok: true,
      version: {
        id: newVersion.id,
        versionNumber: newVersion.version_number,
        sequenceNo: newVersion.sequence_no,
        stage: newVersion.stage,
        createdAt: newVersion.submitted_at,
        contentChecksum: newVersion.content_checksum
      },
      portfolioStatus: 'submitted_waiting_ai'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function teacherReviewAi(user, input, req) {
  if (!['teacher', 'admin'].includes(user.role)) throw new Error('FORBIDDEN');
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reviewResult = await client.query(`
      SELECT ar.*, p.student_id, p.id portfolio_id, a.class_id, a.public_id assignment_public_id,
             v.version_number
      FROM ai_review_requests ar
      JOIN portfolios p ON p.id = ar.portfolio_id
      JOIN assignments a ON a.id = p.assignment_id
      JOIN portfolio_versions v ON v.id = ar.version_id
      WHERE ar.id = $1
      FOR UPDATE OF ar
    `, [String(input.reviewId || '')]);
    const row = reviewResult.rows[0];
    if (!row) throw new Error('AI_REVIEW_NOT_FOUND');
    if (row.status !== 'completed') throw new Error('AI_REVIEW_NOT_COMPLETED');

    if (user.role !== 'admin' && !(await teacherCanAccessClass(client, row.class_id, user.id))) {
      throw new Error('TEACHER_CLASS_FORBIDDEN');
    }

    if (row.teacher_review_status !== 'pending') {
      const existingFeedback = await client.query(`
        SELECT id FROM feedbacks WHERE source_ai_review_id = $1 LIMIT 1
      `, [row.id]);
      await client.query('COMMIT');
      return {
        ok: true,
        isIdempotentRetry: true,
        decision: row.teacher_review_status,
        feedbackId: existingFeedback.rows[0]?.id || null
      };
    }

    const decision = String(input.decision || input.status || '');
    if (!['approved', 'revised', 'rejected'].includes(decision)) throw new Error('INVALID_STATUS');

    let finalResponse = '';
    if (decision === 'approved') finalResponse = String(input.finalResponse || row.response || '').trim();
    if (decision === 'revised') {
      finalResponse = String(input.finalResponse || '').trim();
      if (!finalResponse) throw new Error('REVISED_RESPONSE_REQUIRED');
    }
    if (decision === 'rejected') finalResponse = String(input.finalResponse || '').trim();

    const axisId = String(input.axisId || 'form_argument');
    if (!AXES.includes(axisId)) throw new Error('INVALID_AXIS');

    await client.query(`
      UPDATE ai_review_requests
      SET teacher_review_status = $2, final_response = $3, teacher_id = $4,
          teacher_reviewed_at = now(), teacher_note = $5
      WHERE id = $1
    `, [row.id, decision, finalResponse, user.id, String(input.teacherNote || input.note || '')]);

    let feedbackId = null;
    if (finalResponse) {
      const feedbackResult = await client.query(`
        INSERT INTO feedbacks(portfolio_id, version_id, axis_id, selected_snippet, comment, author_id, author_role, source_ai_review_id)
        VALUES($1,$2,$3,$4,$5,$6,'teacher',$7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [row.portfolio_id, row.version_id, axisId, String(input.selectedSnippet || ''), finalResponse, user.id, row.id]);
      feedbackId = feedbackResult.rows[0]?.id || null;
      if (!feedbackId) {
        const existing = await client.query('SELECT id FROM feedbacks WHERE source_ai_review_id = $1 LIMIT 1', [row.id]);
        feedbackId = existing.rows[0]?.id || null;
      }
      await client.query("UPDATE portfolios SET status = 'feedback_received', updated_at = now() WHERE id = $1", [row.portfolio_id]);
    } else {
      await client.query("UPDATE portfolios SET status = 'teacher_feedback_needed', updated_at = now() WHERE id = $1", [row.portfolio_id]);
    }

    await audit(client, user, 'TEACHER_FINALIZE_AI_REVIEW', 'ai_review', row.id, {
      decision,
      feedbackId,
      hasFinalResponse: Boolean(finalResponse)
    }, req);

    await client.query('COMMIT');
    return { ok: true, decision, feedbackId, portfolioStatus: finalResponse ? 'feedback_received' : 'teacher_feedback_needed' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function normalizeCriterionInput(value) {
  if (value && typeof value === 'object') {
    return {
      level: Number(value.level ?? value.score ?? 0),
      note: String(value.note || '')
    };
  }
  return { level: Number(value || 0), note: '' };
}

async function submitRubric(user, input, req) {
  if (!['student', 'teacher', 'peer', 'admin'].includes(user.role)) throw new Error('FORBIDDEN');
  const pool = await getPool();
  const targetStudentId = String(input.studentId || user.id);
  if (user.role === 'student' && targetStudentId !== user.id) throw new Error('FORBIDDEN_STUDENT_RUBRIC');
  const portfolio = await portfolioByPublicIds(pool, String(input.assignmentId || ''), targetStudentId);
  if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

  if (user.role === 'teacher' && !(await teacherCanAccessClass(pool, portfolio.class_id, user.id))) throw new Error('TEACHER_CLASS_FORBIDDEN');
  if (user.role === 'peer') {
    const check = await pool.query(`
      SELECT 1 FROM peer_review_assignments
      WHERE assignment_id = $1 AND student_id = $2 AND reviewer_id = $3
      LIMIT 1
    `, [portfolio.assignment_id, portfolio.student_id, user.id]);
    if (!check.rows.length) throw new Error('PEER_ASSIGNMENT_FORBIDDEN');
  }

  const versionQuery = input.versionId
    ? await pool.query('SELECT id FROM portfolio_versions WHERE portfolio_id = $1 AND id = $2', [portfolio.id, input.versionId])
    : await pool.query('SELECT id FROM portfolio_versions WHERE portfolio_id = $1 AND version_number = $2', [portfolio.id, String(input.versionNumber || '')]);
  const version = versionQuery.rows[0];
  if (!version) throw new Error('VERSION_NOT_FOUND');

  const criteriaResult = await pool.query(`
    SELECT rc.public_id, rc.weight, rc.levels_json
    FROM assignments a
    JOIN rubric_criteria rc ON rc.rubric_id = a.rubric_id
    WHERE a.id = $1
    ORDER BY rc.sort_order
  `, [portfolio.assignment_db_id]);
  if (!criteriaResult.rows.length) throw new Error('RUBRIC_NOT_FOUND');

  const incoming = input.criterionScores && typeof input.criterionScores === 'object' ? input.criterionScores : {};
  const normalized = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const criterion of criteriaResult.rows) {
    const levels = Array.isArray(criterion.levels_json) ? criterion.levels_json : [];
    const supplied = normalizeCriterionInput(incoming[criterion.public_id]);
    const levelDef = levels.find(level => Number(level.level) === supplied.level);
    if (!levelDef) throw new Error(`INVALID_RUBRIC_LEVEL:${criterion.public_id}`);
    const weight = Number(criterion.weight || 1);
    const score = Number(levelDef.score ?? levelDef.level ?? supplied.level);
    const maximum = levels.reduce((max, level) => Math.max(max, Number(level.score ?? level.level ?? 0)), 0);
    totalScore += score * weight;
    maxScore += maximum * weight;
    normalized[criterion.public_id] = { level: supplied.level, score, note: supplied.note };
  }

  const unknownCriteria = Object.keys(incoming).filter(id => !criteriaResult.rows.some(row => row.public_id === id));
  if (unknownCriteria.length) throw new Error('INVALID_RUBRIC_CRITERION');

  const evaluatorRole = user.role === 'admin' ? 'teacher' : user.role;
  const inserted = await pool.query(`
    INSERT INTO rubric_submissions(
      portfolio_id, version_id, evaluator_id, evaluator_role, criterion_scores,
      overall_feedback, total_score, max_score
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, submitted_at
  `, [
    portfolio.id, version.id, user.id, evaluatorRole, normalized,
    String(input.overallFeedback || ''), totalScore, maxScore
  ]);
  await audit(pool, user, 'SUBMIT_RUBRIC', 'portfolio', portfolio.id, {
    submissionId: inserted.rows[0].id,
    totalScore,
    maxScore
  }, req);
  return { ok: true, id: inserted.rows[0].id, submittedAt: inserted.rows[0].submitted_at, totalScore, maxScore };
}

async function assignPeerReview(user, input, req) {
  if (!['teacher', 'admin'].includes(user.role)) throw new Error('FORBIDDEN');
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const assignmentId = String(input.assignmentId || '');
    const reviewerId = String(input.reviewerId || '');
    const studentId = String(input.studentId || '');
    const versionId = input.versionId ? String(input.versionId) : null;
    if (!assignmentId || !reviewerId || !studentId) throw new Error('VALIDATION_ERROR');
    if (reviewerId === studentId) throw new Error('CANNOT_PEER_REVIEW_SELF');

    const assignment = await client.query('SELECT id, class_id FROM assignments WHERE public_id = $1 LIMIT 1', [assignmentId]);
    const assignmentRow = assignment.rows[0];
    if (!assignmentRow) throw new Error('ASSIGNMENT_NOT_FOUND');
    if (user.role !== 'admin' && !(await teacherCanAccessClass(client, assignmentRow.class_id, user.id))) throw new Error('TEACHER_CLASS_FORBIDDEN');

    const reviewer = await client.query(`SELECT id FROM app_users WHERE id = $1 AND role = 'peer' AND account_status = 'active' LIMIT 1`, [reviewerId]);
    if (!reviewer.rows.length) throw new Error('PEER_REVIEWER_INVALID');

    const student = await client.query(`
      SELECT 1 FROM class_members cm
      JOIN app_users u ON u.id = cm.user_id
      WHERE cm.class_id = $1 AND cm.user_id = $2 AND cm.member_role = 'student' AND u.account_status = 'active'
      LIMIT 1
    `, [assignmentRow.class_id, studentId]);
    if (!student.rows.length) throw new Error('PEER_STUDENT_INVALID');

    const portfolio = await client.query(`SELECT id FROM portfolios WHERE assignment_id = $1 AND student_id = $2 LIMIT 1`, [assignmentRow.id, studentId]);
    if (!portfolio.rows[0]) throw new Error('PORTFOLIO_NOT_FOUND');

    if (versionId) {
      const version = await client.query('SELECT 1 FROM portfolio_versions WHERE id = $1 AND portfolio_id = $2 LIMIT 1', [versionId, portfolio.rows[0].id]);
      if (!version.rows.length) throw new Error('VERSION_NOT_FOUND');
    }

    const result = await client.query(`
      INSERT INTO peer_review_assignments(assignment_id, reviewer_id, student_id, version_id)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(assignment_id, reviewer_id, student_id)
      DO UPDATE SET version_id = EXCLUDED.version_id, status = 'pending', completed_at = NULL
      RETURNING id
    `, [assignmentRow.id, reviewerId, studentId, versionId]);
    await audit(client, user, 'ASSIGN_PEER_REVIEW', 'peer_review', result.rows[0].id, { reviewerId, studentId, versionId }, req);
    await client.query('COMMIT');
    return { ok: true, id: result.rows[0].id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function academicAction(user, input, req) {
  await ensureHardeningSchema();
  assertSameOrigin(req);
  const action = String(input?.action || '');
  if (action === 'create_version') return createVersion(user, input, req);
  if (action === 'teacher_review_ai') return teacherReviewAi(user, input, req);
  if (action === 'submit_rubric') return submitRubric(user, input, req);
  if (action === 'assign_peer_review') return assignPeerReview(user, input, req);
  return legacyAcademicAction(user, input, req);
}

export async function academicHealth() {
  await ensureHardeningSchema();
  return legacyAcademicHealth();
}
