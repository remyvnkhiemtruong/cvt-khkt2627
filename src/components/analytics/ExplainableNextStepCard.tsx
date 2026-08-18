import React from 'react';
import type { TaskRecommendation } from '../../types';
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, CheckCircle } from 'lucide-react';

interface ExplainableNextStepCardProps {
  recommendation: TaskRecommendation;
  onStartAssignment: (assignmentId: string) => void;
}

export const ExplainableNextStepCard: React.FC<ExplainableNextStepCardProps> = ({
  recommendation,
  onStartAssignment
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-elevated border border-indigo-500/30 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Badge: Explainable pedagogical rule */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-300 text-xs font-bold border border-indigo-300/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Đề Xuất Nhiệm Vụ Tiếp Theo (Quy tắc Sư phạm Minh bạch)
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Không phải AI chung chung • Dựa trên ma trận Rubric thực tế
          </div>
        </div>

        {/* Task Title & Target Axis */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Trọng tâm cải thiện: {recommendation.targetAxisTitle}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white mt-1">
            {recommendation.assignmentTitle}
          </h3>
        </div>

        {/* Explicit Pedagogical Rationale (The "Why") */}
        <div className="bg-slate-800/70 border border-indigo-400/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <HelpCircle className="w-4 h-4" />
            Lý do đề xuất minh bạch (Pedagogical Rationale):
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {recommendation.rationale}
          </p>
        </div>

        {/* Expected Competency Gain */}
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Mục tiêu đầu ra dự kiến:</strong> {recommendation.expectedGain}
          </span>
        </div>

        {/* Action Button: One-click Start */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={() => onStartAssignment(recommendation.nextAssignmentId)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <span>Bắt đầu nhiệm vụ này ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
