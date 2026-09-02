import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard } from '../components/ui';
import { ArrowRightIcon, ChartBarIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';

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

  if(!portfolio)return <div className="rounded-2xl border bg-white p-8 text-center"><h2 className="font-bold">Chưa có hồ sơ học tập</h2><p className="mt-2 text-sm text-slate-500">Hồ sơ sẽ xuất hiện sau khi học sinh được gán nhiệm vụ.</p></div>;
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <header className="rounded-2xl border bg-white p-5 sm:p-6"><div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Learning Analytics có truy nguyên</div><h1 className="mt-1 text-2xl font-bold">Tiến bộ — {portfolio.studentName}</h1><p className="mt-2 text-sm text-slate-600">{assignments.find(a=>a.id===assignmentId)?.title||assignmentId}. Mọi chỉ số bên dưới được nối với version, rubric và feedback thật.</p></header>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Phiên bản" value={String(portfolio.versions.length)} subValue={portfolio.currentActiveVersion} icon={<DocumentTextIcon className="h-5 w-5"/>}/><StatCard label="Phản hồi" value={String(studentFeedback.length)} subValue={`${resolved} đã xử lý`} icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>}/><StatCard label="Phản hồi AI" value={String(ai)} subValue="Trong tiến trình thật" icon={<SparklesIcon className="h-5 w-5"/>}/><StatCard label="Rubric submissions" value={String(submissions.length)} subValue={latest?`Gần nhất: ${latest.sub.totalScore}/${latest.sub.maxScore}`:'Chưa chấm'} icon={<ChartBarIcon className="h-5 w-5"/>}/></section>

    <Card padding="lg"><div className="mb-4"><h2 className="font-bold">Tiến bộ theo 6 trục</h2><p className="mt-1 text-xs text-slate-500">So sánh rubric đầu tiên và gần nhất. Không suy diễn khi chưa có điểm.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{axisRows.map(r=><div key={r.axis} className="rounded-xl border p-4"><div className="flex items-center justify-between"><b className="text-sm">{labels[r.axis]}</b>{r.last>0&&<Badge variant={r.delta>0?'emerald':r.delta<0?'rose':'slate'}>{r.delta>0?'+':''}{r.delta.toFixed(1)}</Badge>}</div><div className="mt-3 flex items-end gap-3"><span className="text-xs text-slate-500">Đầu: <b className="text-slate-800">{r.first?r.first.toFixed(1):'—'}</b></span><ArrowRightIcon className="h-4 w-4 text-slate-300"/><span className="text-xs text-slate-500">Gần nhất: <b className="text-slate-800">{r.last?r.last.toFixed(1):'—'}</b></span></div></div>)}</div>{weakest&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><b>Gợi ý có giải trình:</b> Trục {labels[weakest.axis]} hiện thấp nhất ({weakest.last.toFixed(1)}/4). Nên ưu tiên xem lại feedback và dẫn chứng liên quan đến trục này.</div>}</Card>

    <Card padding="lg"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Dòng thời gian feedback → sửa bài</h2><p className="text-xs text-slate-500">Click version để mở Visual Diff.</p></div><Button size="sm" variant="outline" onClick={()=>onNavigate('version-diff',{assignmentId})}>Mở Diff</Button></div><div className="space-y-3">{portfolio.versions.map(v=>{const linked=studentFeedback.filter(f=>f.versionNumber===v.versionNumber);return <div key={v.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{v.versionNumber}</b><span className="ml-2 text-xs text-slate-500">{new Date(v.createdAt).toLocaleString('vi-VN')}</span></div><Badge variant="blue">{linked.length} feedback</Badge></div><p className="mt-2 text-sm text-slate-600">{v.changeSummary||'Không có mô tả thay đổi.'}</p>{linked.map(f=><div key={f.id} className="mt-2 rounded-lg bg-slate-50 p-2 text-xs"><b>{f.authorRole==='ai'?'AI':f.authorName}:</b> {f.comment} {f.resolved&&<span className="font-semibold text-emerald-700">• Đã xử lý</span>}</div>)}</div>})}{portfolio.versions.length===0&&<p className="text-sm text-slate-500">Chưa có version đã nộp.</p>}</div></Card>
  </div>;
};
