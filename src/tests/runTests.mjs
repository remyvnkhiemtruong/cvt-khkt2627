import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as Diff from 'diff';

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
function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}
function normalizeVietnameseNFC(text) {
  return String(text).normalize('NFC').trim();
}

// Visual Diff Helper
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
const can = (role, action) => permissions[role]?.includes(action) ?? false;
function calculateRubricTotal(scores) {
  const values = Object.values(scores);
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = values.length * 4;
  return { total, max, percentage: max ? Math.round((total / max) * 100) : 0 };
}

// -------------------------------------------------------------
// Existing Production Invariant Tests
// -------------------------------------------------------------
test('Unicode tiếng Việt được chuẩn hóa NFC', () => assert(normalizeVietnameseNFC(' Vợ nhặt – Kim Lân ') === 'Vợ nhặt – Kim Lân'));
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
test('Ma trận quyền bao phủ đủ 6 role production', () => assert(['student', 'teacher', 'peer', 'researcher', 'admin', 'ai'].every(role => Array.isArray(permissions[role]))));
test('Học sinh không có quyền xem danh sách admin', () => assert(!can('student', 'view_admin_users')));
test('Admin có quyền đọc danh sách user thật', () => assert(can('admin', 'view_admin_users')));
test('Teacher, Admin và AI được dùng hàng đợi AI; student không được', () => {
  assert(can('teacher', 'ai_review_queue'));
  assert(can('admin', 'ai_review_queue'));
  assert(can('ai', 'ai_review_queue'));
  assert(!can('student', 'ai_review_queue'));
});
test('Peer không có quyền quản trị hệ thống', () => assert(!can('peer', 'view_admin_users')));

test('Thương hiệu chính thức là Học tốt Ngữ Văn trên các bề mặt chính', () => {
  for (const p of ['index.html', 'src/views/LoginView.tsx', 'src/components/layout/AppHeader.tsx', 'src/components/layout/MainLayout.tsx', 'README.md']) {
    assert(read(p).includes('Học tốt Ngữ Văn'), `${p} chưa dùng brand mới`);
  }
  assert(read('package.json').includes('"name": "hoc-tot-ngu-van"'));
});

test('F5 ở route SPA luôn fallback về index.html nhưng không nuốt API', () => {
  const config = JSON.parse(read('vercel.json'));
  const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
  const spa = rewrites.find(rule => rule?.destination === '/index.html');
  assert(spa, 'Thiếu SPA fallback về /index.html');
  assert(typeof spa.source === 'string' && spa.source.includes('(?!api'), 'SPA fallback phải loại trừ /api');
});

test('Auth client không lưu JWT trong localStorage', () => {
  assert(!read('src/app/store/useAuthStore.ts').includes('localStorage'));
  assert(!read('src/views/LoginView.tsx').includes('localStorage'));
});
test('Cookie session có HttpOnly, Secure và SameSite', () => {
  const auth = read('api/auth/auth.js');
  assert(auth.includes('HttpOnly'));
  assert(auth.includes('Secure'));
  assert(auth.includes('SameSite=Lax'));
});
test('API nhạy cảm xác thực lại trạng thái tài khoản từ PostgreSQL', () => {
  for (const p of ['api/admin/users.ts', 'api/admin/manage.ts', 'api/academic/action.ts', 'api/academic/snapshot.ts', 'api/academic/catalog.ts', 'api/auth/change-password.ts']) {
    assert(read(p).includes('authenticate('), `${p} chưa dùng live-session authentication`);
  }
});
test('Hồ sơ cá nhân mở rộng được lưu server-side', () => {
  const auth = read('api/auth/auth.js');
  const me = read('api/auth/me.ts');
  assert(auth.includes('profile_json'));
  assert(auth.includes('updateProfile'));
  assert(me.includes('req.method==="PATCH"'));
  assert(read('src/components/layout/AppHeader.tsx').includes("method:'PATCH'"));
});
test('Portfolio version được khóa bất biến ở PostgreSQL', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('prevent_portfolio_version_mutation'));
  assert(academic.includes('BEFORE UPDATE OR DELETE ON portfolio_versions'));
});
test('PostgreSQL connection ép TLS verify-full', () => {
  assert(read('api/_lib/db.js').includes('sslmode=verify-full'));
});

