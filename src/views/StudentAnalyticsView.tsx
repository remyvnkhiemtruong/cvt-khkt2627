import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface StudentAnalyticsViewProps {
  studentId: string;
  assignmentId: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const labels: Record<PoeticAxisId, string> = {
  plot_situation: 'Tình huống – Cốt truyện',
  character_detail: 'Nhân vật – Chi tiết',
  narrator_pov: 'Người kể – Điểm nhìn',
  space_time: 'Không gian – Thời gian',
  language_tone_symbol: 'Ngôn ngữ – Giọng điệu',
  form_argument: 'Tổng hợp & Lập luận'
};

export const StudentAnalyticsView: React.FC<StudentAnalyticsViewProps> = ({
  studentId,
  assignmentId,
  onNavigate
}) => {
  const { portfolios, feedbacks, rubricSubmissions, rubric, assignments } = usePortfolio();
  const portfolio = portfolios[`port-${studentId}-${assignmentId}`];
  const studentFeedback = feedbacks.filter(f => f.studentId === studentId && f.assignmentId === assignmentId);

  // OFFICIAL TRAJECTORY: Strictly teacher submissions only
  const officialSubmissions = useMemo(
    () =>
      rubricSubmissions
        .filter(s => s.studentId === studentId && s.assignmentId === assignmentId && s.evaluatorRole === 'teacher')
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()),
    [rubricSubmissions, studentId, assignmentId]
  );

  const peerSubmissions = useMemo(
    () =>
      rubricSubmissions.filter(
        s => s.studentId === studentId && s.assignmentId === assignmentId && s.evaluatorRole === 'peer'
      ),
    [rubricSubmissions, studentId, assignmentId]
  );

  const axisByCriterion = useMemo(
    () => Object.fromEntries(rubric.criteria.map(c => [c.id, c.axisId])),
    [rubric]
  );

  const trajectory = useMemo(
    () =>
      officialSubmissions.map(s => {
        const axes: Partial<Record<PoeticAxisId, number>> = {};
        Object.entries(s.criterionScores).forEach(([id, v]) => {
          const axis = axisByCriterion[id] as PoeticAxisId | undefined;
          if (axis) axes[axis] = Number(v.score || v.level || 0);
        });
        return { sub: s, axes };
      }),
    [officialSubmissions, axisByCriterion]
  );

  const latest = trajectory.at(-1);
  const first = trajectory[0];
  const hasMultipleAssessments = trajectory.length >= 2;

  const axisRows = (Object.keys(labels) as PoeticAxisId[]).map(axis => {
    const firstScore = first?.axes[axis] || 0;
    const lastScore = latest?.axes[axis] || 0;
    const delta = hasMultipleAssessments ? lastScore - firstScore : 0;
    return {
      axis,
      first: firstScore,
      last: lastScore,
      delta
    };
  });

  const weakest = axisRows.filter(x => x.last > 0).sort((a, b) => a.last - b.last)[0];
  const resolved = studentFeedback.filter(f => f.resolved).length;

  if (!portfolio) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Chưa có hồ sơ học tập</h2>
        <p className="text-sm text-slate-500">Hồ sơ sẽ xuất hiện sau khi bạn bắt đầu nhiệm vụ.</p>
        <div className="pt-2">
          <Button size="sm" variant="primary" onClick={() => onNavigate('student-dashboard')}>
            Về danh sách nhiệm vụ
          </Button>
        </div>
      </div>
    );
  }

  const currentAssignmentTitle = assignments.find(a => a.id === assignmentId)?.title || assignmentId;

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
            <span>·</span>
            <span>{currentAssignmentTitle}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Tiến bộ học tập</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quỹ đạo phát triển năng lực qua các lần đánh giá của {portfolio.studentName}
          </p>
        </div>

        {portfolio.versions.length >= 2 && (
          <Button size="sm" variant="outline" onClick={() => onNavigate('version-diff', { assignmentId })}>
            So sánh phiên bản
          </Button>
        )}
      </div>

      {/* Summary Line (No StatCards!) */}
      <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><strong>{portfolio.versions.length}</strong> phiên bản bài nộp</span>
        <span className="text-slate-300">·</span>
        <span>
          <strong>{studentFeedback.length}</strong> phản hồi ({resolved} đã tiếp thu)
        </span>
        <span className="text-slate-300">·</span>
        <span>
          Điểm gần nhất: <strong>{latest ? `${latest.sub.totalScore}/${latest.sub.maxScore}` : 'Chưa có'}</strong>
        </span>
      </div>

      {/* Competency Trajectory Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Năng lực theo 6 trục thi pháp</h2>
          <span className="text-xs text-slate-500">
            {officialSubmissions.length > 0
              ? `${officialSubmissions.length} lần đánh giá chính thức`
              : 'Chưa có điểm'}
          </span>
        </div>

        {officialSubmissions.length === 0 ? (
          <div className="border border-slate-200 rounded-md p-6 text-center text-sm text-slate-500 bg-white">
            Chưa có đánh giá Rubric chính thức từ giáo viên cho bài tập này.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                <tr>
                  <th className="py-3 px-4">Trục thi pháp</th>
                  <th className="py-3 px-4 text-center">Bản đầu</th>
                  <th className="py-3 px-4 text-center">Gần nhất</th>
                  <th className="py-3 px-4 text-right">Thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {axisRows.map(r => (
                  <tr key={r.axis} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">{labels[r.axis]}</td>
                    <td className="py-3 px-4 text-center text-slate-600 text-xs">
                      {r.first ? `${r.first.toFixed(1)}/4` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-900 font-semibold text-xs">
                      {r.last ? `${r.last.toFixed(1)}/4` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs">
                      {hasMultipleAssessments && r.last > 0 ? (
                        <span className={r.delta > 0 ? 'text-emerald-700 font-medium' : r.delta < 0 ? 'text-rose-700' : 'text-slate-400'}>
                          {r.delta > 0 ? `+${r.delta.toFixed(1)}` : r.delta < 0 ? r.delta.toFixed(1) : '0.0'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {weakest && weakest.last > 0 && (
          <div className="border-l-2 border-slate-400 pl-3 py-2 bg-slate-50 rounded-r text-xs text-slate-700">
            <strong>Trọng tâm cần phát triển:</strong> Trục {labels[weakest.axis]} ({weakest.last.toFixed(1)}/4). Nên rà soát kĩ dẫn chứng và phản hồi trước khi nộp phiên bản tiếp theo.
          </div>
        )}

        {peerSubmissions.length > 0 && (
          <div className="text-xs text-slate-500">
            * Có {peerSubmissions.length} nhận xét đồng đẳng tham khảo (không tính vào quỹ đạo điểm chính thức).
          </div>
        )}
      </section>

      {/* Version & Feedback Timeline */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Lịch sử nộp bài & Nhận xét</h2>

        {portfolio.versions.length === 0 ? (
          <div className="border border-slate-200 rounded-md p-6 text-center text-sm text-slate-500 bg-white">
            Chưa có phiên bản nào được nộp.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md bg-white divide-y divide-slate-100 overflow-hidden">
            {portfolio.versions.map(v => {
              const linked = studentFeedback.filter(f => f.versionNumber === v.versionNumber);

              return (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{v.versionNumber}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">
                        {v.stage === 'prediction' ? 'Dự đoán trước đọc' : v.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      {new Date(v.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {v.changeSummary && (
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong>Nội dung đã sửa:</strong> {v.changeSummary}
                    </p>
                  )}

                  {v.revisionReason && (
                    <p className="text-xs text-slate-500 italic">
                      Lí do sửa: {v.revisionReason}
                    </p>
                  )}

                  {linked.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <span className="text-xs font-medium text-slate-700 block">Phản hồi đã nhận:</span>
                      {linked.map(f => (
                        <div key={f.id} className="border-l-2 border-slate-300 pl-2 text-xs text-slate-700 py-0.5">
                          <span className="font-medium">
                            {f.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học'}:
                          </span>{' '}
                          {f.comment}
                          {f.resolved && <span className="text-emerald-700 ml-1 font-medium">· Đã tiếp thu</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
