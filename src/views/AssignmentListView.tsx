import React from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { deriveStudentWorkflow } from '../app/workflow/workflowState';
import { WorkflowProgress } from '../components/workflow/WorkflowProgress';
import { Button } from '../components/ui';
import { usePortfolio } from '../contexts/PortfolioContext';

interface AssignmentListViewProps { onNavigate: (view: string, params?: any) => void; }

export const AssignmentListView: React.FC<AssignmentListViewProps> = ({ onNavigate }) => {
  const user = useAuthStore(s => s.currentUser);
  const { assignments, literatureTexts, portfolios, feedbacks, rubricSubmissions, reflections } = usePortfolio();
  const reflectionIds = reflections.filter(r => r.studentId === user.id).map(r => r.versionId);
  return <div className="mx-auto max-w-6xl space-y-5 pb-16">
    <div className="flex items-end justify-between border-b border-slate-200 pb-4"><div><h1 className="text-2xl font-semibold text-slate-950">Nhiệm vụ học tập</h1><p className="mt-1 text-sm text-slate-500">Mỗi bài hiển thị đúng bước cần làm tiếp theo.</p></div><Button variant="outline" onClick={() => onNavigate('dashboard')}>Bàn học</Button></div>
    <div className="grid gap-3 md:grid-cols-2">{assignments.map(assignment => {
      const state = deriveStudentWorkflow({ assignment, portfolio: portfolios[`port-${user.id}-${assignment.id}`], feedbacks, rubricSubmissions, reflectionVersionIds: reflectionIds });
      const text = literatureTexts.find(t => t.id === assignment.textId);
      return <article key={assignment.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold text-slate-900">{assignment.title}</h2><p className="mt-1 text-xs text-slate-500">{text ? `${text.title} - ${text.author}` : 'Ngữ liệu'}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{state.statusLabel}</span></div><div className="mt-3"><WorkflowProgress state={state} /></div><p className="mt-3 text-sm text-slate-600">{state.nextActionHint}</p><div className="mt-4 flex justify-end"><Button size="sm" variant="primary" onClick={() => onNavigate('editor', { assignmentId: assignment.id })}>{state.nextActionLabel}</Button></div></article>;
    })}</div>
  </div>;
};