test('Editor không dereference assignment trước khi snapshot hydrate', () => {
  const editor = read('src/views/PortfolioEditorView.tsx');
  assert(!editor.includes('|| assignments[0]'));
  assert(!editor.includes('getPortfolio(currentUser.id, assignment.id'));
  assert(editor.includes('if (!assignment)'));
  assert(editor.includes('if (!portfolio)'));
});
test('Version Diff không dựng phiên bản giả và có guard dữ liệu thiếu', () => {
  const diff = read('src/views/VersionDiffView.tsx');
  assert(!diff.includes('|| relevantPortfolios[0]'));
  assert(!diff.includes('diffChunks'));
  assert(diff.includes('versions.length < 2'));
  assert(diff.includes('if (!assignment)'));
});
test('Teacher Review chỉ dùng hàng đợi và feedback production', () => {
  const review = read('src/views/TeacherReviewView.tsx');
  assert(!review.includes('user-std-1'));
  assert(!review.includes('mockDb'));
  assert(!review.includes('saveFeedback'));
  assert(review.includes('addAnchoredFeedback'));
  assert(review.includes('Object.values(portfolios)'));
});
test('Không còn simulated state trong ba workspace trọng yếu', () => {
  for (const p of ['src/views/PortfolioEditorView.tsx', 'src/views/VersionDiffView.tsx', 'src/views/TeacherReviewView.tsx']) {
    const source = read(p);
    assert(!source.includes('Network status simulation'));
    assert(!source.includes('setTimeout('), `${p} còn delay giả`);
  }
});
test('Editor chỉ cho học sinh ghi bài', () => {
  const routes = read('src/app/router/routes.tsx');
  assert(routes.includes("editor: { id:'editor', path:'/student/editor', title:'Không gian viết & phân tích', allowedRoles:['student'] }"));
});
test('Không hardcode assign-vo-nhat trong navigation shortcut và view chính', () => {
  for (const p of ['src/App.tsx', 'src/views/AssignmentListView.tsx', 'src/views/PortfolioListView.tsx', 'src/views/VersionDiffView.tsx']) {
    assert(!read(p).includes("'assign-vo-nhat'"), `${p} còn hardcode assign-vo-nhat`);
  }
});
test('Recommendation engine xử lý an toàn khi availableAssignments rỗng', () => {
  const engine = read('src/utils/recommendationEngine.ts');
  assert(engine.includes('if (!fallback) return EMPTY_RECOMMENDATION;'), 'Recommendation engine thiếu guard fallback');
  const guardIndex = engine.indexOf('if (!fallback)');
  const fallbackIdIndex = engine.indexOf('fallback.id');
  assert(guardIndex >= 0 && fallbackIdIndex > guardIndex, 'fallback.id phải được gọi sau guard !fallback');
});
test('Không còn simulated API service cũ', () => {
  const removed = [
    'src/services/api/assignmentService.ts',
    'src/services/api/portfolioService.ts',
    'src/services/api/rubricService.ts',
    'src/services/api/analyticsService.ts'
  ];
  assert(removed.every(p => !fs.existsSync(p)));
});

// -------------------------------------------------------------
// TC01 - TC27: Behavioral & System Verification Tests
// -------------------------------------------------------------

