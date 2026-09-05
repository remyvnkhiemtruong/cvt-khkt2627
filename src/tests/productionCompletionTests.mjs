import fs from 'node:fs';
import { checksumContent, stableStringify } from '../../api/_lib/academic-v3.js';
import { computeAxisDiff } from '../utils/diffEngine.ts';

const read = path => fs.readFileSync(path, 'utf8');
const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    console.error(`✗ ${name} — ${results.at(-1).error}`);
  }
};
const assert = (condition, message = 'Assertion failed') => { if (!condition) throw new Error(message); };

await test('P01: production endpoints use academic-v3 only', () => {
  for (const path of ['api/academic/action.ts', 'api/academic/snapshot.ts', 'api/academic/catalog.ts', 'api/health.ts']) {
    assert(read(path).includes('academic-v3.js'), `${path} chưa dùng academic-v3`);
    assert(!read(path).includes('academic-v2.js'), `${path} còn dùng academic-v2`);
  }
});

await test('P02: academic-v3 does not import legacy academic service', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(!source.includes("from './academic.js'"));
  assert(!source.includes('legacyAcademic'));
});

await test('P03: auth request path does not create/alter schema or seed identities', () => {
  const source = read('api/auth/auth.js');
  assert(!source.includes('CREATE TABLE'));
  assert(!source.includes('ALTER TABLE'));
  assert(!source.includes('BOOTSTRAP_'));
  assert(!source.includes('admin@cvt.edu.vn'));
  assert(!source.includes('hocsinh@cvt.edu.vn'));
});

await test('P04: JWT requires a dedicated secret', () => {
  const source = read('api/auth/auth.js');
  assert(source.includes('process.env.JWT_SECRET'));
  assert(!source.includes('process.env.DATABASE_URL'));
});

await test('P05: private APIs are no-store', () => {
  for (const path of ['api/academic/action.ts', 'api/academic/snapshot.ts', 'api/academic/catalog.ts', 'api/auth/auth.js']) {
    assert(read(path).includes('no-store'), `${path} thiếu no-store`);
  }
});

await test('P06: stable JSON canonicalizes nested key order', () => {
  const a = { z: 1, nested: { b: 2, a: 3 }, array: [{ y: 2, x: 1 }] };
  const b = { array: [{ x: 1, y: 2 }], nested: { a: 3, b: 2 }, z: 1 };
  assert(stableStringify(a) === stableStringify(b));
  assert(checksumContent(a) === checksumContent(b));
});

await test('P07: nested evidence mutation changes checksum', () => {
  const a = { plot_situation: { analysisText: 'A', evidenceQuotes: [{ id: 'q1', text: 'Dẫn chứng A' }] } };
  const b = { plot_situation: { analysisText: 'A', evidenceQuotes: [{ id: 'q1', text: 'Dẫn chứng B' }] } };
  assert(checksumContent(a) !== checksumContent(b));
});

await test('P08: sequence_no and pedagogical V0/V1/V2 are independent', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes('nextSeq = prev ? Number(prev.sequence_no || 0) + 1 : 1'));
  assert(source.includes("versionNumber = isPrediction ? 'V0' : `V${submissionCount + 1}`"));
  assert(source.includes("count(*) FILTER(WHERE stage<>'prediction')"));
});

await test('P09: create_version requires idempotency key', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes("throw new Error('SUBMISSION_KEY_REQUIRED')"));
  assert(source.includes('WHERE portfolio_id=$1 AND submission_key=$2'));
});

await test('P10: version and AI request are created in one transaction', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('async function createVersion');
  const end = source.indexOf('async function aiCompleteReview');
  const block = source.slice(start, end);
  assert(block.includes("await client.query('BEGIN')"));
  assert(block.includes('INSERT INTO portfolio_versions'));
  assert(block.includes('INSERT INTO ai_review_requests'));
  assert(block.includes("await client.query('COMMIT')"));
});

await test('P11: AI proposal cannot create student feedback', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('async function aiCompleteReview');
  const end = source.indexOf('async function teacherReviewAi');
  const block = source.slice(start, end);
  assert(!block.includes('INSERT INTO feedbacks'));
  assert(block.includes("status='completed'"));
  assert(block.includes("teacher_review_status='pending'"));
});

await test('P12: teacher finalization has approve/revise/reject and reject publishes no AI text', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('async function teacherReviewAi');
  const end = source.indexOf('async function addFeedback');
  const block = source.slice(start, end);
  assert(block.includes("decision === 'approved'"));
  assert(block.includes("decision === 'revised'"));
  assert(block.includes("decision !== 'rejected' && finalResponse"));
  assert(block.includes("status='teacher_feedback_needed'"));
});

await test('P13: peer review is bound to exact immutable version', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes('async function exactPeerScope'));
  assert(source.includes('pra.version_id=$2'));
  assert(source.includes('EXISTS(SELECT 1 FROM portfolio_versions v WHERE v.id=pra.version_id AND v.portfolio_id=p.id)'));
});

await test('P14: teacher access is class-scoped', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes('async function teacherCanAccessClass'));
  assert(source.includes("member_role='teacher'"));
  assert(source.includes('TEACHER_CLASS_FORBIDDEN'));
});

await test('P15: rubric score is server-calculated from assignment rubric', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('async function submitRubric');
  const end = source.indexOf('async function assignPeerReview');
  const block = source.slice(start, end);
  assert(block.includes('JOIN rubric_criteria rc ON rc.rubric_id=a.rubric_id'));
  assert(block.includes('totalScore += score * weight'));
  assert(block.includes('maxScore += maximum * weight'));
  assert(!block.includes('input.totalScore'));
  assert(!block.includes('input.maxScore'));
});

