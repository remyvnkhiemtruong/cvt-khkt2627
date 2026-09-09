import React, { useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Button } from '../components/ui';

interface TeacherDashboardViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const user = useAuthStore(s => s.currentUser);
  const { assignments, portfolios, aiReviews, dataError } = usePortfolio();

  const portfolioList = useMemo(() => Object.values(portfolios), [portfolios]);
  const classes = useMemo(
    () => Array.from(new Set(portfolioList.map(p => p.className).filter(Boolean))),
    [portfolioList]
  );

  const submissionsNeedingGrade = useMemo(() => {
    return portfolioList.filter(p => p.status === 'submitted_waiting_ai' || p.status === 'revising' || p.versions.length > 0);
  }, [portfolioList]);

  const aiFeedbackAwaitingTeacherRead = useMemo(() => {
    return (aiReviews || []).filter(
      r => r.status === 'completed' && r.teacher_review_status === 'pending'
    );
  }, [aiReviews]);

  const assignmentProgress = useMemo(() => {
    return assignments.map(a => {
      const classPortfolios = portfolioList.filter(p => p.assignmentId === a.id);
      const submitted = classPortfolios.filter(p => p.versions.length > 0).length;
      const total = classPortfolios.length || 0;
      const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
      return { assignment: a, total, submitted, percent };
    });
  }, [assignments, portfolioList]);

  return (
    <div className="max-w-6xl space-y-8 pb-16">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Giảng dạy</h1>
          <p className="mt-0.5 text-sm text-slate-500">Công việc của {user.name}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={() => onNavigate('class-analytics')}>Phân tích lớp</Button>
          <Button size="sm" variant="primary" onClick={() => onNavigate('assignment-builder')}>Tạo nhiệm vụ</Button>
        </div>
      </div>

      {dataError && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">{dataError}</div>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700">
        <span><strong>{classes.length}</strong> lớp phụ trách</span>
        <span className="text-slate-300">·</span>
        <span><strong>{assignments.length}</strong> nhiệm vụ đang mở</span>
        <span className="text-slate-300">·</span>
        <span><strong>{submissionsNeedingGrade.length}</strong> bài đã nộp</span>
        <span className="text-slate-300">·</span>
        <span><strong>{aiFeedbackAwaitingTeacherRead.length}</strong> phản hồi AI chưa được giáo viên xem</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Hồ sơ nộp gần đây</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('portfolio-list')}>Xem tất cả</Button>
          </div>

          {submissionsNeedingGrade.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Hiện chưa có bài nộp nào cần xử lý.</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
              {submissionsNeedingGrade.slice(0, 8).map(p => {
                const latestVersion = p.versions.at(-1);
                const assignment = assignments.find(a => a.id === p.assignmentId);
                const hasUnreadAiFeedback = aiFeedbackAwaitingTeacherRead.some(r => r.student_id === p.studentId && r.assignment_id === p.assignmentId);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/70">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{p.studentName}</span>
                        <span className="text-xs text-slate-500">· Lớp {p.className}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-600">
                        {assignment?.title || 'Nhiệm vụ'}
                        {latestVersion && ` · ${latestVersion.versionNumber}`}
                        {hasUnreadAiFeedback && <span className="ml-2 font-medium text-amber-700">· Có phản hồi AI chưa xem</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onNavigate('teacher-review', { studentId: p.studentId, assignmentId: p.assignmentId })}>Chấm bài</Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Nhiệm vụ đang giao</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('class-analytics')}>Xem biểu đồ</Button>
          </div>
          {assignmentProgress.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Chưa có nhiệm vụ nào được giao.</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
              {assignmentProgress.map(item => (
                <div key={item.assignment.id} className="space-y-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-slate-900">{item.assignment.title}</div>
                    <span className="shrink-0 text-xs text-slate-600">{item.submitted}/{item.total} đã nộp</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-800" style={{ width: `${item.percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hạn: {item.assignment.deadline ? new Date(item.assignment.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                    <span>{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
