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
  assert(desktop.includes("label: 'Xem dữ liệu'"));
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

await test('PA10: V0 question bank survives teacher creation and is rendered to students', () => {
  const builder = read('src/views/AssignmentBuilderView.tsx');
  const action = read('api/academic/action.ts');
  const editor = read('src/views/PortfolioEditorView.tsx');
  assert(builder.includes('questions: predictionEnabled ? predictionQuestions : []'));
  assert(builder.includes('predictionQuestions.length === 0'));
  assert(action.includes('PREDICTION_QUESTIONS_REQUIRED'));
  assert(editor.includes('assignment?.predictionTemplate?.questions'));
  assert(editor.includes('Câu hỏi V0'));
});

await test('PA11: core UI copy avoids obvious AI-generated jargon', () => {
  const files = [
    'src/views/LandingView.tsx',
    'src/views/LoginView.tsx',
    'src/views/v2/StudentDashboardV2.tsx',
    'src/views/AssignmentListView.tsx',
    'src/views/AssignmentBuilderView.tsx',
    'src/views/PortfolioEditorView.tsx',
    'src/views/TeacherDashboardView.tsx',
    'src/views/TeacherReviewView.tsx',
    'src/views/AiWorkspaceView.tsx',
    'src/views/StudentAnalyticsView.tsx',
    'src/views/ClassAnalyticsView.tsx',
    'src/views/LiteratureTextsView.tsx',
    'src/views/RubricManagementView.tsx',
    'src/components/layout/AppHeader.tsx'
  ];
  const source = files.map(read).join('\n');
  for (const phrase of [
    'provenance',
    'Luồng học thuật khép kín',
    'quy chuẩn học thuật khép kín',
    'Focus Mode',
    'response từ ChatGPT',
    'Response từ ChatGPT',
    'Hồ sơ tiến bộ học tập'
  ]) assert(!source.includes(phrase), phrase);
});

await test('PA12: closed assignments are hidden from students and reject writes server-side', () => {
  const academic = read('api/_lib/academic-v3.js');
  const workflow = read('api/_lib/academic-workflow-v4.js');
  const action = read('api/academic/action.ts');
  assert(academic.includes("WHERE p.student_id=$1 AND a.status='published'"));
  assert(academic.match(/assignment_status !== 'published'/g)?.length >= 2);
  assert(workflow.includes("row.assignment_status !== 'published'"));
  assert(action.includes('ASSIGNMENT_CLOSED'));
  assert(action.includes('status = 409'));
});

await test('PA13: V0 hides assigned reading content until prediction is submitted', () => {
  const academic = read('api/_lib/academic-v3.js');
  const editor = read('src/views/PortfolioEditorView.tsx');
  assert(academic.includes("v.stage='prediction'"));
  assert(academic.includes("synopsis: locked ? '' : row.synopsis"));
  assert(academic.includes("fullContent: locked ? '' : row.full_content"));
  assert(editor.includes('Ngữ liệu sẽ mở sau khi em nộp V0.'));
  assert(editor.includes("literatureText?.fullContent || literatureText?.excerpt"));
});

await test('PA14: student cannot open the literature catalog and research catalogs are read-only', () => {
  const routes = read('src/app/router/routes.tsx');
  const palette = read('src/components/layout/CommandPalette.tsx');
  const literature = read('src/views/LiteratureTextsView.tsx');
  const rubric = read('src/views/RubricManagementView.tsx');
  assert(routes.includes("allowedRoles:['teacher','admin','researcher']"));
  assert(!routes.includes("allowedRoles:['teacher','admin','student','researcher']"));
  assert(palette.includes("roles: ['teacher', 'researcher', 'admin']"));
  assert(literature.includes("const canEdit = currentUser.role === 'teacher' || currentUser.role === 'admin'"));
  assert(rubric.includes("const canEdit = currentUser.role === 'teacher' || currentUser.role === 'admin'"));
});

await test('PA15: 403 and 404 pages return users to the correct role home', () => {
  const forbidden = read('src/views/ForbiddenView.tsx');
  const missing = read('src/views/NotFoundView.tsx');
  for (const source of [forbidden, missing]) {
    assert(source.includes("role === 'ai' ? 'ai-workspace'"));
    assert(source.includes("role === 'teacher' ? 'teacher-dashboard'"));
    assert(source.includes("role === 'researcher' ? 'researcher-view'"));
    assert(source.includes("role === 'admin' ? 'admin-view'"));
  }
});

await test('PA16: remaining user-facing copy avoids internal product jargon', () => {
  const files = [
    'src/views/LiteratureTextsView.tsx',
    'src/views/ResearcherJudgeView.tsx',
    'src/views/ForbiddenView.tsx',
    'src/views/NotFoundView.tsx',
    'src/components/layout/AppSidebar.tsx',
    'src/components/layout/MobileDrawer.tsx'
  ];
  const source = files.map(read).join('\n');
  for (const phrase of [
    'AI Workspace',
    'Tạo revision mới',
    'Lưu revision mới',
    'pseudonym server-side',
    'UUID định danh thật',
    'Xem tầng dưới'
  ]) assert(!source.includes(phrase), phrase);
});

console.log(`Production audit regressions: ${passed}/16 passed`);
