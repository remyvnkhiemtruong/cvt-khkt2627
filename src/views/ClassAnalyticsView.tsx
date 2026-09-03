import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button, Card, StatCard, PageHeader } from '../components/ui';
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

const axisLabels: Record<PoeticAxisId, string> = {
  plot_situation: 'Tình huống',
  character_detail: 'Nhân vật',
  narrator_pov: 'Điểm nhìn',
  space_time: 'Không-thời gian',
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

  // OFFICIAL ONLY: Exclusively teacher rubric evaluations. No fallback to self or peer!
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

  const cell = (score: number | undefined) => {
    if (!score) return 'bg-slate-100 text-slate-400';
    if (score < 2) return 'bg-rose-50 text-rose-800 border border-rose-200 font-semibold';
    if (score < 3) return 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
    if (score < 3.6) return 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold';
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={() => onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
            Quay lại
          </Button>
        </div>
        <PageHeader
          title="Phân tích năng lực lớp học"
          description="Bảng tổng hợp điểm Rubric chính thức theo 6 trục thi pháp. Chỉ thống kê điểm đánh giá từ giáo viên."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Lớp:</span>
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
                >
                  <option value="all">Tất cả lớp</option>
                  {classes.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Nhiệm vụ:</span>
                <select
                  value={assignmentFilter}
                  onChange={e => setAssignmentFilter(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500 max-w-xs truncate"
                >
                  <option value="all">Tất cả nhiệm vụ</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hồ sơ bài tập" value={String(filtered.length)} subValue="Trong phạm vi lọc" icon={<UserGroupIcon className="h-4 w-4" />} />
        <StatCard label="Đã nộp bài" value={`${submitted}/${filtered.length}`} subValue="Đã có bản nộp" icon={<DocumentTextIcon className="h-4 w-4" />} />
        <StatCard
          label="Điểm Rubric TB (GV)"
          value={overall ? overall.toFixed(2) : '—'}
          subValue={scored.length ? `Từ ${scored.length} bài đã chấm` : 'Chưa có bài chấm'}
          icon={<ChartBarIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Trục cần hỗ trợ nhất"
          value={weakAxis && Number(axisAverages[weakAxis]) ? axisLabels[weakAxis] : '—'}
          subValue={weakAxis && Number(axisAverages[weakAxis]) ? `TB: ${Number(axisAverages[weakAxis]).toFixed(2)}/4` : 'Chưa đủ dữ liệu'}
          icon={<ChartBarIcon className="h-4 w-4" />}
        />
      </section>

      <Card padding="md">
        <div className="mb-4 border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Bảng tổng hợp điểm 6 trục thi pháp (Chính thức)</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Chỉ ghi nhận đánh giá chính thức từ giáo viên. Ô hiển thị “—” nếu giáo viên chưa chấm điểm.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-200" /> &lt;2: Chưa đạt</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-200" /> 2–3: Đạt</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-sky-200" /> 3–3.6: Khá</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-200" /> &ge;3.6: Xuất sắc</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="px-3 py-2.5 text-left font-semibold">Học sinh / Lớp</th>
                {axes.map(a => (
                  <th key={a} className="px-2 py-2.5 text-center font-semibold">
                    {axisLabels[a]}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-semibold">Điểm TB</th>
                <th className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={axes.length + 3} className="py-8 text-center text-slate-500">
                    Không có hồ sơ nào trong phạm vi lọc đã chọn.
                  </td>
                </tr>
              ) : (
                rows.map(({ portfolio, scores, average, submission }) => (
                  <tr key={portfolio.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900">{portfolio.studentName}</div>
                      <div className="text-[11px] text-slate-400">
                        {portfolio.className || '—'} • {portfolio.currentActiveVersion || 'Chưa nộp'}
                      </div>
                    </td>
                    {axes.map(a => {
                      const val = scores[a];
                      return (
                        <td key={a} className="px-2 py-2.5 text-center">
                          <span className={`inline-block min-w-[2.2rem] rounded px-1.5 py-0.5 text-xs ${cell(val)}`}>
                            {val ? val.toFixed(1) : '—'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                      {average ? average.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
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
      </Card>
    </div>
  );
};
