import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button } from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import type { AcademicSnapshot, AiReviewRequest, PoeticAxisId } from '../types';
import { AcademicCapIcon, ArrowPathIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const axes: {id:PoeticAxisId;label:string}[] = [
  {id:'plot_situation',label:'Tình huống – Cốt truyện'}, {id:'character_detail',label:'Nhân vật – Chi tiết'},
  {id:'narrator_pov',label:'Người kể chuyện – Điểm nhìn'}, {id:'space_time',label:'Không gian – Thời gian'},
  {id:'language_tone_symbol',label:'Ngôn ngữ – Giọng điệu – Biểu tượng'}, {id:'form_argument',label:'Tổng hợp & Lập luận'}
];

async function action(payload:unknown){
  const r=await fetch('/api/academic/action',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||d.code||'Không thể cập nhật'); return d;
}

export const AiWorkspaceView:React.FC=()=>{
  const user=useAuthStore(s=>s.currentUser);
  const [snapshot,setSnapshot]=useState<AcademicSnapshot|null>(null);
  const [selectedId,setSelectedId]=useState('');
  const [response,setResponse]=useState('');
  const [axisId,setAxisId]=useState<PoeticAxisId>('form_argument');
  const [note,setNote]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);

  const refresh=useCallback(async()=>{const r=await fetch('/api/academic/snapshot',{credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.message||'Không thể tải hàng đợi');setSnapshot(d.snapshot);},[]);
  useEffect(()=>{void refresh().catch(e=>setMessage({type:'error',text:e.message}));},[refresh]);
  const reviews=useMemo<AiReviewRequest[]>(()=>snapshot?.aiReviews||[],[snapshot]);
  const selected=reviews.find(x=>x.id===selectedId)||reviews[0]||null;
  useEffect(()=>{if(selected&&selected.id!==selectedId){setSelectedId(selected.id);setResponse(selected.response||'');setNote(selected.teacher_note||'');}},[selected,selectedId]);

  const complete=async()=>{if(!selected)return;setLoading(true);setMessage(null);try{await action({action:'ai_complete_review',reviewId:selected.id,response,axisId});setMessage({type:'success',text:'Đã gửi phản hồi AI cho học sinh.'});await refresh();}catch(e:any){setMessage({type:'error',text:e.message});}finally{setLoading(false);}};
  const review=async(status:'approved'|'revised'|'rejected')=>{if(!selected)return;setLoading(true);setMessage(null);try{await action({action:'teacher_review_ai',reviewId:selected.id,status,note});setMessage({type:'success',text:'Đã lưu quyết định của giáo viên.'});await refresh();}catch(e:any){setMessage({type:'error',text:e.message});}finally{setLoading(false);}};

  return <div className="mx-auto max-w-7xl space-y-5">
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800"><SparklesIcon className="h-4 w-4"/>AI REVIEW QUEUE</div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Học sinh → AI → Giáo viên</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Khi học sinh nộp V1, bài tự vào hàng đợi. Hiện tại tài khoản AI dán phản hồi thủ công; giáo viên duyệt, yêu cầu sửa hoặc từ chối.</p></div><div className="flex gap-2"><Badge variant="amber">Chờ: {reviews.filter(x=>x.status!=='completed').length}</Badge><Badge variant="emerald">Xong: {reviews.filter(x=>x.status==='completed').length}</Badge></div></div>
    </section>
    {message&&<Alert type={message.type} title={message.type==='success'?'Đã cập nhật':'Có lỗi'}>{message.text}</Alert>}
    <div className="grid gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="rounded-2xl border bg-white p-3"><div className="mb-2 flex items-center justify-between px-2"><b>Hàng đợi</b><button onClick={()=>void refresh()} className="rounded-lg p-2 hover:bg-slate-100"><ArrowPathIcon className="h-4 w-4"/></button></div><div className="max-h-[68vh] space-y-2 overflow-y-auto">{reviews.length===0?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có V1 chờ phản hồi.</p>:reviews.map(item=><button key={item.id} onClick={()=>{setSelectedId(item.id);setResponse(item.response||'');setNote(item.teacher_note||'');}} className={`w-full rounded-xl border p-3 text-left ${selected?.id===item.id?'border-indigo-400 bg-indigo-50':'border-slate-200 hover:bg-slate-50'}`}><div className="flex justify-between gap-2"><b className="text-sm">{item.student_name}</b><Badge variant={item.status==='completed'?'emerald':'amber'}>{item.status==='completed'?'Đã phản hồi':'Chờ AI'}</Badge></div><div className="mt-1 text-xs text-slate-500">{item.assignment_id} • {item.version_number}</div>{item.teacher_review_status!=='pending'&&<div className="mt-1 text-[11px] font-semibold text-indigo-700">GV: {item.teacher_review_status}</div>}</button>)}</div></aside>
      <main className="rounded-2xl border bg-white p-5 sm:p-6">{!selected?<div className="py-20 text-center text-sm text-slate-500">Chọn một bài.</div>:<div className="space-y-5"><div className="border-b pb-4"><h2 className="text-lg font-bold">{selected.student_name} — {selected.version_number}</h2><p className="text-sm text-slate-500">{selected.assignment_id}</p></div><div className="rounded-xl bg-slate-50 p-4 text-sm leading-6"><b className="block text-xs uppercase text-slate-500">Prompt</b>{selected.prompt}</div>
        {(user.role==='ai'||user.role==='admin')&&<><label className="block text-sm font-semibold">Trục chính<select className="mt-2 w-full rounded-xl border p-3" value={axisId} onChange={e=>setAxisId(e.target.value as PoeticAxisId)}>{axes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label className="block text-sm font-semibold">Phản hồi AI<textarea className="mt-2 w-full rounded-xl border p-3 text-sm leading-6" rows={14} value={response} onChange={e=>setResponse(e.target.value)} placeholder="Dán phản hồi AI tại đây..."/></label><Button onClick={complete} isLoading={loading} disabled={!response.trim()} leftIcon={<SparklesIcon className="h-4 w-4"/>}>Gửi cho học sinh</Button></>}
        {(user.role==='teacher'||user.role==='admin')&&<section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"><div className="mb-3 flex items-center gap-2 font-bold"><AcademicCapIcon className="h-5 w-5"/>Giáo viên duyệt AI</div>{selected.response?<div className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6">{selected.response}</div>:<p className="mb-3 text-sm text-slate-500">AI chưa phản hồi.</p>}<textarea className="w-full rounded-xl border bg-white p-3 text-sm" rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ghi chú giáo viên..."/><div className="mt-3 flex flex-wrap gap-2"><Button disabled={!selected.response} isLoading={loading} onClick={()=>review('approved')} leftIcon={<CheckCircleIcon className="h-4 w-4"/>}>Duyệt</Button><Button variant="secondary" disabled={!selected.response} onClick={()=>review('revised')}>Yêu cầu sửa</Button><Button variant="outline" disabled={!selected.response} onClick={()=>review('rejected')}>Từ chối</Button></div></section>}
      </div>}</main>
    </div>
  </div>;
};
