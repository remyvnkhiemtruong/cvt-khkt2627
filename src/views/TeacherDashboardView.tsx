import React from 'react';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Badge, Button, PageHeader, StatCard } from '../components/ui';
import { usePortfolio } from '../contexts/PortfolioContext';

interface Props { onNavigate: (view: string, params?: any) => void; }

type QueueTone = 'slate' | 'blue' | 'primary' | 'emerald' | 'amber' | 'rose' | 'purple' | 'outline';

const statusMeta = (status: string): { label: string; tone: QueueTone; priority: number } => {
  if (status === 'ai_proposed_waiting_teacher' || status === 'teacher_feedback_needed') return { label: 'Cần giáo viên xem', tone: 'amber', priority: 1 };
  if (status === 'waiting_official_rubric') return { label: 'Chờ Rubric', tone: 'purple', priority: 2 };
  if (status === 'submitted_waiting_ai' || status === 'v1_submitted') return { label: 'Chờ AI', tone: 'blue', priority: 3 };
  if (status === 'feedback_received' || status === 'revising' || status === 'v2_in_revision') return { label: 'Học sinh đang sửa', tone: 'primary', priority: 4 };
  if (status === 'completed') return { label: 'Hoàn thành', tone: 'emerald', priority: 9 };
  return { label: 'Đang soạn', tone: 'slate', priority: 6 };
};

export const TeacherDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const { assignments, portfolios, aiReviews, rubricSubmissions } = usePortfolio();
  const list = Object.values(portfolios);
  const submitted = list.filter(p => p.versions.some(version => version.stage !== 'prediction'));
  const aiPending = aiReviews.filter(r => r.status === 'completed' && r.teacher_review_status === 'pending').length;
  const rubricPending = submitted.filter(p => p.status === 'waiting_official_rubric' && !rubricSubmissions.some(r => r.studentId === p.studentId && r.assignmentId === p.assignmentId && r.evaluatorRole === 'teacher')).length;
  const revising = submitted.filter(p => p.status === 'feedback_received' || p.status === 'revising' || p.status === 'v2_in_revision').length;
  const done = submitted.filter(p => p.status === 'completed').length;
  const teacherPending = submitted.filter(p => p.status === 'ai_proposed_waiting_teacher' || p.status === 'teacher_feedback_needed').length;
  const actionCount = aiPending + rubricPending + teacherPending;

  const assignmentById = new Map(assignments.map(item => [item.id, item]));
  const queue = submitted
    .filter(portfolio => portfolio.status !== 'completed')
    .map(portfolio => ({ portfolio, meta: statusMeta(portfolio.status), assignment: assignmentById.get(portfolio.assignmentId) }))
    .sort((a, b) => a.meta.priority - b.meta.priority || a.portfolio.studentName.localeCompare(b.portfolio.studentName, 'vi'))
    .slice(0, 10);

  return (
    <div className="v3-page space-y-6 pb-20">
      <PageHeader
        eyebrow="Không gian giảng dạy"
        title="Hàng đợi giáo viên"
        description={`${actionCount} việc cần xử lý · ${submitted.length} hồ sơ V1/V2 đã nộp. V0 vẫn được giữ làm mốc dự đoán nhưng không tính như bài nộp chính thức.`}
        actions={<Button variant="primary" onClick={() => onNavigate('assignment-builder')}>Tạo nhiệm vụ</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Cần giáo viên xem" value={teacherPending} subValue="AI/feedback đang chờ" variant={teacherPending ? 'warning' : 'success'} icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} onClick={() => onNavigate('teacher-review')} />
        <StatCard label="AI chờ duyệt" value={aiPending} subValue="Response đã hoàn tất" variant={aiPending ? 'info' : 'default'} icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} onClick={() => onNavigate('ai-workspace')} />
        <StatCard label="Chờ Rubric" value={rubricPending} subValue="Cần chấm chính thức" variant={rubricPending ? 'warning' : 'default'} icon={<AcademicCapIcon className="h-5 w-5" />} onClick={() => onNavigate('rubric-management')} />
        <StatCard label="HS đang sửa" value={revising} subValue="Sau phản hồi" icon={<PencilSquareIcon className="h-5 w-5" />} onClick={() => onNavigate('portfolio-list')} />
        <StatCard label="Hoàn thành" value={done} subValue="Workflow đã đóng" variant="success" icon={<CheckCircleIcon className="h-5 w-5" />} onClick={() => onNavigate('portfolio-list')} />
      </div>

      <section className="v3-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-slate-950">Ưu tiên xử lý</h2>
            <p className="mt-0.5 text-xs text-slate-500">Sắp xếp theo bước workflow cần giáo viên can thiệp trước.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onNavigate('portfolio-list')}>Mở toàn bộ hồ sơ</Button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Học sinh</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Nhiệm vụ</th>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map(({ portfolio, meta, assignment }) => {
                const latest = [...portfolio.versions].reverse().find(version => version.stage !== 'prediction');
                return (
                  <tr key={portfolio.id} className="v3-table-row">
                    <td className="px-5 py-3.5"><div className="font-semibold text-slate-900">{portfolio.studentName}</div></td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{portfolio.className || '—'}</td>
                    <td className="max-w-[300px] px-4 py-3.5"><div className="truncate text-sm text-slate-700">{assignment?.title || portfolio.assignmentId}</div></td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{latest?.versionNumber || portfolio.currentActiveVersion || '—'}</td>
                    <td className="px-4 py-3.5"><Badge variant={meta.tone}>{meta.label}</Badge></td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="ghost" rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />} onClick={() => onNavigate('teacher-review', { studentId: portfolio.studentId, assignmentId: portfolio.assignmentId })}>Mở</Button>
                    </td>
                  </tr>
                );
              })}
              {!queue.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Không có bài nào đang chờ xử lý.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {queue.map(({ portfolio, meta, assignment }) => {
            const latest = [...portfolio.versions].reverse().find(version => version.stage !== 'prediction');
            return (
              <button
                type="button"
                key={portfolio.id}
                onClick={() => onNavigate('teacher-review', { studentId: portfolio.studentId, assignmentId: portfolio.assignmentId })}
                className="block w-full px-4 py-4 text-left hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{portfolio.studentName}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{portfolio.className || '—'} · {assignment?.title || portfolio.assignmentId}</div>
                  </div>
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-600">{latest?.versionNumber || portfolio.currentActiveVersion || 'Chưa có phiên bản'}</div>
              </button>
            );
          })}
          {!queue.length && <div className="px-4 py-10 text-center text-sm text-slate-500">Không có bài nào đang chờ xử lý.</div>}
        </div>
      </section>

      <section className="v3-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{assignments.length} nhiệm vụ đang quản lý</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">Tạo nhiệm vụ, quản lý ngữ liệu và Rubric từ nhóm “Giảng dạy” ở thanh bên.</div>
        </div>
        <Button variant="outline" onClick={() => onNavigate('class-analytics')}>Xem phân tích lớp</Button>
      </section>
    </div>
  );
};
