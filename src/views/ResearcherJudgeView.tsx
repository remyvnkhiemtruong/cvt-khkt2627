import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ResearcherJudgeViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

export const ResearcherJudgeView: React.FC<ResearcherJudgeViewProps> = ({ onNavigate }) => {
  const { portfolios, rubricSubmissions, rubric, feedbacks } = usePortfolio();
  const criterionAxis = useMemo(
    () => Object.fromEntries(rubric.criteria.map(c => [c.id, c.axisId])),
    [rubric]
  );

  // Server provides stable pseudonyms: p.studentId is HS-ANON-XXXX, p.className is Nhóm XXXX
  const samples = useMemo(() => {
    return Object.values(portfolios).map(p => {
      // Strictly official teacher evaluations for valid pedagogical research
      const subs = rubricSubmissions
        .filter(s => s.studentId === p.studentId && s.assignmentId === p.assignmentId && s.evaluatorRole === 'teacher')
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

      const score = (s: any) => (s && Number(s.maxScore) > 0 ? (Number(s.totalScore) / Number(s.maxScore)) * 4 : 0);
      const isPairedEligible = subs.length >= 2;
      const pre = isPairedEligible ? score(subs[0]) : 0;
      const post = isPairedEligible ? score(subs[subs.length - 1]) : 0;

      const latest = subs[subs.length - 1];
      const axes: Partial<Record<PoeticAxisId, number>> = {};
      if (latest) {
        Object.entries(latest.criterionScores).forEach(([id, v]: any) => {
          const axis = criterionAxis[id] as PoeticAxisId | undefined;
          if (axis) axes[axis] = Number(v.score || v.level || 0);
        });
      }

      const resolved = feedbacks.filter(f => f.studentId === p.studentId && f.assignmentId === p.assignmentId && f.resolved).length;
      const latestVersion = p.versions[p.versions.length - 1];
      const evidence = latestVersion
        ? Object.values(latestVersion.responses).map(r => r.analysisText).find(Boolean) || ''
        : '';

      return {
        code: p.studentId, // Stable server pseudonym
        cohort: p.className || 'Nhóm nghiên cứu',
        assignmentId: p.assignmentId,
        pre,
        post,
        gain: pre > 0 && post > 0 ? post - pre : 0,
        versionCount: p.versions.length,
        resolved,
        axes,
        evidence: evidence.slice(0, 220)
      };
    });
  }, [portfolios, rubricSubmissions, criterionAxis, feedbacks]);

  const paired = samples.filter(s => s.pre > 0 && s.post > 0);
  const gains = paired.map(s => s.gain);
  const effect = gains.length > 1 && sd(gains) > 0 ? mean(gains) / sd(gains) : 0;
  const avgPre = mean(paired.map(s => s.pre));
  const avgPost = mean(paired.map(s => s.post));

  return (
    <div className="max-w-7xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="mb-1">
            <Button size="sm" variant="ghost" onClick={() => onNavigate('dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
              Tổng quan
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Phân tích nghiên cứu</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dữ liệu đối chứng trước và sau chỉnh sửa theo thang đo Rubric (đã ẩn danh)
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {samples.length} hồ sơ mẫu
        </div>
      </div>

      {/* Summary Strip (No StatCards!) */}
      <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><strong>{samples.length}</strong> hồ sơ nghiên cứu</span>
        <span className="text-slate-300">·</span>
        <span><strong>{paired.length}</strong> cặp đối chứng đủ điều kiện</span>
        <span className="text-slate-300">·</span>
        <span>
          Trước TB: <strong>{paired.length ? `${avgPre.toFixed(2)}/4` : '—'}</strong>
        </span>
        <span className="text-slate-300">·</span>
        <span>
          Sau TB: <strong>{paired.length ? `${avgPost.toFixed(2)}/4` : '—'}</strong>
        </span>
        <span className="text-slate-300">·</span>
        <span>
          Cohen's d: <strong>{effect ? effect.toFixed(2) : '—'}</strong>
        </span>
      </div>

      {/* Clean Research Data Table */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Dữ liệu mẫu đối chứng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thông tin định danh học sinh được mã hóa phục vụ phân tích sư phạm.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
              <tr>
                <th className="py-3 px-4">Mã ẩn danh</th>
                <th className="py-3 px-3 text-center">Nhóm</th>
                <th className="py-3 px-3 text-center">Số bản</th>
                <th className="py-3 px-3 text-center">Bản trước</th>
                <th className="py-3 px-3 text-center">Bản sau</th>
                <th className="py-3 px-3 text-center">Mức tăng</th>
                <th className="py-3 px-3 text-center">Đã sửa</th>
                <th className="py-3 px-4">Minh chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    Chưa có dữ liệu nghiên cứu khả dụng.
                  </td>
                </tr>
              ) : (
                samples.map(s => (
                  <tr key={s.code} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-xs font-mono text-slate-700">{s.code}</td>
                    <td className="py-3 px-3 text-center text-xs text-slate-600">{s.cohort}</td>
                    <td className="py-3 px-3 text-center text-xs text-slate-700">{s.versionCount}</td>
                    <td className="py-3 px-3 text-center text-xs text-slate-700">{s.pre ? s.pre.toFixed(2) : '—'}</td>
                    <td className="py-3 px-3 text-center text-xs font-medium text-slate-900">{s.post ? s.post.toFixed(2) : '—'}</td>
                    <td className="py-3 px-3 text-center text-xs">
                      {s.pre && s.post ? (
                        <span className={s.gain > 0 ? 'text-emerald-700 font-medium' : s.gain < 0 ? 'text-rose-700' : 'text-slate-500'}>
                          {s.gain > 0 ? `+${s.gain.toFixed(2)}` : s.gain.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-700">{s.resolved}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 italic max-w-xs truncate">
                      {s.evidence ? `“${s.evidence}…”` : '—'}
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