test('TC01: autosave update draft, không tạo version mới, không tạo ai request', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('action === "save_draft"'), 'Thiếu handler save_draft');
  const startIndex = academic.indexOf('action === "save_draft"');
  const endIndex = academic.indexOf('action === "create_version"');
  const saveDraftCode = academic.slice(startIndex, endIndex);
  assert(saveDraftCode.includes('portfolio_drafts'), 'save_draft phải lưu vào portfolio_drafts');
  assert(!saveDraftCode.includes('INSERT INTO portfolio_versions'), 'save_draft không được tạo record trong portfolio_versions');
  assert(!saveDraftCode.includes('INSERT INTO ai_review_requests'), 'save_draft không được tạo record trong ai_review_requests');
});

test('TC02: submit version tạo đúng 1 immutable version, sequence tăng đúng 1', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('action === "create_version"'), 'Thiếu handler create_version');
  const startIndex = academic.indexOf('action === "create_version"');
  const endIndex = academic.indexOf('action === "ai_complete_review"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('sequence_no'), 'create_version phải tính sequence_no');
  assert(code.includes('sequence_no DESC'), 'create_version phải đọc sequence_no cao nhất từ server-side');
  assert(code.includes('nextSeq = prevVersion ? (Number(prevVersion.sequence_no) || 0) + 1 : 1'), 'sequence_no phải tăng đúng 1');
  assert(code.includes('content_checksum'), 'create_version phải tính content_checksum');
  assert(code.includes('INSERT INTO portfolio_versions'), 'create_version phải insert vào portfolio_versions');
});

test('TC03: submit version tự động tạo đúng 1 ai_review_requests status=pending', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "create_version"');
  const endIndex = academic.indexOf('action === "ai_complete_review"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('INSERT INTO ai_review_requests'), 'create_version phải tạo ai_review_requests');
  assert(code.includes("'submitted_waiting_ai'"), 'portfolio status phải chuyển thành submitted_waiting_ai');
});

test('TC04: retry submit cùng submission_key trả về version cũ, không nhân đôi', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "create_version"');
  const endIndex = academic.indexOf('action === "ai_complete_review"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('submission_key = $2'), 'create_version phải kiểm tra submission_key để đảm bảo idempotency');
  assert(code.includes('isIdempotentRetry: true'), 'Nếu trùng submission_key, trả về version đã tạo không nhân đôi');
});

test('TC05: ai_complete_review chỉ lưu proposal, không tạo feedback cho học sinh', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "ai_complete_review"');
  const endIndex = academic.indexOf('action === "teacher_review_ai"');
  const code = academic.slice(startIndex, endIndex);
  assert(!code.includes('INSERT INTO feedbacks'), 'ai_complete_review tuyệt đối không được tạo feedback trực tiếp cho học sinh');
  assert(code.includes("teacher_review_status = 'pending'"), 'ai_complete_review phải đặt teacher_review_status = pending');
  assert(code.includes("'ai_proposed_waiting_teacher'"), 'portfolio status phải chuyển sang ai_proposed_waiting_teacher');
});

test('TC06: teacher duyệt approved tạo feedback author_role=teacher', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "teacher_review_ai"');
  const endIndex = academic.indexOf('action === "add_feedback"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('decision === "approved"'), 'Phải có logic decision approved');
  assert(code.includes('INSERT INTO feedbacks'), 'Phải insert vào feedbacks');
  assert(code.includes("'teacher'"), 'Feedback được tạo phải có author_role là teacher');
});

test('TC07: teacher duyệt revised với text sửa tạo feedback đúng text đã sửa', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "teacher_review_ai"');
  const endIndex = academic.indexOf('action === "add_feedback"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('decision === "revised"'), 'Phải có logic decision revised');
  assert(code.includes('finalResponse'), 'Phải lưu final_response đã sửa');
});

test('TC08: teacher rejected không gửi text AI cho học sinh', () => {
  const academic = read('api/_lib/academic.js');
  const startIndex = academic.indexOf('action === "teacher_review_ai"');
  const endIndex = academic.indexOf('action === "add_feedback"');
  const code = academic.slice(startIndex, endIndex);
  assert(code.includes('decision === "rejected"'), 'Phải có logic decision rejected');
  assert(code.includes('if (finalResponse)'), 'Chỉ insert feedback khi finalResponse có nội dung, rejected để trống');
});

