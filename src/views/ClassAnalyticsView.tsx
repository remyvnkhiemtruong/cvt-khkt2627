import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard, PageHeader } from '../components/ui';
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
const axisLabels:Record<PoeticAxisId,string>={plot_situation:'Tình huống',character_detail:'Nhân vật',narrator_pov:'Điểm nhìn',space_time:'Không-thời gian',language_tone_symbol:'Ngôn ngữ',form_argument:'Lập luận'};

export const ClassAnalyticsView:React.FC<ClassAnalyticsViewProps>=({onNavigate})=>{
  const {portfolios,rubricSubmissions,rubric,assignments}=usePortfolio();
  const list=useMemo(()=>Object.values(portfolios),[portfolios]);
  const classes=useMemo(()=>Array.from(new Set(list.map(p=>p.className).filter(Boolean))),[list]);
  const [classFilter,setClassFilter]=useState('all');
  const filtered=useMemo(()=>classFilter==='all'?list:list.filter(p=>p.className===classFilter),[list,classFilter]);
  const criterionAxis=useMemo(()=>Object.fromEntries(rubric.criteria.map(c=>[c.id,c.axisId])),[rubric]);
  const rows=useMemo(()=>filtered.map(p=>{const subs=rubricSubmissions.filter(s=>s.studentId===p.studentId&&s.assignmentId===p.assignmentId).sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime());const preferred=subs.find(s=>s.evaluatorRole==='teacher')||subs[0];const scores:Partial<Record<PoeticAxisId,number>>={};if(preferred)Object.entries(preferred.criterionScores).forEach(([criterion,value])=>{const axis=criterionAxis[criterion] as PoeticAxisId|undefined;if(axis)scores[axis]=Number(value.score||value.level||0);});const values=Object.values(scores).filter(v=>typeof v==='number') as number[];return{portfolio:p,submission:preferred,scores,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:0};}),[filtered,rubricSubmissions,criterionAxis]);
  const axes=Object.keys(axisLabels) as PoeticAxisId[];
  const axisAverages=useMemo(()=>Object.fromEntries(axes.map(axis=>{const vals=rows.map(r=>r.scores[axis]).filter((v):v is number=>typeof v==='number');return[axis,vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0];})),[rows]);
  const weakAxis=axes.slice().sort((a,b)=>Number(axisAverages[a])-Number(axisAverages[b]))[0];const scored=rows.filter(r=>r.average>0);const overall=scored.length?scored.reduce((a,b)=>a+b.average,0)/scored.length:0;const submitted=filtered.filter(p=>p.versions.length>0).length;
  const cell=(score:number|undefined)=>{if(!score)return'bg-slate-100 text-slate-400';if(score<2)return'bg-rose-50 text-rose-800 border border-rose-200';if(score<3)return'bg-amber-50 text-amber-800 border border-amber-200';if(score<3.6)return'bg-sky-50 text-sky-800 border border-sky-200';return'bg-emerald-50 text-emerald-800 border border-emerald-200';};

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
        </div>
        <PageHeader
          title="Phân tích năng lực lớp học"
          description="Tổng hợp kết quả đánh giá rubric theo 6 trục thi pháp và bảng ma trận tiến độ của học sinh."
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Lớp:</span>
              <select
                value={classFilter}
                onChange={e=>setClassFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
              >
                <option value="all">Tất cả lớp</option>
                {classes.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hồ sơ bài tập" value={String(filtered.length)} subValue="Trong phạm vi lọc" icon={<UserGroupIcon className="h-4 w-4"/>}/>
        <StatCard label="Đã nộp bài" value={`${submitted}/${filtered.length}`} subValue="Đã có bài nộp" icon={<DocumentTextIcon className="h-4 w-4"/>}/>
        <StatCard label="Điểm rubric TB" value={overall?overall.toFixed(2):'—'} subValue="Thang điểm 4" icon={<ChartBarIcon className="h-4 w-4"/>}/>
        <StatCard label="Trục cần hỗ trợ" value={weakAxis&&Number(axisAverages[weakAxis])?axisLabels[weakAxis]:'—'} subValue={weakAxis&&Number(axisAverages[weakAxis])?`TB: ${Number(axisAverages[weakAxis]).toFixed(2)}`: 'Chưa đủ dữ liệu'} icon={<ChartBarIcon className="h-4 w-4"/>}/>
      </section>

      <Card padding="md">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Bảng tổng hợp điểm 6 trục thi pháp</h2>
          <p className="mt-0.5 text-xs text-slate-500">Màu sắc thể hiện mức độ đạt chuẩn theo thang điểm rubric 4 mức.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="px-3 py-2.5 text-left font-semibold">Học sinh / Nhiệm vụ</th>
                {axes.map(a=><th key={a} className="px-2 py-2.5 text-center font-semibold">{axisLabels[a]}</th>)}
                <th className="px-3 py-2.5 text-center font-semibold">TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r=>(
                <tr key={r.portfolio.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-2.5">
                    <button className="text-left" onClick={()=>onNavigate('teacher-review',{studentId:r.portfolio.studentId,assignmentId:r.portfolio.assignmentId})}>
                      <b className="block text-slate-900 hover:text-indigo-600 transition-colors">{r.portfolio.studentName}</b>
                      <span className="text-xs text-slate-500">{r.portfolio.className} • {assignments.find(a=>a.id===r.portfolio.assignmentId)?.title||r.portfolio.assignmentId}</span>
                    </button>
                  </td>
                  {axes.map(a=>(
                    <td key={a} className="px-2 py-2 text-center">
                      <span className={`inline-flex min-w-8 justify-center rounded px-1.5 py-0.5 text-xs font-semibold ${cell(r.scores[a])}`}>
                        {r.scores[a]?.toFixed(1)||'—'}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-900">{r.average?r.average.toFixed(2):'—'}</td>
                </tr>
              ))}
              {rows.length===0&&<tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-500">Chưa có hồ sơ trong phạm vi lọc.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs border-t border-slate-100 pt-3">
          <Badge variant="rose">&lt; 2.0 Cần hỗ trợ</Badge>
          <Badge variant="amber">2.0–2.9 Đạt cơ bản</Badge>
          <Badge variant="blue">3.0–3.5 Khá</Badge>
          <Badge variant="emerald">≥ 3.6 Xuất sắc</Badge>
        </div>
      </Card>
    </div>
  );
};
