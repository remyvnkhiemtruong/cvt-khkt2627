import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
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
  const { portfolios, rubricSubmissions, rubric, assignments } = usePortfolio();
  const list = useMemo(() => Object.values(portfolios), [portfolios]);
  const classes = useMemo(() => Array.from(new Set(list.map(p => p.className).filter(Boolean))).sort(), [list]);

  const [classFilter, setClassFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const filtered = useMemo(() => {
    return list.filter(p => {
      if (classFilter !== 'all' && p.className !== classFilter) return false;
      if (assignmentFilter !== 'all' && p.assignmentId !== assignmentFilter) return false;
      return true;
    });
  }, [list, classFilter, assignmentFilter]);

  const criterionAxis = useMemo(
    () => Object.fromEntries(rubric.criteria.map(c => [c.id, c.axisId])),
    [rubric]
  );

  // OFFICIAL ONLY: Exclusively teacher rubric evaluations
  const rows = useMemo(() => {
    return filtered.map(p => {
      const teacherSub = rubricSubmissions
        .filter(s => s.studentId === p.studentId && s.assignmentId === p.assignmentId && s.evaluatorRole === 'teacher')
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

      const scores: Partial<Record<PoeticAxisId, number>> = {};
      if (teacherSub) {
        Object.entries(teacherSub.criterionScores).forEach(([criterion, value]) => {
          const axis = criterionAxis[criterion] as PoeticAxisId | undefined;
          if (axis) scores[axis] = Number(value.score || value.level || 0);
        });
      }
      const values = Object.values(scores).filter((v): v is number => typeof v === 'number');
      return {
        portfolio: p,
        submission: teacherSub,
        scores,
        average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
      };
    });
  }, [filtered, rubricSubmissions, criterionAxis]);

  const axes = Object.keys(axisLabels) as PoeticAxisId[];

  const axisAverages = useMemo(() => {
    return Object.fromEntries(
      axes.map(axis => {
        const vals = rows.map(r => r.scores[axis]).filter((v): v is number => typeof v === 'number');
        return [axis, vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0];
      })
    );
  }, [rows, axes]);

  const weakAxis = axes.slice().sort((a, b) => Number(axisAverages[a]) - Number(axisAverages[b]))[0];
  const scored = rows.filter(r => r.average > 0);
  const overall = scored.length ? scored.reduce((a, b) => a + b.average, 0) / scored.length : 0;
  const submitted = filtered.filter(p => p.versions.length > 0).length;

  return (
    <div className="max-w-7xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Quay lại
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Phân tích lớp</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bảng điểm Rubric chính thức theo 6 trục thi pháp (chỉ ghi nhận đánh giá của giáo viên)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-slate-500"
          >
            <option value="all">Tất cả lớp</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={assignmentFilter}
            onChange={e => setAssignmentFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-slate-500 max-w-xs truncate"
          >
            <option value="all">Tất cả nhiệm vụ</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Strip (No StatCards!) */}
      <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><strong>{filtered.length}</strong> học sinh trong danh sách</span>
        <span className="text-slate-300">·</span>
        <span><strong>{submitted}</strong> đã nộp bài</span>
        <span className="text-slate-300">·</span>
        <span>
          Điểm Rubric trung bình: <strong>{overall ? `${overall.toFixed(2)}/4` : '—'}</strong> ({scored.length} bài đã chấm)
        </span>
        {weakAxis && Number(axisAverages[weakAxis]) > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span>
              Trục cần lưu ý: <strong>{axisLabels[weakAxis]}</strong> ({Number(axisAverages[weakAxis]).toFixed(2)}/4)
            </span>
          </>
        )}
      </div>

      {/* Table-First Matrix */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Bảng điểm theo tiêu chí</h2>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>Thang điểm: 1 (Chưa đạt) — 4 (Xuất sắc)</span>
            <span>·</span>
            <span>“—” là chưa chấm</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
              <tr>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-3">Lớp</th>
                {axes.map(a => (
                  <th key={a} className="py-3 px-2 text-center">{axisLabels[a]}</th>
                ))}
                <th className="py-3 px-3 text-center">TB</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={axes.length + 4} className="py-8 text-center text-xs text-slate-500">
                    Không có hồ sơ nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                rows.map(({ portfolio, scores, average, submission }) => (
                  <tr key={portfolio.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {portfolio.studentName}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {portfolio.className || '—'}
                    </td>
                    {axes.map(a => {
                      const val = scores[a];
                      return (
                        <td key={a} className="py-3 px-2 text-center text-xs">
                          {val ? (
                            <span className={val < 2.5 ? 'text-amber-800 font-medium' : 'text-slate-800'}>
                              {val.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center font-semibold text-slate-900 text-xs">
                      {average ? average.toFixed(2) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onNavigate('teacher-review', {
                            assignmentId: portfolio.assignmentId,
                            studentId: portfolio.studentId
                          })
                        }
                      >
                        {submission ? 'Xem lại' : 'Chấm bài'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
