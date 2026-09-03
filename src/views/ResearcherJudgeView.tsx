import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard, PageHeader } from '../components/ui';
import { ArrowLeftIcon, ArrowsRightLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={() => onNavigate('dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
            Tổng quan
          </Button>
        </div>
        <PageHeader
          title="Minh chứng tiến bộ & Chỉ số Effect Size"
          description="Dữ liệu nghiên cứu ẩn danh phân tích đối chứng Pre/Post và đo lường mức độ tăng trưởng năng lực theo chuẩn khoa học."
          actions={<Badge variant="indigo">{samples.length} hồ sơ ẩn danh</Badge>}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Hồ sơ nghiên cứu" value={String(samples.length)} subValue="Bộ dữ liệu thực tế" icon={<DocumentTextIcon className="h-4 w-4" />} />
        <StatCard label="Cặp Pre/Post (GV)" value={String(paired.length)} subValue="Đủ điều kiện so sánh" icon={<ArrowsRightLeftIcon className="h-4 w-4" />} />
        <StatCard label="Điểm Pre trung bình" value={paired.length ? avgPre.toFixed(2) : '—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-4 w-4" />} />
        <StatCard label="Điểm Post trung bình" value={paired.length ? avgPost.toFixed(2) : '—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-4 w-4" />} />
        <StatCard label="Cohen's dz" value={effect ? effect.toFixed(2) : '—'} subValue={paired.length > 1 ? 'Độ lớn ảnh hưởng' : 'Cần ≥ 2 cặp'} icon={<ChartBarIcon className="h-4 w-4" />} />
      </section>

      <Card padding="md">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Mẫu đối chứng ẩn danh</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Mã định danh được băm ổn định từ máy chủ; thông tin cá nhân và lớp học gốc được ẩn danh hoàn toàn phục vụ công bố khoa học.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="px-3 py-2.5 text-left font-semibold">Mã ẩn danh</th>
                <th className="px-3 py-2.5 text-center font-semibold">Nhóm (Cohort)</th>
                <th className="px-3 py-2.5 text-center font-semibold">Phiên bản</th>
                <th className="px-3 py-2.5 text-center font-semibold">Điểm Pre</th>
                <th className="px-3 py-2.5 text-center font-semibold">Điểm Post</th>
                <th className="px-3 py-2.5 text-center font-semibold">Mức tăng (Gain)</th>
                <th className="px-3 py-2.5 text-center font-semibold">Phản hồi đã xử lý</th>
                <th className="px-3 py-2.5 text-left font-semibold">Trích đoạn minh chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Chưa có dữ liệu nghiên cứu khả dụng.
                  </td>
                </tr>
              ) : (
                samples.map(s => (
                  <tr key={s.code} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-mono font-semibold text-indigo-900">{s.code}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{s.cohort}</td>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-700">{s.versionCount}</td>
                    <td className="px-3 py-2.5 text-center text-slate-700">{s.pre ? s.pre.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2.5 text-center text-slate-700">{s.post ? s.post.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      {s.pre && s.post ? (
                        <span className={`font-semibold ${s.gain > 0 ? 'text-emerald-700' : s.gain < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                          {s.gain > 0 ? '+' : ''}
                          {s.gain.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-700">{s.resolved}</td>
                    <td className="px-3 py-2.5 text-slate-600 italic max-w-xs truncate">
                      {s.evidence ? `“${s.evidence}…”` : '—'}
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
