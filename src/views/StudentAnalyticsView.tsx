import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface StudentAnalyticsViewProps {
  studentId: string;
  assignmentId: string;
  onNavigate: (view: string, extraParams?: unknown) => void;
}

const labels: Record<PoeticAxisId, string> = {
  plot_situation: 'Tình huống – Cốt truyện',
  character_detail: 'Nhân vật – Chi tiết',
  narrator_pov: 'Người kể – Điểm nhìn',
  space_time: 'Không gian – Thời gian',
  language_tone_symbol: 'Ngôn ngữ – Giọng điệu',
  form_argument: 'Tổng hợp & Lập luận'
};

export const StudentAnalyticsView: React.FC<StudentAnalyticsViewProps> = ({ studentId, assignmentId, onNavigate }) => {
  const { portfolios, feedbacks, rubricSubmissions, rubrics, assignments } = usePortfolio();
  const portfolio = portfolios[`port-${studentId}-${assignmentId}`];
  const assignment = assignments.find(item => item.id === assignmentId);
  const activeRubric = assignment ? rubrics[assignment.rubricId] : undefined;
  const studentFeedback = feedbacks.filter(item => item.studentId === studentId && item.assignmentId === assignmentId);

  const officialSubmissions = useMemo(() => rubricSubmissions
    .filter(item => item.studentId === studentId && item.assignmentId === assignmentId && item.evaluatorRole === 'teacher')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()),
  [rubricSubmissions, studentId, assignmentId]);

  const peerSubmissions = useMemo(() => rubricSubmissions.filter(item =>
    item.studentId === studentId && item.assignmentId === assignmentId && item.evaluatorRole === 'peer'
  ), [rubricSubmissions, studentId, assignmentId]);

  const criterionMeta = useMemo(() => {
    if (!activeRubric) return {} as Record<string, { axisId: PoeticAxisId; max: number }>;
    return Object.fromEntries(activeRubric.criteria.map(criterion => {
      const max = criterion.levels.reduce((value, level) => Math.max(value, Number(level.score ?? level.level ?? 0)), 0);
      return [criterion.id, { axisId: criterion.axisId, max }];
    }));
  }, [activeRubric]);

  const trajectory = useMemo(() => officialSubmissions.map(submission => {
    const axes: Partial<Record<PoeticAxisId, number>> = {};
    Object.entries(submission.criterionScores).forEach(([criterionId, value]) => {
      const meta = criterionMeta[criterionId];
      if (!meta || meta.max <= 0) return;
      const score = Number(value.score ?? value.level ?? 0);
      if (Number.isFinite(score)) axes[meta.axisId] = Math.max(0, Math.min(100, (score / meta.max) * 100));
    });
    return { submission, axes };
  }), [officialSubmissions, criterionMeta]);

  const latest = trajectory.at(-1);
  const first = trajectory[0];
  const hasMultipleAssessments = trajectory.length >= 2;
  const axisRows = (Object.keys(labels) as PoeticAxisId[]).map(axis => {
    const firstScore = first?.axes[axis];
    const lastScore = latest?.axes[axis];
    return {
      axis,
      first: firstScore,
      last: lastScore,
      delta: hasMultipleAssessments && typeof firstScore === 'number' && typeof lastScore === 'number' ? lastScore - firstScore : null
    };
  });
  const weakest = axisRows.filter(row => typeof row.last === 'number').sort((a, b) => Number(a.last) - Number(b.last))[0];
  const resolved = studentFeedback.filter(item => item.resolved).length;

  if (!portfolio) return <div className="mx-auto mt-16 max-w-md space-y-3 p-6 text-center"><h2 className="text-base font-semibold text-slate-900">Chưa có hồ sơ học tập</h2><p className="text-sm text-slate-500">Hồ sơ sẽ xuất hiện sau khi bạn bắt đầu nhiệm vụ.</p><Button size="sm" variant="primary" onClick={() => onNavigate('student-dashboard')}>Về danh sách nhiệm vụ</Button></div>;
  if (!assignment) return <div className="mx-auto mt-16 max-w-md space-y-3 p-6 text-center"><h2 className="text-base font-semibold text-slate-900">Không tìm thấy nhiệm vụ</h2><p className="text-sm text-slate-500">Không thể tính analytics nếu thiếu nhiệm vụ gốc.</p></div>;
  if (!activeRubric) return <div className="mx-auto mt-16 max-w-md space-y-3 p-6 text-center"><h2 className="text-base font-semibold text-slate-900">Thiếu rubric của nhiệm vụ</h2><p className="text-sm text-slate-500">Hệ thống không dùng rubric khác để thay thế vì có thể làm sai điểm.</p></div>;

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div><div className="mb-1 flex items-center gap-2 text-sm text-slate-500"><Button size="sm" variant="ghost" onClick={() => onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button><span>·</span><span>{assignment.title}</span></div><h1 className="text-2xl font-semibold text-slate-900">Tiến bộ học tập</h1><p className="mt-0.5 text-sm text-slate-500">Quỹ đạo chỉ dùng các lần chấm rubric chính thức của giáo viên</p></div>
        {portfolio.versions.length >= 2 && <Button size="sm" variant="outline" onClick={() => onNavigate('version-diff', { assignmentId, studentId })}>So sánh phiên bản</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700"><span><strong>{portfolio.versions.length}</strong> phiên bản</span><span>·</span><span><strong>{studentFeedback.length}</strong> phản hồi ({resolved} đã xử lý)</span><span>·</span><span>Điểm gần nhất: <strong>{latest ? `${latest.submission.totalScore}/${latest.submission.maxScore}` : 'Chưa có'}</strong></span></div>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Tiến bộ theo tiêu chí</h2><span className="text-sm text-slate-500">{officialSubmissions.length ? `${officialSubmissions.length} lần chấm` : 'Chưa có điểm'}</span></div>
        {!officialSubmissions.length ? <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Chưa có đánh giá chính thức từ giáo viên.</div> : <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600"><tr><th className="px-4 py-3">Tiêu chí</th><th className="px-4 py-3 text-center">Lần đầu</th><th className="px-4 py-3 text-center">Gần nhất</th><th className="px-4 py-3 text-right">Thay đổi</th></tr></thead><tbody className="divide-y divide-slate-100">{axisRows.map(row => <tr key={row.axis}><td className="px-4 py-3 font-medium text-slate-900">{labels[row.axis]}</td><td className="px-4 py-3 text-center text-slate-600">{typeof row.first === 'number' ? `${row.first.toFixed(0)}%` : '—'}</td><td className="px-4 py-3 text-center font-semibold text-slate-900">{typeof row.last === 'number' ? `${row.last.toFixed(0)}%` : '—'}</td><td className="px-4 py-3 text-right">{typeof row.delta === 'number' ? <span className={row.delta > 0 ? 'font-medium text-emerald-700' : row.delta < 0 ? 'text-rose-700' : 'text-slate-400'}>{row.delta > 0 ? `+${row.delta.toFixed(0)}` : row.delta.toFixed(0)} điểm %</span> : '—'}</td></tr>)}</tbody></table></div>}
        {weakest && typeof weakest.last === 'number' && <div className="rounded-r border-l-2 border-slate-400 bg-slate-50 py-2 pl-3 text-sm text-slate-700"><strong>Cần chú ý:</strong> {labels[weakest.axis]} ({weakest.last.toFixed(0)}%).</div>}
        {peerSubmissions.length > 0 && <div className="text-sm text-slate-500">Có {peerSubmissions.length} đánh giá đồng đẳng tham khảo; không tính vào quỹ đạo điểm chính thức.</div>}
      </section>

      <section className="space-y-4"><h2 className="text-base font-semibold text-slate-900">Lịch sử phiên bản</h2>{!portfolio.versions.length ? <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Chưa có phiên bản nào.</div> : <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">{portfolio.versions.map(version => { const linked = studentFeedback.filter(item => item.versionId === version.id || item.versionNumber === version.versionNumber); return <div key={version.id} className="space-y-2 p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-900">{version.versionNumber} · {version.stage === 'prediction' ? 'Dự đoán' : version.stage === 'initial' ? 'Bản đầu' : 'Bản chỉnh sửa'}</span><span className="text-slate-400">{new Date(version.createdAt).toLocaleString('vi-VN')}</span></div>{version.changeSummary && <p className="text-sm text-slate-700"><strong>Đã sửa:</strong> {version.changeSummary}</p>}{version.revisionReason && <p className="text-sm italic text-slate-500">Lí do: {version.revisionReason}</p>}{linked.length > 0 && <div className="space-y-1 pt-1">{linked.map(item => <div key={item.id} className="border-l-2 border-slate-300 pl-2 text-sm text-slate-700"><strong>{item.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học'}:</strong> {item.comment}{item.resolved && <span className="ml-1 text-emerald-700">· Đã xử lý</span>}</div>)}</div>}</div>; })}</div>}</section>
    </div>
  );
};
