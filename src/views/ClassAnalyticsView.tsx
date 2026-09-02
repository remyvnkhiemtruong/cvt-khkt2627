import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard } from '../components/ui';
import { ChartBarIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
const axisLabels:Record<PoeticAxisId,string>={plot_situation:'Tình huống',character_detail:'Nhân vật',narrator_pov:'Điểm nhìn',space_time:'Không-thời gian',language_tone_symbol:'Ngôn ngữ',form_argument:'Lập luận'};

export const ClassAnalyticsView:React.FC<ClassAnalyticsViewProps>=({onNavigate})=>{
  const {portfolios,rubricSubmissions,rubric,assignments}=usePortfolio();
  const list=useMemo(()=>Object.values(portfolios),[portfolios]);
  const classes=useMemo(()=>Array.from(new Set(list.map(p=>p.className).filter(Boolean))),[list]);
  const [classFilter,setClassFilter]=useState('all');
  const filtered=useMemo(()=>classFilter==='all'?list:list.filter(p=>p.className===classFilter),[list,classFilter]);
  const criterionAxis=useMemo(()=>Object.fromEntries(rubric.criteria.map(c=>[c.id,c.axisId])),[rubric]);

  const rows=useMemo(()=>filtered.map(p=>{
    const subs=rubricSubmissions.filter(s=>s.studentId===p.studentId&&s.assignmentId===p.assignmentId).sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime());
    const preferred=subs.find(s=>s.evaluatorRole==='teacher')||subs[0];
    const scores:Partial<Record<PoeticAxisId,number>>={};
    if(preferred) Object.entries(preferred.criterionScores).forEach(([criterion,value])=>{const axis=criterionAxis[criterion] as PoeticAxisId|undefined;if(axis)scores[axis]=Number(value.score||value.level||0);});
    const values=Object.values(scores).filter(v=>typeof v==='number') as number[];
    return {portfolio:p,submission:preferred,scores,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:0};
  }),[filtered,rubricSubmissions,criterionAxis]);

  const axes=Object.keys(axisLabels) as PoeticAxisId[];
  const axisAverages=useMemo(()=>Object.fromEntries(axes.map(axis=>{const vals=rows.map(r=>r.scores[axis]).filter((v):v is number=>typeof v==='number');return[axis,vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0];})),[rows]);
  const weakAxis=axes.slice().sort((a,b)=>Number(axisAverages[a])-Number(axisAverages[b]))[0];
  const scored=rows.filter(r=>r.average>0);
  const overall=scored.length?scored.reduce((a,b)=>a+b.average,0)/scored.length:0;
  const submitted=filtered.filter(p=>p.versions.length>0).length;

  const cell=(score:number|undefined)=>{if(!score)return 'bg-slate-100 text-slate-400';if(score<2)return 'bg-rose-100 text-rose-800';if(score<3)return 'bg-amber-100 text-amber-800';if(score<3.6)return 'bg-sky-100 text-sky-800';return 'bg-emerald-100 text-emerald-800';};

  return <div className="mx-auto max-w-7xl space-y-6 pb-16">
    <header className="rounded-2xl border bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Analytics từ PostgreSQL</div><h1 className="mt-1 text-2xl font-bold">Phân tích năng lực toàn lớp</h1><p className="mt-2 text-sm text-slate-600">Mỗi ô heatmap lấy từ rubric submission thật; click học sinh để mở đúng hồ sơ/version.</p></div><select value={classFilter} onChange={e=>setClassFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="all">Tất cả lớp</option>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select></div></header>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Hồ sơ" value={String(filtered.length)} subValue="Trong phạm vi lọc" icon={<UserGroupIcon className="h-5 w-5"/>}/><StatCard label="Đã nộp version" value={`${submitted}/${filtered.length}`} subValue="Có snapshot bất biến" icon={<DocumentTextIcon className="h-5 w-5"/>}/><StatCard label="Điểm rubric TB" value={overall?overall.toFixed(2):'—'} subValue="Thang 4" icon={<ChartBarIcon className="h-5 w-5"/>}/><StatCard label="Trục cần hỗ trợ" value={weakAxis&&Number(axisAverages[weakAxis])?axisLabels[weakAxis]:'—'} subValue={weakAxis&&Number(axisAverages[weakAxis])?Number(axisAverages[weakAxis]).toFixed(2):'Chưa đủ dữ liệu'} icon={<ChartBarIcon className="h-5 w-5"/>}/></section>

    <Card padding="lg"><div className="mb-4"><h2 className="font-bold">Heatmap 6 trục thi pháp</h2><p className="mt-1 text-xs text-slate-500">— = chưa có rubric submission. Màu chỉ hỗ trợ nhìn nhanh; điểm số luôn hiển thị bằng số.</p></div><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-xs"><thead><tr className="border-b bg-slate-50"><th className="px-3 py-3 text-left">Học sinh / nhiệm vụ</th>{axes.map(a=><th key={a} className="px-2 py-3 text-center">{axisLabels[a]}</th>)}<th className="px-3 py-3 text-center">TB</th></tr></thead><tbody>{rows.map(r=><tr key={r.portfolio.id} className="border-b hover:bg-slate-50"><td className="px-3 py-3"><button className="text-left" onClick={()=>onNavigate('teacher-review',{studentId:r.portfolio.studentId,assignmentId:r.portfolio.assignmentId})}><b className="block text-slate-900">{r.portfolio.studentName}</b><span className="text-slate-500">{r.portfolio.className} • {assignments.find(a=>a.id===r.portfolio.assignmentId)?.title||r.portfolio.assignmentId}</span></button></td>{axes.map(a=><td key={a} className="px-2 py-2 text-center"><span className={`inline-flex min-w-10 justify-center rounded-lg px-2 py-1 font-bold ${cell(r.scores[a])}`}>{r.scores[a]?.toFixed(1)||'—'}</span></td>)}<td className="px-3 py-3 text-center font-bold">{r.average?r.average.toFixed(2):'—'}</td></tr>)}{rows.length===0&&<tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Chưa có hồ sơ trong phạm vi lọc.</td></tr>}</tbody></table></div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><Badge variant="rose">&lt; 2.0 cần hỗ trợ</Badge><Badge variant="amber">2.0–2.9 đạt cơ bản</Badge><Badge variant="blue">3.0–3.5 khá</Badge><Badge variant="emerald">≥ 3.6 nổi bật</Badge></div>
    </Card>
  </div>;
};
