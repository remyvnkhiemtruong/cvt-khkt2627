import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps {
  onNavigate: (view: string, extraParams?: unknown) => void;
}

const axisLabels: Record<PoeticAxisId, string> = {
  plot_situation: 'Tình huống',
  character_detail: 'Nhân vật',
  narrator_pov: 'Điểm nhìn',
  space_time: 'Không gian',
  language_tone_symbol: 'Ngôn ngữ',
  form_argument: 'Lập luận'
};

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({ onNavigate }) => {
  const { portfolios, rubricSubmissions, rubrics, assignments } = usePortfolio();
  const list = useMemo(() => Object.values(portfolios), [portfolios]);
  const classes = useMemo(() => Array.from(new Set(list.map(item => item.className).filter(Boolean))).sort(), [list]);
  const [classFilter, setClassFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const filtered = useMemo(() => list.filter(portfolio => {
    if (classFilter !== 'all' && portfolio.className !== classFilter) return false;
    if (assignmentFilter !== 'all' && portfolio.assignmentId !== assignmentFilter) return false;
    return true;
  }), [list, classFilter, assignmentFilter]);

  const rows = useMemo(() => filtered.map(portfolio => {
    const assignment = assignments.find(item => item.id === portfolio.assignmentId);
    const assignmentRubric = assignment ? rubrics[assignment.rubricId] : undefined;
    const criterionMeta = assignmentRubric ? Object.fromEntries(assignmentRubric.criteria.map(criterion => {
      const max = criterion.levels.reduce((value, level) => Math.max(value, Number(level.score ?? level.level ?? 0)), 0);
      return [criterion.id, { axisId: criterion.axisId, max }];
    })) : {};
    const teacherSubmission = rubricSubmissions
      .filter(item => item.studentId === portfolio.studentId && item.assignmentId === portfolio.assignmentId && item.evaluatorRole === 'teacher')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    const scores: Partial<Record<PoeticAxisId, number>> = {};
    if (teacherSubmission && assignmentRubric) {
      Object.entries(teacherSubmission.criterionScores).forEach(([criterionId, value]) => {
        const meta = criterionMeta[criterionId] as { axisId: PoeticAxisId; max: number } | undefined;
        if (!meta || meta.max <= 0) return;
        const raw = Number(value.score ?? value.level ?? 0);
        if (Number.isFinite(raw)) scores[meta.axisId] = Math.max(0, Math.min(100, (raw / meta.max) * 100));
      });
    }
    const values = Object.values(scores).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return {
      portfolio,
      submission: teacherSubmission,
      rubricMissing: Boolean(assignment && !assignmentRubric),
      scores,
      average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    };
  }), [filtered, assignments, rubrics, rubricSubmissions]);

  const axes = Object.keys(axisLabels) as PoeticAxisId[];
  const studentAggregates = useMemo(() => {
    const map = new Map<string, { studentId: string; axes: Partial<Record<PoeticAxisId, number[]>>; averages: number[] }>();
    for (const row of rows) {
      if (!map.has(row.portfolio.studentId)) map.set(row.portfolio.studentId, { studentId: row.portfolio.studentId, axes: {}, averages: [] });
      const target = map.get(row.portfolio.studentId)!;
      if (typeof row.average === 'number') target.averages.push(row.average);
      for (const axis of axes) {
        const value = row.scores[axis];
        if (typeof value === 'number') {
          if (!target.axes[axis]) target.axes[axis] = [];
          target.axes[axis]!.push(value);
        }
      }
    }
    return [...map.values()];
  }, [rows]);

  const axisStats = useMemo(() => Object.fromEntries(axes.map(axis => {
    const perStudent = studentAggregates.map(student => {
      const values = student.axes[axis] || [];
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    }).filter((value): value is number => typeof value === 'number');
    return [axis, { n: perStudent.length, average: perStudent.length ? perStudent.reduce((sum, value) => sum + value, 0) / perStudent.length : null }];
  })), [studentAggregates]);

  const weakAxis = axes
    .filter(axis => axisStats[axis]?.n > 0)
    .sort((a, b) => Number(axisStats[a]?.average) - Number(axisStats[b]?.average))[0];
  const perStudentOverall = studentAggregates.map(student => student.averages.length
    ? student.averages.reduce((sum, value) => sum + value, 0) / student.averages.length
    : null).filter((value): value is number => typeof value === 'number');
  const overall = perStudentOverall.length ? perStudentOverall.reduce((sum, value) => sum + value, 0) / perStudentOverall.length : null;
  const submittedStudents = new Set(filtered.filter(portfolio => portfolio.versions.length > 0).map(portfolio => portfolio.studentId)).size;
  const uniqueStudents = new Set(filtered.map(portfolio => portfolio.studentId)).size;
  const missingRubricCount = rows.filter(row => row.rubricMissing).length;

  return (
    <div className="max-w-7xl space-y-6 pb-16">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div><Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button><h1 className="mt-1 text-2xl font-semibold text-slate-900">Phân tích lớp</h1><p className="mt-0.5 text-sm text-slate-500">Chỉ dùng điểm rubric chính thức của giáo viên; mỗi học sinh chỉ đóng góp một lần vào thống kê lớp.</p></div>
        <div className="flex flex-wrap items-center gap-2"><select value={classFilter} onChange={event => setClassFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm"><option value="all">Tất cả lớp</option>{classes.map(className => <option key={className} value={className}>{className}</option>)}</select><select value={assignmentFilter} onChange={event => setAssignmentFilter(event.target.value)} className="max-w-xs rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm"><option value="all">Tất cả nhiệm vụ</option>{assignments.map(assignment => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select></div>
      </div>

      {missingRubricCount > 0 && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Có {missingRubricCount} hồ sơ thiếu rubric đúng của nhiệm vụ nên không được dùng rubric khác để tính thay.</div>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700"><span><strong>{uniqueStudents}</strong> học sinh</span><span>·</span><span><strong>{submittedStudents}</strong> học sinh đã nộp</span><span>·</span><span>Điểm trung bình: <strong>{typeof overall === 'number' ? `${overall.toFixed(1)}%` : '—'}</strong> ({perStudentOverall.length} học sinh đã chấm)</span>{weakAxis && <><span>·</span><span>Cần lưu ý: <strong>{axisLabels[weakAxis]}</strong> ({Number(axisStats[weakAxis].average).toFixed(1)}%, n={axisStats[weakAxis].n})</span></>}</div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 p-4"><h2 className="text-base font-semibold text-slate-900">Bảng điểm theo tiêu chí</h2><span className="text-sm text-slate-500">“—” là chưa chấm hoặc thiếu rubric</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600"><tr><th className="px-4 py-3">Học sinh</th><th className="px-3 py-3">Lớp</th><th className="px-3 py-3">Nhiệm vụ</th>{axes.map(axis => <th key={axis} className="px-2 py-3 text-center">{axisLabels[axis]}</th>)}<th className="px-3 py-3 text-center">TB</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.length === 0 ? <tr><td colSpan={axes.length + 5} className="py-8 text-center text-sm text-slate-500">Không có hồ sơ phù hợp bộ lọc.</td></tr> : rows.map(({ portfolio, scores, average, submission }) => <tr key={portfolio.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-medium text-slate-900">{portfolio.studentName}</td><td className="px-3 py-3 text-slate-500">{portfolio.className || '—'}</td><td className="px-3 py-3 text-slate-500">{assignments.find(item => item.id === portfolio.assignmentId)?.title || '—'}</td>{axes.map(axis => <td key={axis} className="px-2 py-3 text-center">{typeof scores[axis] === 'number' ? `${Number(scores[axis]).toFixed(0)}%` : '—'}</td>)}<td className="px-3 py-3 text-center font-semibold text-slate-900">{typeof average === 'number' ? `${average.toFixed(1)}%` : '—'}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-review', { assignmentId: portfolio.assignmentId, studentId: portfolio.studentId })}>{submission ? 'Xem lại' : 'Chấm bài'}</Button></td></tr>)}</tbody></table></div></div>
    </div>
  );
};
