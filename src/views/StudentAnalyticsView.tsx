import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard, PageHeader } from '../components/ui';
import { ArrowLeftIcon, ArrowRightIcon, ChartBarIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface StudentAnalyticsViewProps { studentId:string;assignmentId:string;onNavigate:(view:string,extraParams?:any)=>void; }
const labels:Record<PoeticAxisId,string>={plot_situation:'Tình huống',character_detail:'Nhân vật',narrator_pov:'Điểm nhìn',space_time:'Không-thời gian',language_tone_symbol:'Ngôn ngữ',form_argument:'Lập luận'};

export const StudentAnalyticsView:React.FC<StudentAnalyticsViewProps>=({studentId,assignmentId,onNavigate})=>{
  const {portfolios,feedbacks,rubricSubmissions,rubric,assignments}=usePortfolio();
  const portfolio=portfolios[`port-${studentId}-${assignmentId}`];
  const studentFeedback=feedbacks.filter(f=>f.studentId===studentId&&f.assignmentId===assignmentId);
  const submissions=rubricSubmissions.filter(s=>s.studentId===studentId&&s.assignmentId===assignmentId).sort((a,b)=>new Date(a.submittedAt).getTime()-new Date(b.submittedAt).getTime());
  const axisByCriterion=useMemo(()=>Object.fromEntries(rubric.criteria.map(c=>[c.id,c.axisId])),[rubric]);
  const trajectory=useMemo(()=>submissions.map(s=>{const axes:Partial<Record<PoeticAxisId,number>>={};Object.entries(s.criterionScores).forEach(([id,v])=>{const axis=axisByCriterion[id] as PoeticAxisId|undefined;if(axis)axes[axis]=Number(v.score||v.level||0);});return{sub:s,axes};}),[submissions,axisByCriterion]);
  const latest=trajectory.at(-1);const first=trajectory[0];
  const axisRows=(Object.keys(labels) as PoeticAxisId[]).map(axis=>({axis,first:first?.axes[axis]||0,last:latest?.axes[axis]||0,delta:(latest?.axes[axis]||0)-(first?.axes[axis]||0)}));
  const weakest=axisRows.filter(x=>x.last>0).sort((a,b)=>a.last-b.last)[0];
  const resolved=studentFeedback.filter(f=>f.resolved).length;const ai=studentFeedback.filter(f=>f.authorRole==='ai').length;

  if(!portfolio)return <div className="rounded-lg border border-slate-200 bg-white p-6 text-center"><h2 className="font-semibold text-slate-900">Chưa có hồ sơ học tập</h2><p className="mt-1 text-xs text-slate-500">Hồ sơ sẽ xuất hiện sau khi bạn bắt đầu nhiệm vụ.</p></div>;
  const currentAssignmentTitle = assignments.find(a=>a.id===assignmentId)?.title||assignmentId;

  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={()=>onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs text-slate-500">{currentAssignmentTitle}</span>
      </div>
      <PageHeader
        title={`Tiến bộ năng lực — ${portfolio.studentName}`}
        description={`Đánh giá sự tiến bộ qua các phiên bản và nhận xét phản hồi cho bài tập.`}
        actions={
          portfolio.versions.length >= 2 ? (
            <Button size="sm" variant="outline" onClick={()=>onNavigate('version-diff',{assignmentId})}>
              So sánh phiên bản
            </Button>
          ) : undefined
        }
      />
    </div>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Phiên bản" value={String(portfolio.versions.length)} subValue={portfolio.currentActiveVersion} icon={<DocumentTextIcon className="h-4 w-4"/>}/>
      <StatCard label="Phản hồi" value={String(studentFeedback.length)} subValue={`${resolved} đã xử lý`} icon={<ChatBubbleLeftRightIcon className="h-4 w-4"/>}/>
      <StatCard label="Gợi ý AI" value={String(ai)} subValue="Đã nhận" icon={<SparklesIcon className="h-4 w-4"/>}/>
      <StatCard label="Đánh giá rubric" value={String(submissions.length)} subValue={latest?`Gần nhất: ${latest.sub.totalScore}/${latest.sub.maxScore}`:'Chưa chấm'} icon={<ChartBarIcon className="h-4 w-4"/>}/>
    </section>

    <Card padding="md">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Tiến bộ theo 6 trục thi pháp</h2>
        <p className="mt-0.5 text-xs text-slate-500">So sánh điểm rubric giữa lần nộp đầu tiên và gần nhất.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {axisRows.map(r=>(
          <div key={r.axis} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <b className="text-xs font-semibold text-slate-800">{labels[r.axis]}</b>
              {r.last>0&&<Badge variant={r.delta>0?'emerald':r.delta<0?'rose':'slate'}>{r.delta>0?'+':''}{r.delta.toFixed(1)}</Badge>}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs text-slate-500">Đầu: <b className="text-slate-800">{r.first?r.first.toFixed(1):'—'}</b></span>
              <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300"/>
              <span className="text-xs text-slate-500">Gần nhất: <b className="text-slate-800">{r.last?r.last.toFixed(1):'—'}</b></span>
            </div>
          </div>
        ))}
      </div>
      {weakest&&<div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><b>Gợi ý trọng tâm:</b> Trục {labels[weakest.axis]} hiện đạt {weakest.last.toFixed(1)}/4. Bạn nên ưu tiên xem lại nhận xét và dẫn chứng liên quan đến trục này.</div>}
    </Card>

    <Card padding="md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Lịch sử phiên bản & phản hồi</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ghi nhận các góp ý theo từng phiên bản bài nộp.</p>
        </div>
      </div>
      <div className="space-y-3">
        {portfolio.versions.map(v=>{
          const linked=studentFeedback.filter(f=>f.versionNumber===v.versionNumber);
          return (
            <div key={v.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-xs font-semibold text-slate-900">{v.versionNumber}</b>
                  <span className="ml-2 text-xs text-slate-400">{new Date(v.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <Badge variant="blue">{linked.length} góp ý</Badge>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">{v.changeSummary||'Không có ghi chú thay đổi.'}</p>
              {linked.map(f=>(
                <div key={f.id} className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <span className="font-semibold text-slate-800">{f.authorRole==='ai'?'AI':f.authorName}:</span> {f.comment} {f.resolved&&<span className="font-medium text-emerald-700 ml-1">• Đã xử lý</span>}
                </div>
              ))}
            </div>
          );
        })}
        {portfolio.versions.length===0&&<p className="text-xs text-slate-500 py-3">Chưa có phiên bản nào được lưu.</p>}
      </div>
    </Card>
  </div>;
};
