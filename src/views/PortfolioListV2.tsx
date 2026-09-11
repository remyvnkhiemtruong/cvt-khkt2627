import React from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { academicVersionsOf, deriveStudentWorkflow } from '../app/workflow/workflowState';
import { WorkflowProgress } from '../components/workflow/WorkflowProgress';
import { Button } from '../components/ui';
import { usePortfolio } from '../contexts/PortfolioContext';

export const PortfolioListV2: React.FC<{ onNavigate: (view: string, params?: any) => void }> = ({ onNavigate }) => {
  const user = useAuthStore(s => s.currentUser);
  const { assignments, portfolios, feedbacks, rubricSubmissions, reflections } = usePortfolio();
  const reflectionIds = reflections.filter(r => r.studentId === user.id).map(r => r.versionId);
  return <div className="space-y-4">{assignments.map(assignment => {
    const portfolio = portfolios[`port-${user.id}-${assignment.id}`];
    const versions = academicVersionsOf(portfolio);
    const state = deriveStudentWorkflow({ assignment, portfolio, feedbacks, rubricSubmissions, reflectionVersionIds: reflectionIds });
    return <div key={assignment.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><div><div className="font-semibold text-slate-900">{assignment.title}</div><div className="mt-1 text-xs text-slate-500">{versions.length} phiên bản V1/V2 · {portfolio?.versions.some(v => v.stage === 'prediction') ? 'Có V0' : 'Chưa có V0'}</div></div><span className="text-xs text-slate-500">{state.statusLabel}</span></div><div className="mt-3"><WorkflowProgress state={state} compact /></div><div className="mt-3 flex justify-end"><Button size="sm" variant="primary" onClick={() => onNavigate('editor', { assignmentId: assignment.id })}>Mở hồ sơ</Button></div></div>;
  })}</div>;
};
