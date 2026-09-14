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

await test('AF01: portfolio HTML export escapes user-controlled content before document.write', () => {
  const source = read('src/utils/exportUtils.ts');
  assert(source.includes('const escapeHtml ='), 'Missing HTML escaping helper');
  for (const token of [
    'escapeHtml(resp.analysisText)',
    'escapeHtml(q.text)',
    'escapeHtml(portfolio.studentName)',
    'escapeHtml(portfolio.className)',
    'escapeHtml(r.overallFeedback)',
    'escapeHtml(version.changeSummary)'
  ]) assert(source.includes(token), `Missing escaping: ${token}`);
});

await test('AF02: teacher dashboard does not count V0 prediction as a submitted academic version', () => {
  const source = read('src/views/TeacherDashboardView.tsx');
  assert(source.includes("version.stage !== 'prediction'"), 'Teacher dashboard must exclude V0 prediction versions');
  assert(!source.includes("p.versions.length > 0"), 'Teacher dashboard still treats any version, including V0, as a submission');
});

await test('AF03: authenticated login route always recovers to the role home without requiring refresh', () => {
  const source = read('src/App.tsx');
  assert(source.includes("if (sessionChecking || !isAuthenticated || currentView !== 'login' || !currentUser.id) return;"), 'Missing authenticated /login recovery guard');
  assert(source.includes('replaceToView(homeViewForRole(currentUser.role));'), 'Missing role-home recovery redirect');
  assert(source.includes("if (currentView === 'login') return <ViewLoading />;"), 'Authenticated /login must not render the public landing during route hand-off');
  assert(source.includes('const replaceToView = useCallback('), 'Route replacement should be stable across auth effects');
});

const failed = results.filter(result => !result.ok);
console.log(`${results.length - failed.length}/${results.length} audit-fix tests passed.`);
if (failed.length) process.exit(1);
