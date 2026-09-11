import React from 'react';
import type { StudentWorkflowState } from '../../app/workflow/workflowState';

export const WorkflowProgress: React.FC<{ state: StudentWorkflowState; compact?: boolean }> = ({ state, compact = false }) => {
  return (
    <div className="space-y-2" aria-label={`Tiến độ ${state.progress}%`}>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{compact ? 'Tiến độ' : 'Tiến trình hồ sơ'}</span>
        <span className="font-semibold text-slate-700">{state.progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${state.progress}%` }} />
      </div>
      {!compact && (
        <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:gap-1.5">
          {state.steps.map(step => {
            const cls = step.done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : step.active
                ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-400';
            return <div key={step.id} className={`rounded-md border px-2 py-1.5 text-center text-[11px] font-medium ${cls}`} title={step.label}>{step.done ? 'Xong' : step.active ? 'Đang làm' : 'Sau'} · {step.shortLabel}</div>;
          })}
        </div>
      )}
    </div>
  );
};
