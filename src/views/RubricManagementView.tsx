import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { RubricCriterion } from '../types';
import { Alert, Badge, Button, Card, Input } from '../components/ui';
import { ArrowLeftIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface RubricManagementViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
async function saveCatalog(payload:unknown){const r=await fetch('/api/academic/catalog',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.code||'Không thể lưu rubric');return d;}

export const RubricManagementView:React.FC<RubricManagementViewProps>=({onNavigate})=>{
  const {rubric,refreshAcademicData}=usePortfolio();
  const [title,setTitle]=useState(rubric.title);const [description,setDescription]=useState('Rubric 4 mức đánh giá năng lực đọc hiểu theo 6 trục thi pháp.');const [criteria,setCriteria]=useState<RubricCriterion[]>(rubric.criteria);const [saving,setSaving]=useState(false);const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);
  useEffect(()=>{setTitle(rubric.title);setCriteria(rubric.criteria);},[rubric]);
  const updateDescription=(criterionIndex:number,levelIndex:number,value:string)=>setCriteria(prev=>prev.map((c,i)=>i!==criterionIndex?c:{...c,levels:c.levels.map((l,j)=>j!==levelIndex?l:{...l,description:value})}));
  const saveVersion=async()=>{setSaving(true);setMessage(null);try{const d=await saveCatalog({action:'create_rubric_version',title,description,criteria});setMessage({type:'success',text:`Đã tạo phiên bản Rubric mới ${d.id}. Rubric cũ vẫn được giữ nguyên cho các bài đã chấm.`});await refreshAcademicData();}catch(e:any){setMessage({type:'error',text:e.message});}finally{setSaving(false);}};
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <header className="rounded-2xl border bg-white p-5 sm:p-6"><Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Bàn giáo viên</Button><div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700"><ShieldCheckIcon className="h-4 w-4"/>Versioned Rubric</div><h1 className="mt-1 text-2xl font-bold">Ma trận đánh giá 6 trục</h1><p className="mt-2 text-sm text-slate-600">Mỗi lần lưu tạo một Rubric version mới; assignment cũ tiếp tục trỏ vào rubric cũ để bảo toàn tính nghiên cứu.</p></div><Badge variant="emerald">{rubric.id}</Badge></div></header>
    {message&&<Alert type={message.type} title={message.type==='success'?'Đã lưu':'Có lỗi'}>{message.text}</Alert>}
    <Card padding="lg"><div className="grid gap-4 md:grid-cols-2"><Input label="Tên rubric phiên bản mới" value={title} onChange={e=>setTitle(e.target.value)}/><label className="text-sm font-semibold">Mô tả<textarea className="mt-2 w-full rounded-xl border p-3" rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></label></div></Card>
    <div className="space-y-4">{criteria.map((criterion,ci)=><Card key={criterion.id} padding="lg"><div className="mb-4 flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase text-indigo-700">Trục {ci+1}</div><h2 className="font-bold">{criterion.title}</h2></div><Badge variant="blue">Trọng số {criterion.weight}</Badge></div><div className="grid gap-3 lg:grid-cols-4">{criterion.levels.map((level,li)=><label key={level.level} className="rounded-xl border bg-slate-50 p-3 text-xs font-semibold"><div className="mb-2 flex items-center justify-between"><span>{level.level}. {level.label}</span><span>{level.score}đ</span></div><textarea value={level.description} onChange={e=>updateDescription(ci,li,e.target.value)} rows={5} className="w-full rounded-lg border bg-white p-2 text-xs font-normal leading-5"/></label>)}</div></Card>)}</div>
    <div className="sticky bottom-3 flex justify-end"><Button onClick={saveVersion} isLoading={saving} disabled={!criteria.length||!title.trim()} leftIcon={<SparklesIcon className="h-4 w-4"/>}>Tạo phiên bản Rubric mới</Button></div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex items-center gap-2 font-bold"><CheckCircleIcon className="h-5 w-5"/>Bảo toàn lịch sử</div><p className="mt-1">Điểm rubric đã nộp không bị thay đổi khi giáo viên tạo rubric mới.</p></div>
  </div>;
};
