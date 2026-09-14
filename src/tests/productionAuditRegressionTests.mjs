import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
let passed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log('✓', name);
  } catch (error) {
    console.error('✗', name);
    throw error;
  }
};

await test('PA01: production rubric fallback never invents a catalog id', () => {
  const source = read('src/contexts/PortfolioContext.tsx');
  assert(source.includes("const emptyRubric: RubricMatrix = { id: '',"));
  assert(!source.includes("const emptyRubric: RubricMatrix = { id: 'rubric-poetics-std'"));
});

await test('PA02: modal keeps viewport safety and traps focus', () => {
  const source = read('src/components/ui/Modal.tsx');
  assert(source.includes('createPortal('));
  assert(source.includes('max-h-[calc(100dvh-1.5rem)]'));
  assert(source.includes("event.key !== 'Tab'"));
  assert(source.includes('previousFocusRef.current?.focus()'));
  assert(source.includes('aria-labelledby'));
});

await test('PA03: dropdown exposes keyboard and ARIA menu semantics', () => {
  const source = read('src/components/ui/Dropdown.tsx');
  assert(source.includes("'aria-expanded': isOpen"));
  assert(source.includes("event.key === 'ArrowDown'"));
  assert(source.includes("event.key === 'ArrowUp'"));
  assert(source.includes("event.key === 'Escape'"));
  assert(source.includes('role="menuitem"'));
});

await test('PA04: production CSP blocks framing/object injection while allowing app fonts', () => {
  const source = read('vercel.json');
  assert(source.includes('Content-Security-Policy'));
  assert(source.includes("object-src 'none'"));
  assert(source.includes("frame-ancestors 'none'"));
  assert(source.includes('fonts.googleapis.com'));
  assert(source.includes('fonts.gstatic.com'));
});

await test('PA05: REF1 follows the exact immutable version selected by the reviewer', () => {
  const source = read('src/views/TeacherReviewView.tsx');
  assert(source.includes('r.versionId === selectedSnapshot.id'));
  assert(source.includes('[reflections, currentPortfolio, assignment, selectedSnapshot]'));
});

await test('PA06: previous/next review navigation operates on the filtered queue', () => {
  const source = read('src/views/TeacherReviewView.tsx');
  assert(source.includes('const visibleQueueIndex = currentPortfolio'));
  assert(source.includes('const nextItem = filteredQueue[visibleQueueIndex + offset]'));
  assert(source.includes('/ {filteredQueue.length}'));
  assert(source.includes('disabled={visibleQueueIndex <= 0}'));
});

await test('PA07: three-tier view hierarchy is role-derived and mutation routes do not inherit', () => {
  const access = read('src/app/auth/accessControl.ts');
  const app = read('src/App.tsx');
  const desktop = read('src/components/layout/AppSidebar.tsx');
  const mobile = read('src/components/layout/MobileDrawer.tsx');
  assert(access.includes('admin: 1'));
  assert(access.includes('teacher: 2'));
  assert(access.includes('ai: 2'));
  assert(access.includes('student: 3'));
  assert(access.includes("'/student/analytics'"));
  assert(!access.includes("'/student/editor'"));
  assert(!access.includes("'/teacher/assignment-builder'"));
  assert(app.includes('canAccessRoute(currentUser.role, routeConfig)'));
  assert(desktop.includes("label: 'Xem tầng dưới'"));
  assert(mobile.includes("label: 'Xem học sinh'"));
});

await test('PA08: assignment builder only keeps and submits a rubric from the hydrated catalog', () => {
  const source = read('src/views/AssignmentBuilderView.tsx');
  assert(source.includes('rubricOptions.some(r => r.id === f.rubricId) ? f.rubricId'));
  assert(source.includes('!rubricOptions.some(option => option.id === form.rubricId)'));
  assert(!source.includes("rubricId: f.rubricId || rubricOptions[0]?.id || rubric.id || ''"));
});

await test('PA09: health statistics use a short in-instance cache without changing the response contract', () => {
  const source = read('api/health.ts');
  assert(source.includes('HEALTH_CACHE_MS = 30_000'));
  assert(source.includes('cachedAcademicHealth()'));
  assert(source.includes('assignments: counts.assignments'));
  assert(source.includes('jwtSecretConfigured'));
});

console.log(`Production audit regressions: ${passed}/9 passed`);
