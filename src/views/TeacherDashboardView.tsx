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

  // Submissions needing grading
  const submissionsNeedingGrade = useMemo(() => {
    return portfolioList.filter(p => p.status === 'submitted_waiting_ai' || p.status === 'revising' || p.versions.length > 0);
  }, [portfolioList]);

  // AI proposals pending teacher review
  const pendingAiProposals = useMemo(() => {
    return (aiReviews || []).filter(
      r => r.status === 'completed' && r.teacher_review_status === 'pending'
    );
  }, [aiReviews]);

  // Assignment submission progress
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
      {/* Header & Primary Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Giảng dạy</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng quan công việc của {user.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={() => onNavigate('class-analytics')}>
            Phân tích lớp
          </Button>
          <Button size="sm" variant="primary" onClick={() => onNavigate('assignment-builder')}>
            Tạo nhiệm vụ
          </Button>
        </div>
      </div>

      {dataError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          {dataError}
        </div>
      )}

      {/* Compact Summary Strip (No StatCards!) */}
      <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><strong>{classes.length}</strong> lớp phụ trách</span>
        <span className="text-slate-300">·</span>
        <span><strong>{assignments.length}</strong> nhiệm vụ đang mở</span>
        <span className="text-slate-300">·</span>
        <span><strong>{submissionsNeedingGrade.length}</strong> bài đã nộp</span>
        <span className="text-slate-300">·</span>
        <span>
          <strong>{pendingAiProposals.length}</strong> đề xuất AI chờ duyệt
        </span>
      </div>

      {/* Main Hierarchy: Cần xử lý & Tiến độ nộp bài */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Cần xử lý (Submissions and AI proposals) */}
        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Hồ sơ nộp gần đây</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('portfolio-list')}>
              Xem tất cả
            </Button>
          </div>

          {submissionsNeedingGrade.length === 0 ? (
            <div className="border border-slate-200 rounded-md p-6 text-center text-sm text-slate-500 bg-white">
              Hiện chưa có bài nộp nào cần xử lý.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-md bg-white divide-y divide-slate-100 overflow-hidden">
              {submissionsNeedingGrade.slice(0, 8).map(p => {
                const latestVersion = p.versions.at(-1);
                const assignment = assignments.find(a => a.id === p.assignmentId);
                const hasPendingAi = pendingAiProposals.some(r => r.student_id === p.studentId && r.assignment_id === p.assignmentId);

                return (
                  <div
                    key={p.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900">{p.studentName}</span>
                        <span className="text-xs text-slate-500">· Lớp {p.className}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 truncate">
                        {assignment?.title || 'Nhiệm vụ'}
                        {latestVersion && ` · ${latestVersion.versionNumber}`}
                        {hasPendingAi && (
                          <span className="ml-2 text-amber-700 font-medium">· Đề xuất AI chờ duyệt</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onNavigate('teacher-review', {
                            studentId: p.studentId,
                            assignmentId: p.assignmentId
                          })
                        }
                      >
                        Chấm bài
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Nhiệm vụ đang giao */}
        <section className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Nhiệm vụ đang giao</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('class-analytics')}>
              Xem biểu đồ
            </Button>
          </div>

          {assignmentProgress.length === 0 ? (
            <div className="border border-slate-200 rounded-md p-6 text-center text-sm text-slate-500 bg-white">
              Chưa có nhiệm vụ nào được giao.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-md bg-white divide-y divide-slate-100 overflow-hidden">
              {assignmentProgress.map(item => (
                <div key={item.assignment.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm text-slate-900 truncate">
                      {item.assignment.title}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {item.submitted}/{item.total} đã nộp
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percent}%` }}
                    />
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