await test('P16: arbitrary rubric criteria are rejected', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes("throw new Error('INVALID_RUBRIC_CRITERION')"));
  assert(source.includes('INVALID_RUBRIC_LEVEL'));
});

await test('P17: literature edits create immutable revisions', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('export async function saveLiteratureRevision');
  const end = source.indexOf('export async function createRubricVersion');
  const block = source.slice(start, end);
  assert(block.includes('INSERT INTO literature_text_versions'));
  assert(block.includes('revisionNo = Number(latest.rows[0]?.revision_no || 0) + 1'));
});

await test('P18: assignment creation binds exact latest literature revision', () => {
  const source = read('api/_lib/academic-v3.js');
  const start = source.indexOf('async function createAssignment');
  const end = source.indexOf('export async function academicAction');
  const block = source.slice(start, end);
  assert(block.includes('literature_text_version_id'));
  assert(block.includes('LITERATURE_VERSION_NOT_LATEST'));
  assert(block.includes('textVersionId'));
});

await test('P19: assignment builder sends textVersionId and explicit rubricId', () => {
  const source = read('src/views/AssignmentBuilderView.tsx');
  assert(source.includes('textVersionId: textId'));
  assert(source.includes('rubricId,'));
  assert(!source.includes('assign-${Date.now()}'));
});

await test('P20: literature UI creates revision rather than overwriting logical identity', () => {
  const source = read('src/views/LiteratureTextsView.tsx');
  assert(source.includes("logicalId: editing?.logicalId"));
  assert(source.includes('Tạo revision mới'));
});

await test('P21: dirty draft survives snapshot hydration', () => {
  const source = read('src/app/store/usePortfolioStore.ts');
  assert(source.includes('dirtyPortfolioKeys.has(key) && localPortfolio'));
  assert(source.includes('currentDraft: localPortfolio.currentDraft'));
});

await test('P22: submission retry key survives network failure and concurrent clicks collapse', () => {
  const source = read('src/app/store/usePortfolioStore.ts');
  assert(source.includes('pendingSubmissionKeys.get(key) || options.submissionKey || newSubmissionKey()'));
  assert(source.includes('inFlightSubmissions.get(key)'));
  assert(source.includes('inFlightSubmissions.set(key, operation)'));
});

await test('P23: optional V0 does not turn V1 into revision', () => {
  const source = read('src/components/versioning/CreateVersionModal.tsx');
  assert(source.includes('effectiveInitial'));
  assert(source.includes("stage = isPrediction ? 'prediction' : (effectiveInitial ? 'initial' : 'revision')"));
});

await test('P24: Student Analytics does not fallback to unrelated global rubric', () => {
  const source = read('src/views/StudentAnalyticsView.tsx');
  assert(source.includes('rubrics[assignment.rubricId]'));
  assert(!source.includes('|| rubric'));
  assert(!source.includes('/4'));
});

await test('P25: Class Analytics aggregates class metrics per unique student', () => {
  const source = read('src/views/ClassAnalyticsView.tsx');
  assert(source.includes('studentAggregates'));
  assert(source.includes('new Set(filtered.map(portfolio => portfolio.studentId)).size'));
  assert(!source.includes('|| rubric'));
  assert(!source.includes('/4'));
});

await test('P26: researcher UI uses assignment rubric and no essay evidence', () => {
  const source = read('src/views/ResearcherJudgeView.tsx');
  assert(source.includes('rubrics[assignment.rubricId]'));
  assert(!source.includes('analysisText'));
  assert(!source.includes('/4'));
});

await test('P27: researcher/AI snapshot deliberately blanks mutable drafts', () => {
  const source = read('api/_lib/academic-v3.js');
  assert(source.includes("currentDraft: role === 'student' ? (row.content_json || emptyDraft()) : emptyDraft()"));
  assert(source.includes("peerOrAi ? pseudonym('SUB', row.student_id)"));
});

await test('P28: Vietnamese canonical Unicode diff is stable', () => {
  const composed = 'Vợ nhặt';
  const decomposed = composed.normalize('NFD');
  const result = computeAxisDiff('plot_situation', composed, decomposed);
  assert(result.changeType === 'unchanged');
  assert(result.wordsAdded === 0 && result.wordsRemoved === 0);
});

await test('P29: diff classifies added/deleted/changed/unchanged', () => {
  assert(computeAxisDiff('x', '', 'mới').changeType === 'added');
  assert(computeAxisDiff('x', 'cũ', '').changeType === 'deleted');
  assert(computeAxisDiff('x', 'cũ', 'mới').changeType === 'changed');
  assert(computeAxisDiff('x', 'giữ', 'giữ').changeType === 'unchanged');
});

await test('P30: TLS verify-full remains enforced', () => {
  const source = read('api/_lib/db.js');
  const unsafeSpaced = 'rejectUnauthorized' + ': false';
  const unsafeCompact = 'rejectUnauthorized' + ':false';
  assert(source.includes('sslmode=verify-full'));
  assert(!source.includes(unsafeSpaced));
  assert(!source.includes(unsafeCompact));
});

await test('P31: SPA rewrite excludes API and function budget stays config-compatible', () => {
  const config = JSON.parse(read('vercel.json'));
  const fallback = config.rewrites?.find(rule => rule.destination === '/index.html');
  assert(fallback?.source?.includes('(?!api'));
  assert(config.regions?.includes('sin1'));
});

await test('P32: no global browser MutationObserver disables editor input behavior', () => {
  const source = read('index.html');
  assert(!source.includes('MutationObserver'));
  assert(!source.includes("spellcheck', 'false"));
});

const failed = results.filter(result => !result.ok);
console.log(`${results.length - failed.length}/${results.length} production completion regression tests passed.`);
if (failed.length) process.exit(1);
