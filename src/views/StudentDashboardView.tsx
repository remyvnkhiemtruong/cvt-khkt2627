import React, { useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import { Button, EmptyState } from '../components/ui';
import { BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface StudentDashboardViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { autosaveStatus, lastSavedTime } = usePortfolioStore();
  const {
    assignments,
    literatureTexts,
    portfolios,
    feedbacks,
    rubricSubmissions,
    rubric,
    isLoading,
    dataError,
    refreshAcademicData
  } = usePortfolio();

  const myFeedbacks = useMemo(
    () => feedbacks.filter(item => item.studentId === currentUser.id),
    [feedbacks, currentUser.id]
  );
  const unresolvedFeedbacks = useMemo(
    () => myFeedbacks.filter(item => !item.resolved),
    [myFeedbacks]
  );
  const myRubrics = useMemo(
    () => rubricSubmissions.filter(item => item.studentId === currentUser.id),
    [rubricSubmissions, currentUser.id]
  );

  // Active assignment selection based on business priorities
  const activeAssignment = useMemo(() => {
    const revising = assignments.find(assignment => {
      const port = portfolios[`port-${currentUser.id}-${assignment.id}`];
      return port && (port.status === 'feedback_received' || port.status === 'revising' || port.status === 'v2_in_revision');
    });
    if (revising) return revising;

    const unfinished = assignments.find(assignment => {
      const port = portfolios[`port-${currentUser.id}-${assignment.id}`];
      return port && port.status !== 'completed' && !myRubrics.some(r => r.assignmentId === assignment.id && r.evaluatorRole === 'teacher');
    });
    if (unfinished) return unfinished;

    const unstarted = assignments.filter(a => !portfolios[`port-${currentUser.id}-${a.id}`]);
    if (unstarted.length > 0) {
      return [...unstarted].sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())[0];
    }

    return null;
  }, [assignments, portfolios, currentUser.id, myRubrics]);

  const activePortfolio = activeAssignment ? portfolios[`port-${currentUser.id}-${activeAssignment.id}`] : undefined;
  const activeText = activeAssignment ? literatureTexts.find(text => text.id === activeAssignment.textId) : undefined;
  const activeVersion = activePortfolio?.currentActiveVersion || 'v1.0 (nháp)';

  const completedAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const portfolio = portfolios[`port-${currentUser.id}-${assignment.id}`];
      if (portfolio?.status === 'completed') return true;
      return myRubrics.some(sub => sub.assignmentId === assignment.id && sub.evaluatorRole === 'teacher');
    }).length;
  }, [assignments, portfolios, currentUser.id, myRubrics]);

  const latestTeacherRubric = useMemo(() => {
    return [...myRubrics]
      .filter(item => item.evaluatorRole === 'teacher')
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .at(-1);
  }, [myRubrics]);

  const axisScores = useMemo(() => {
    const byCriterion = Object.fromEntries((rubric.criteria || []).map(criterion => [criterion.id, criterion.axisId]));
    const scores: Record<string, number> = {};
    if (latestTeacherRubric) {
      for (const [criterionId, value] of Object.entries(latestTeacherRubric.criterionScores || {})) {
        const axis = byCriterion[criterionId];
        if (axis) scores[axis] = Number(value.score || value.level || 0);
      }
    }
    return POETIC_AXES.map(axis => ({ axis, score: scores[axis.id] || 0 }));
  }, [latestTeacherRubric, rubric]);

  const weakestAxis = axisScores.filter(item => item.score > 0).sort((a, b) => a.score - b.score)[0];

  if (isLoading && assignments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Đang tải dữ liệu bàn học...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<BookOpenIcon className="h-8 w-8 text-slate-400" />}
          title="Chưa có nhiệm vụ"
          description={dataError || 'Bạn chưa có nhiệm vụ nào được phân công.'}
          action={
            <Button variant="outline" onClick={() => void refreshAcademicData()}>
              Tải lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {dataError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          Dữ liệu hiển thị có thể chưa mới nhất: {dataError}
        </div>
      )}

      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bàn học</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentUser.name}
            {currentUser.className && ` · Lớp ${currentUser.className}`}
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {assignments.length} nhiệm vụ · {completedAssignments} hoàn thành
          {unresolvedFeedbacks.length > 0 && ` · ${unresolvedFeedbacks.length} phản hồi cần xem`}
        </div>
      </div>

      {/* 2. Next Action Area (3-second rule) */}
      {activeAssignment ? (
        <section className="border border-slate-200 bg-white rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Bài cần làm tiếp</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600">{activeVersion}</span>
            </div>
            {activeAssignment.deadline && (
              <span className="text-xs text-slate-500">
                Hạn nộp: {new Date(activeAssignment.deadline).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">{activeAssignment.title}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {activeText ? `${activeText.title} — ${activeText.author}` : 'Ngữ liệu tác phẩm'}
            </p>
            {activeAssignment.prompt && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {activeAssignment.prompt}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {autosaveStatus === 'dirty'
                ? 'Có nội dung nháp chưa lưu'
                : autosaveStatus === 'saving'
                ? 'Đang lưu...'
                : `Đã lưu ${lastSavedTime || 'gần đây'}`}
            </div>
            <Button
              variant="primary"
              onClick={() => onNavigate('editor', { assignmentId: activeAssignment.id })}
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Tiếp tục viết bài
            </Button>
          </div>
        </section>
      ) : (
        <section className="border border-slate-200 bg-white rounded-md p-5 text-sm text-slate-600">
          Bạn đã hoàn thành tất cả nhiệm vụ hiện có.
        </section>
      )}

      {/* 3. Feedback needing resolution */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Phản hồi của giáo viên</h2>
          {myFeedbacks.length > 0 && (
            <span className="text-xs text-slate-500">
              {unresolvedFeedbacks.length} chưa xử lý / {myFeedbacks.length} tổng
            </span>
          )}
        </div>

        {unresolvedFeedbacks.length === 0 ? (
          <div className="text-sm text-slate-500 py-3 border-t border-slate-100">
            Không có phản hồi nào đang chờ xử lý.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border-t border-b border-slate-200 bg-white">
            {unresolvedFeedbacks.slice(0, 4).map(item => (
              <div key={item.id} className="py-3 px-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-slate-800">{item.authorName || 'Giáo viên'}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{item.comment}</p>
                </div>
                {activeAssignment && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate('editor', { assignmentId: activeAssignment.id })}
                  >
                    Xem bài
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Pedagogical focus callout (plain, calm, no StatCard) */}
      {weakestAxis && (
        <section className="border-l-2 border-slate-400 bg-slate-100/60 p-3.5 rounded-r-md text-sm text-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            Tiêu chí <strong>{weakestAxis.axis.title}</strong> đạt mức {weakestAxis.score.toFixed(1)}/4 trong lần chấm gần nhất.
          </div>
          {activeAssignment && (
            <button
              type="button"
              onClick={() => onNavigate('student-analytics', { studentId: currentUser.id, assignmentId: activeAssignment.id })}
              className="text-xs font-medium text-slate-900 underline underline-offset-2 shrink-0"
            >
              Xem tiến bộ chi tiết →
            </button>
          )}
        </section>
      )}

      {/* 5. Assigned list rows */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Danh sách nhiệm vụ</h2>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('assignment-list')}>
            Xem tất cả ({assignments.length})
          </Button>
        </div>

        <div className="divide-y divide-slate-100 border-t border-b border-slate-200 bg-white">
          {assignments.slice(0, 5).map(assignment => {
            const portfolio = portfolios[`port-${currentUser.id}-${assignment.id}`];
            const text = literatureTexts.find(t => t.id === assignment.textId);
            const statusText =
              portfolio?.status === 'completed' ? 'Đã hoàn thành' :
              portfolio?.status === 'feedback_received' ? 'Có phản hồi' :
              portfolio?.status === 'submitted_waiting_ai' ? 'Chờ phản hồi' :
              portfolio?.status === 'ai_proposed_waiting_teacher' ? 'Chờ duyệt' :
              portfolio?.status === 'drafting' ? 'Đang viết nháp' : 'Chưa bắt đầu';

            return (
              <div
                key={assignment.id}
                className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">{assignment.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {text ? `${text.title} — ${text.author}` : 'Ngữ liệu'}
                    {assignment.deadline && ` · Hạn ${new Date(assignment.deadline).toLocaleDateString('vi-VN')}`}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{statusText}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate('editor', { assignmentId: assignment.id })}
                  >
                    Mở
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
