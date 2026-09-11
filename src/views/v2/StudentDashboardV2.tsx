import React, { useMemo } from 'react';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../app/store/useAuthStore';
import { usePortfolioStore } from '../../app/store/usePortfolioStore';
import { deriveStudentWorkflow } from '../../app/workflow/workflowState';
import { WorkflowProgress } from '../../components/workflow/WorkflowProgress';
import { SaveStatus } from '../../components/workflow/SaveStatus';
import { Button, EmptyState } from '../../components/ui';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface Props { onNavigate: (view: string, params?: any) => void; }

export const StudentDashboardView: React.FC<Props> = ({ onNavigate }) => {
  const user = useAuthStore(s => s.currentUser);
  const { autosaveStatus, lastSavedTime } = usePortfolioStore();
  const { assignments, literatureTexts, portfolios, feedbacks, rubricSubmissions, reflections, isLoading, dataError, refreshAcademicData } = usePortfolio();
  const reflectionIds = useMemo(() => reflections.filter(r => r.studentId === user.id).map(r => r.versionId), [reflections, user.id]);
  const cards = useMemo(() => assignments.map(assignment => {
    const portfolio = portfolios[`port-${user.id}-${assignment.id}`];
    const state = deriveStudentWorkflow({ assignment, portfolio, feedbacks, rubricSubmissions, reflectionVersionIds: reflectionIds });
    return { assignment, state, text: literatureTexts.find(t => t.id === assignment.textId) };
  }), [assignments, portfolios, user.id, feedbacks, rubricSubmissions, reflectionIds, literatureTexts]);
  const next = cards.find(item => !item.state.isComplete) || cards[0];
  const completed = cards.filter(item => item.state.isComplete).length;
  const unresolved = feedbacks.filter(item => item.studentId === user.id && !item.resolved);

  if (isLoading && !assignments.length) return <div className="py-16 text-center text-sm text-slate-500">Đang chuẩn bị bàn học...</div>;
  if (!assignments.length) return <EmptyState icon={<BookOpenIcon className="h-8 w-8" />} title="Chưa có nhiệm vụ" description={dataError || 'Giáo viên chưa giao bài.'} action={<Button variant="outline" onClick={() => void refreshAcademicData()}>Tải lại</Button>} />;

  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bàn học cá nhân</div><h1 className="mt-1 text-2xl font-semibold text-slate-950">Chào {user.name}</h1><p className="mt-1 text-sm text-slate-500">{user.className ? `Lớp ${user.className} · ` : ''}Hệ thống chỉ ra việc cần làm tiếp theo.</p></div>
        <div className="flex gap-2"><div className="rounded-xl bg-slate-50 px-4 py-3 text-center"><b className="block text-xl">{assignments.length}</b><span className="text-xs text-slate-500">Nhiệm vụ</span></div><div className="rounded-xl bg-emerald-50 px-4 py-3 text-center"><b className="block text-xl text-emerald-700">{completed}</b><span className="text-xs text-emerald-700">Hoàn thành</span></div><div className="rounded-xl bg-amber-50 px-4 py-3 text-center"><b className="block text-xl text-amber-800">{unresolved.length}</b><span className="text-xs text-amber-800">Góp ý</span></div></div>
      </div>
    </section>
    {dataError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Dữ liệu có thể chưa mới nhất: {dataError}</div>}
    {next && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Việc nên làm ngay · {next.state.statusLabel}</div><h2 className="mt-2 text-xl font-semibold text-slate-950">{next.assignment.title}</h2><p className="mt-1 text-sm text-slate-500">{next.text ? `${next.text.title} — ${next.text.author}` : 'Ngữ liệu'}</p><p className="mt-3 text-sm text-slate-700">{next.state.nextActionHint}</p><div className="mt-4"><WorkflowProgress state={next.state} /></div></div>
        <div className="flex flex-col gap-2"><SaveStatus status={autosaveStatus} lastSavedTime={lastSavedTime} /><Button variant="primary" onClick={() => onNavigate('editor', { assignmentId: next.assignment.id })} rightIcon={<ArrowRightIcon className="h-4 w-4" />}>{next.state.nextActionLabel}</Button></div>
      </div>
    </section>}
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-950">Tất cả nhiệm vụ</h2><Button size="sm" variant="ghost" onClick={() => onNavigate('assignment-list')}>Xem tất cả</Button></div><div className="grid gap-3 md:grid-cols-2">{cards.map(item => <button key={item.assignment.id} onClick={() => onNavigate('editor', { assignmentId: item.assignment.id })} className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 hover:shadow-sm"><div className="text-sm font-semibold text-slate-900">{item.assignment.title}</div><div className="mt-1 text-xs text-slate-500">{item.state.statusLabel}</div><div className="mt-3"><WorkflowProgress state={item.state} compact /></div></button>)}</div></section>
  </div>;
};