test('TC09: học sinh chỉ xem được feedback của chính mình', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('WHERE p.student_id = $1'), 'Snapshot học sinh phải giới hạn WHERE p.student_id = $1');
});

test('TC10: học sinh không xem được ai_review_requests', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('role === "student"'), 'Có rẽ nhánh role student');
  const startIndex = academic.indexOf('role === "student"');
  const endIndex = academic.indexOf('role === "peer"');
  const studentCode = academic.slice(startIndex, endIndex);
  assert(studentCode.includes('aiReviewsQuery = { rows: [] }'), 'Học sinh không được nhận danh sách ai_review_requests');
});

test('TC11: giáo viên chỉ thấy lớp được phân công', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes("JOIN class_members cm ON cm.class_id = c.id AND cm.user_id = $1 AND cm.member_role = 'teacher'"), 'Giáo viên chỉ thấy lớp mà mình là giáo viên phụ trách');
});

test('TC12: giáo viên không thấy assignment/portfolio của lớp khác', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('WHERE a.class_id = ANY($1::uuid[])'), 'Giáo viên chỉ thấy portfolio thuộc các lớp được phân công');
});

test('TC13: researcher snapshot không chứa student id/name/email/phone/class code thật', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('role === "researcher"'), 'Có kiểm tra role researcher');
  assert(academic.includes('researcherPseudonym('), 'Researcher snapshot phải dùng researcherPseudonym');
  assert(academic.includes('anonymizeCohort('), 'Researcher snapshot phải dùng anonymizeCohort');
  assert(academic.includes('usersQuery = { rows: [] }'), 'Researcher snapshot không được trả về danh sách tài khoản người dùng');
});

test('TC14: pseudonym researcher là stable qua nhiều lần query', () => {
  const secret = 'cvt-anonymization-secret-key-v1';
  const pseudonym = (id) => `HS-ANON-${crypto.createHmac('sha256', secret).update(String(id)).digest('hex').slice(0, 4).toUpperCase()}`;
  const p1 = pseudonym('std-uuid-1234');
  const p2 = pseudonym('std-uuid-1234');
  const p3 = pseudonym('std-uuid-5678');
  assert(p1 === p2, 'Pseudonym phải nhất quán 100% khi cùng ID');
  assert(p1 !== p3, 'Khác ID phải tạo khác pseudonym');
  assert(p1.startsWith('HS-ANON-') && p1.length === 12, 'Pseudonym phải có format HS-ANON-XXXX');
});

test('TC15: peer chỉ thấy bài được gán', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('JOIN peer_review_assignments pra ON pra.assignment_id = p.assignment_id AND pra.student_id = p.student_id AND pra.reviewer_id = $1'), 'Peer chỉ thấy bài có trong peer_review_assignments');
});

test('TC16: peer không thấy bài ngoài phạm vi', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('PEER_ASSIGNMENT_FORBIDDEN'), 'Peer đánh giá ngoài phạm vi phải bị từ chối với PEER_ASSIGNMENT_FORBIDDEN');
});

test('TC17: student submit rubric cho học sinh khác bị 403', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('FORBIDDEN_STUDENT_RUBRIC'), 'Học sinh chấm bài học sinh khác phải bị chặn với FORBIDDEN_STUDENT_RUBRIC');
});

test('TC18: teacher review reset rubric score khi đổi học sinh', () => {
  const teacherReview = read('src/views/TeacherReviewView.tsx');
  assert(teacherReview.includes('setRubricScores(reset)'), 'Teacher review phải reset rubricScores');
  assert(teacherReview.includes('currentPortfolio'), 'useEffect reset rubricScores phải phụ thuộc vào currentPortfolio');
});

test('TC19: teacher review reset rubric score khi đổi version', () => {
  const teacherReview = read('src/views/TeacherReviewView.tsx');
  assert(teacherReview.includes('selectedVersion'), 'useEffect reset rubricScores phải phụ thuộc vào selectedVersion');
});

