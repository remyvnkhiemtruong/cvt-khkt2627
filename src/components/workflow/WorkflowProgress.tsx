import React from 'react';
import type { StudentWorkflowState } from '../../app/workflow/workflowState';

export const WorkflowProgress: React.FC<{ state: StudentWorkflowState; compact?: boolean }> = ({ state, compact = false }) => {
  return (
    <div className="space-y-2.5" aria-label={`Tiến độ ${state.progress}%`}>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-medium">{compact ? 'Tiến độ' : 'Tiến trình hồ sơ'}</span>
        <span className="font-bold text-slate-700">{state.progress}%</span>
      </div>
      <div className="v3-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress}>
        <div className="v3-progress-fill" style={{ width: `${state.progress}%` }} />
      </div>
      {!compact && (
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
          {state.steps.map(step => {
            const cls = step.done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : step.active
                ? 'border-primary-300 bg-primary-50 text-primary-900 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-400';
            return (
              <div key={step.id} className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold ${cls}`} title={step.label}>
                <span aria-hidden="true">{step.done ? '✓' : step.active ? '●' : '○'}</span> {step.shortLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
