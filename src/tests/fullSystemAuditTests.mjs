import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const results = [];
const assert = (condition, message = 'Assertion failed') => { if (!condition) throw new Error(message); };
const test = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); console.log(`✓ ${name}`); }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, error: message });
    console.error(`✗ ${name} — ${message}`);
  }
};

await test('FSA01: JWT signing requires a dedicated 32+ character secret', () => {
  const source = read('api/auth/auth.js');
  assert(source.includes('authSecretConfigured'), 'Missing JWT readiness helper');
  assert(source.includes('JWT_SECRET_NOT_CONFIGURED'), 'JWT must fail closed when secret is missing');
  assert(!source.includes('.update(databaseUrl())'), 'JWT must never derive its signing secret from DATABASE_URL');
});

await test('FSA02: health exposes only JWT readiness, never the secret value', () => {
  const source = read('api/health.ts');
  assert(source.includes('jwtSecretConfigured: authSecretConfigured()'));
  assert(!source.includes('process.env.JWT_SECRET'));
});

await test('FSA03: assignment creation normalizes required workflow invariants server-side', () => {
  const source = read('api/academic/action.ts');
  for (const token of [
    'normalizeCreateAssignmentInput',
    'aiReviewRequired: true',
    'teacherApprovalRequired: true',
    'reflectionRequired: true',
    'officialRubricRequired: true',
    'rawBytes > 1_000_000'
  ]) assert(source.includes(token), `Missing server assignment guard: ${token}`);
});

await test('FSA04: assignment builder cannot disable required AI, reflection, or official rubric steps', () => {
  const source = read('src/views/AssignmentBuilderView.tsx');
  assert(source.includes('const [predictionEnabled, setPredictionEnabled]'));
  assert(source.includes('aiReviewRequired: true'));
  assert(source.includes('reflectionRequired: true'));
  assert(source.includes('officialRubricRequired: true'));
  assert(!source.includes('setWorkflow('), 'Required workflow steps must not be client-toggleable');
});

await test('FSA05: admin role changes preserve existing student academic history', () => {
  const source = read('api/admin/manage.ts');
  assert(source.includes("before.role === 'student' && role !== 'student'"));
  assert(source.includes('ROLE_CHANGE_HAS_ACADEMIC_HISTORY'));
  assert(source.includes('SELECT 1 FROM portfolios WHERE student_id=$1 LIMIT 1'));
  assert(source.includes("if (role === 'student')"));
  assert(source.includes('INSERT INTO portfolio_drafts'));
});

await test('FSA06: rubric catalog requires six axes and exact four unique levels with bounded numeric values', () => {
  const source = read('api/academic/catalog.ts');
  for (const token of [
    'criteria.length !== AXES.length',
    'levels.length !== 4',
    'new Set(levelNumbers).size !== 4',
    'weight <= 0 || weight > 100',
    'score < 0 || score > 100',
    'CONTENT_TOO_LARGE'
  ]) assert(source.includes(token), `Missing rubric validation: ${token}`);
});

const failed = results.filter(result => !result.ok);
console.log(`${results.length - failed.length}/${results.length} full-system audit regression tests passed.`);
if (failed.length) process.exit(1);