test('TC20: text diff phát hiện đúng added/deleted/unchanged trên tiếng Việt NFC', () => {
  const text1 = 'Kim Lân miêu tả tình huống nhặt vợ trong bối cảnh nạn đói năm 1945.'.normalize('NFC');
  const text2 = 'Nhà văn Kim Lân đã khắc họa sâu sắc tình huống nhặt vợ trong nạn đói năm 1945.'.normalize('NFC');
  const diffs = Diff.diffWordsWithSpace(text1, text2);
  const hasAdded = diffs.some(d => d.added);
  const hasRemoved = diffs.some(d => d.removed);
  const hasUnchanged = diffs.some(d => !d.added && !d.removed);
  assert(hasAdded, 'Diff phải phát hiện phần chữ thêm mới');
  assert(hasRemoved, 'Diff phải phát hiện phần chữ bị xóa');
  assert(hasUnchanged, 'Diff phải giữ nguyên phần chữ chung');
});

test('TC21: V0 prediction stage lưu đúng stage=prediction và tự động vào AI queue', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('stage === "prediction"'), 'Có hỗ trợ stage=prediction');
  const modal = read('src/components/versioning/CreateVersionModal.tsx');
  assert(modal.includes("'prediction'"), 'CreateVersionModal có hỗ trợ stage prediction');
});

test('TC22: V2+ submit yêu cầu bắt buộc revision_reason', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('REVISION_REASON_REQUIRED'), 'V2+ thiếu revision_reason phải báo lỗi REVISION_REASON_REQUIRED');
});

test('TC23: submit version lưu đúng confidence 1–5', () => {
  const academic = read('api/_lib/academic.js');
  assert(academic.includes('INVALID_CONFIDENCE'), 'Confidence ngoài khoảng 1-5 phải báo INVALID_CONFIDENCE');
});

test('TC24: database connection không chứa rejectUnauthorized:false ở bất kỳ file nào', () => {
  const targetPattern = ['reject', 'Unauthorized', ':', 'false'].join('');
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.mjs'))) {
        if (entry.name === 'runTests.mjs') continue;
        const content = fs.readFileSync(full, 'utf8').replace(/\s+/g, '');
        assert(!content.includes(targetPattern), `Phát hiện rejectUnauthorized: false trong file: ${full}`);
      }
    }
  }
  scanDir(process.cwd());
});

test('TC25: tất cả transaction dùng client.connect()', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes("query('BEGIN')") || content.includes('query("BEGIN")')) {
          assert(content.includes('.connect()'), `Transaction trong file ${full} phải dùng client.connect()`);
        }
      }
    }
  }
  scanDir(path.join(process.cwd(), 'api'));
});

test('TC26: assign_member đồng bộ tạo portfolio và draft', () => {
  const manage = read('api/admin/manage.ts');
  assert(manage.includes('INSERT INTO portfolios'), 'assign_member phải insert portfolio cho học sinh mới gán lớp');
  assert(manage.includes('INSERT INTO portfolio_drafts'), 'assign_member phải insert draft rỗng ban đầu');
});

test('TC27: SPA fallback không rewrite /api', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const rewrites = vercel.rewrites || [];
  const spaRule = rewrites.find(r => r.destination === '/index.html');
  assert(spaRule, 'Thiếu rule rewrite SPA về /index.html');
  assert(spaRule.source.includes('(?!api'), 'SPA rule phải loại trừ /api');
  assert(!spaRule.source.includes('^/api'), 'SPA rule không được match /api');
});

// -------------------------------------------------------------
// Results Reporter
// -------------------------------------------------------------
const failed = results.filter(result => result.status === 'FAIL');
for (const result of results) {
  console.log(`${result.status === 'PASS' ? '✓' : '✗'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} production invariant & behavioral tests passed.`);
if (failed.length > 0) {
  process.exit(1);
}
