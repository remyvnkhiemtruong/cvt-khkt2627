import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { deriveStudentWorkflow } from '../../app/workflow/workflowState';
import { WorkflowProgress } from '../../components/workflow/WorkflowProgress';
import { Button } from '../../components/ui';

export const StudentDashboardView: React.FC<{ onNavigate: (view: string, params?: any) => void }> = ({ onNavigate }) => {
  const user = useAuthStore(s => s.currentUser);
  const { assignments, portfolios, feedbacks, rubricSubmissions, reflections } = usePortfolio();
  const reflectionIds = reflections.filter(r => r.studentId === user.id).map(r => r.versionId);
  const items = assignments.map(assignment => ({ assignment, state: deriveStudentWorkflow({ assignment, portfolio: portfolios[`port-${user.id}-${assignment.id}`], feedbacks, rubricSubmissions, reflectionVersionIds: reflectionIds }) }));
  const next = items.find(item => !item.state.isComplete) || items[0];
  return <div className="mx-auto max-w-6xl space-y-5 pb-16"><div className="border-b border-slate-200 pb-4"><h1 className="text-2xl font-semibold text-slate-950">Bàn học của {user.name}</h1><p className="mt-1 text-sm text-slate-500">{items.filter(i => i.state.isComplete).length}/{items.length} nhiệm vụ đã hoàn thành</p></div>{next && <section className="rounded-md border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold text-slate-900">{next.assignment.title}</h2><p className="mt-1 text-sm text-slate-600">{next.state.nextActionHint}</p><div className="mt-4"><WorkflowProgress state={next.state} /></div><div className="mt-4"><Button variant="primary" onClick={() => onNavigate('editor', { assignmentId: next.assignment.id })}>{next.state.nextActionLabel}</Button></div></section>}</div>;
};
