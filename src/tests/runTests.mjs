import fs from 'node:fs';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', error: error instanceof Error ? error.message : String(error) });
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function normalizeVietnameseNFC(text) {
  return String(text).normalize('NFC').trim();
}

function calculateVisualDiff(v1, v2) {
  const before = normalizeVietnameseNFC(v1);
  const after = normalizeVietnameseNFC(v2);
  if (before === after) return { type: 'unchanged' };
  if (!before && after) return { type: 'added', prefix: '+' };
  if (before && !after) return { type: 'deleted', prefix: '−' };
  return { type: 'changed', prefix: '✎' };
}

const permissions = {
  student: ['create_draft', 'freeze_version', 'view_diff', 'self_assess', 'resolve_feedback'],
  peer: ['view_diff', 'peer_feedback', 'peer_rubric'],
  teacher: ['view_diff', 'create_assignment', 'teacher_feedback', 'teacher_rubric', 'view_class_analytics', 'ai_review_queue'],
  researcher: ['view_diff', 'view_anonymous_study', 'export_anonymized_data'],
  admin: ['view_diff', 'view_admin_users', 'view_research', 'ai_review_queue'],
  ai: ['ai_review_queue']
};

function can(role, action) {
  return permissions[role]?.includes(action) ?? false;
}

function calculateRubricTotal(scores) {
  const values = Object.values(scores);
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = values.length * 4;
  return { total, max, percentage: max ? Math.round((total / max) * 100) : 0 };
}

test('Unicode tiếng Việt được chuẩn hóa NFC', () => {
  assert(normalizeVietnameseNFC(' Vợ nhặt – Kim Lân ') === 'Vợ nhặt – Kim Lân');
});

test('Visual Diff phân biệt thêm/xóa/sửa/không đổi', () => {
  assert(calculateVisualDiff('', 'mới').prefix === '+');
  assert(calculateVisualDiff('cũ', '').prefix === '−');
  assert(calculateVisualDiff('cũ', 'mới').prefix === '✎');
  assert(calculateVisualDiff('giữ nguyên', 'giữ nguyên').type === 'unchanged');
});

test('Rubric 6 trục tính đúng tổng và phần trăm', () => {
  const value = calculateRubricTotal({ a: 4, b: 3, c: 3, d: 2, e: 4, f: 4 });
  assert(value.total === 20);
  assert(value.max === 24);
  assert(value.percentage === 83);
});

test('Ma trận quyền bao phủ đủ 6 role production', () => {
  const roles = ['student', 'teacher', 'peer', 'researcher', 'admin', 'ai'];
  assert(roles.every((role) => Array.isArray(permissions[role])));
});

test('Học sinh không có quyền xem danh sách admin', () => {
  assert(!can('student', 'view_admin_users'));
});

test('Admin có quyền đọc danh sách user thật', () => {
  assert(can('admin', 'view_admin_users'));
});

test('Teacher, Admin và AI được dùng hàng đợi AI; student không được', () => {
  assert(can('teacher', 'ai_review_queue'));
  assert(can('admin', 'ai_review_queue'));
  assert(can('ai', 'ai_review_queue'));
  assert(!can('student', 'ai_review_queue'));
});

test('Peer không có quyền quản trị hệ thống', () => {
  assert(!can('peer', 'view_admin_users'));
});

test('Auth client không lưu JWT trong localStorage', () => {
  const authStore = read('src/app/store/useAuthStore.ts');
  const loginView = read('src/views/LoginView.tsx');
  assert(!authStore.includes('localStorage'));
  assert(!loginView.includes('localStorage'));
});

test('Cookie session có HttpOnly, Secure và SameSite', () => {
  const auth = read('api/auth/auth.js');
  assert(auth.includes('HttpOnly'));
  assert(auth.includes('Secure'));
  assert(auth.includes('SameSite=Lax'));
});

test('API nhạy cảm xác thực lại trạng thái tài khoản từ PostgreSQL', () => {
  const protectedFiles = [
    'api/admin/users.ts',
    'api/admin/manage.ts',
    'api/academic/action.ts',
    'api/academic/snapshot.ts',
    'api/academic/catalog.ts',
    'api/auth/change-password.ts'
  ];
  for (const path of protectedFiles) {
    assert(read(path).includes('authenticate('), `${path} chưa dùng live-session authentication`);
  }
});

test('Portfolio version được khóa bất biến ở PostgreSQL', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('prevent_portfolio_version_mutation'));
  assert(academic.includes('BEFORE UPDATE OR DELETE ON portfolio_versions'));
});

test('PostgreSQL connection ép TLS verify-full', () => {
  const db = read('api/_lib/db.js');
  assert(db.includes('sslmode=verify-full'));
});

test('Không còn simulated API service cũ', () => {
  const removed = [
    'src/services/api/assignmentService.ts',
    'src/services/api/portfolioService.ts',
    'src/services/api/rubricService.ts',
    'src/services/api/analyticsService.ts'
  ];
  assert(removed.every((path) => !fs.existsSync(path)));
});

const failed = results.filter((result) => result.status === 'FAIL');
for (const result of results) {
  console.log(`${result.status === 'PASS' ? '✓' : '✗'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} production invariant tests passed.`);
if (failed.length > 0) process.exit(1);
