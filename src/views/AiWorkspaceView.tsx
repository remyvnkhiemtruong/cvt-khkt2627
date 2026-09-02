import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Alert, Badge } from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import type { AcademicSnapshot, AiReviewRequest, PoeticAxisId } from '../types';
import { CheckCircleIcon, SparklesIcon, ArrowPathIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const axisOptions: { id: PoeticAxisId; label: string }[] = [
  { id:'plot_situation', label:'Tình huống – Cốt truyện' },
  { id:'character_detail', label:'Nhân vật – Chi tiết nghệ thuật' },
  { id:'narrator_pov', label:'Người kể chuyện – Điểm nhìn' },
  { id:'space_time', label:'Không gian – Thời gian' },
  { id:'language_tone_symbol', label:'Ngôn ngữ – Giọng điệu – Biểu tượng' },
  { id:'form_argument', label:'Tổng hợp & Lập luận' }
];

async function postAction(payload: unknown) {
  const response = await fetch('/api/academic/action', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(data.message || data.code || 'Không thể cập nhật');
  return data;
}

export const AiWorkspaceView: React.FC = () => {
  const currentUser = useAuthStore(state => state.currentUser);
  const [snapshot,setSnapshot]=useState<AcademicSnapshot|null>(null);
  const [selectedId,setSelectedId]=useState('');
  const [response,setResponse]=useState('');
  const [axisId,setAxisId]=useState<PoeticAxisId>('form_argument');
  const [teacherNote,setTeacherNote]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);

  const refresh=useCallback(async()=>{
    const r=await fetch('/api/academic/snapshot',{credentials:'include'}); const d=await r.json();
    if(!r.ok) throw new Error(d.message||'Không thể tải hàng đợi AI');
    setSnapshot(d.snapshot);
  },[]);

  useEffect(()=>{void refresh().catch(error=>setMessage({type:'error',text:error.message}));},[refresh]);

  const reviews=useMemo(()=>snapshot?.aiReviews||[],[snapshot]);
  const selected=reviews.find(item=>item.id===selectedId) || reviews[0] || null;
  useEffect(()=>{if(selected && selected.id!==selectedId){setSelectedId(selected.id);setResponse(selected.response||'');setTeacherNote(selected.teacher_note||'');}},[selected,selectedId]);

  const submitAi=async()=>{
    if(!selected) return; setLoading(true);setMessage(null);
    try { await postAction({action:'ai_complete_review',reviewId:selected.id,response,axisId}); setMessage({type:'success',text:'Đã gửi phản hồi AI cho học sinh.'}); await refresh(); }
    catch(error:any){setMessage({type:'error',text:error.message});} finally{setLoading(false);}
  };

  const teacherReview=async(status:'approved'|'revised'|'rejected')=>{
    if(!selected) return; setLoading(true);setMessage(null);
    try { await postAction({action:'teacher_review_ai',reviewId:selected.id,status,note:teacherNote}); setMessage({type:'success',text:'Đã ghi nhận quyết định của giáo viên.'}); await refresh(); }
    catch(error:any){setMessage({type:'error',text:error.message});} finally{setLoading(false);}
  };

  const pending=reviews.filter(item=>item.status==='pending'||item.status==='in_progress').length;
  const completed=reviews.filter(item=>item.status==='completed').length;

  return <div className="mx-auto w-full max-w-7xl space-y-5">
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800"><SparklesIcon className="h-4 w-4"/>AI REVIEW QUEUE</div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Phản hồi AI theo phiên bản học sinh</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">V1 của học sinh tự động vào hàng đợi. Giai đoạn hiện tại bạn tra AI bên ngoài rồi dán phản hồi tại đây; giáo viên có thể duyệt, sửa hoặc từ chối phản hồi trước khi dùng làm minh chứng.</p></div>
        <div className="grid grid-cols-2 gap-2 text-center"><div className="rounded-xl border bg-white px-4 py-3"><div className="text-xl font-bold text-amber-700">{pending}</div><div className="text-xs text-slate-500">Đang chờ</div></div><div className="rounded-xl border bg-white px-4 py-3"><div className="text-xl font-bold text-emerald-700">{completed}</div><div className="text-xs text-slate-500">Đã phản hồi</div></div></div>
      </div>
    </section>

    {message&&<Alert type={message.type} title={message.type==='success'?'Đã cập nhật':'Có lỗi'}>{message.text}</Alert>}

    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between px-2 py-2"><h2 className="font-bold text-slate-900">Danh sách bài</h2><button onClick={()=>void refresh()} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Làm mới"><ArrowPathIcon className="h-4 w-4"/></button></div>
        <div className="max-h-[68vh] space-y-2 overflow-y-auto">{reviews.length===0?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có bài nào trong hàng đợi. Khi học sinh nộp V1, yêu cầu sẽ xuất hiện tại đây.</p>:reviews.map(item=><button key={item.id} onClick={()=>{setSelectedId(item.id);setResponse(item.response||'');setTeacherNote(item.teacher_note||'');}} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id===item.id?'border-indigo-400 bg-indigo-50':'border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900">{item.student_name}</span><Badge variant={item.status==='completed'?'emerald':'amber'}>{item.status==='completed'?'Đã phản hồi':'Chờ AI'}</Badge></div>
          <div className="mt-1 text-xs text-slate-500">{item.assignment_id} • {item.version_number}</div>
          {item.teacher_review_status!=='pending'&&<div className="mt-2 text-[11px] font-semibold text-indigo-700">GV: {item.teacher_review_status}</div>}
        </button>)}</div>
      </aside>

      <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {!selected?<div className="py-16 text-center text-sm text-slate-500">Chọn một bài trong hàng đợi.</div>:<div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 className="text-lg font-bold text-slate-900">{selected.student_name} — {selected.version_number}</h2><p className="text-sm text-slate-500">Nhiệm vụ: {selected.assignment_id}</p></div><Badge variant={selected.status==='completed'?'emerald':'amber'}>{selected.status}</Badge></div>
          <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Prompt chuẩn</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.prompt}</p></div>

          {currentUser.role==='ai'||currentUser.role==='admin'?<>
            <label className="block text-sm font-semibold text-slate-700">Trục phản hồi chính<select value={axisId} onChange={e=>setAxisId(e.target.value as PoeticAxisId)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm">{axisOptions.map(axis=><option key={axis.id} value={axis.id}>{axis.label}</option>)}</select></label>
            <label className="block text-sm font-semibold text-slate-700">Phản hồi AI<textarea rows={14} value={response} onChange={e=>setResponse(e.target.value)} placeholder="Dán phản hồi AI đã tra cứu tại đây..." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label>
            <Button onClick={submitAi} isLoading={loading} disabled={!response.trim()} leftIcon={<SparklesIcon className="h-4 w-4"/>}>Gửi phản hồi cho học sinh</Button>
          </>:null}

          {currentUser.role==='teacher'||currentUser.role==='admin'?<section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="mb-3 flex items-center gap-2 font-bold text-indigo-950"><AcademicCapIcon className="h-5 w-5"/>Duyệt phản hồi AI của giáo viên</div>
            {selected.response?<div className="mb-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6 text-slate-700">{selected.response}</div>:<p className="mb-4 text-sm text-slate-500">AI chưa gửi phản hồi cho bài này.</p>}
            <textarea rows={4} value={teacherNote} onChange={e=>setTeacherNote(e.target.value)} placeholder="Ghi chú của giáo viên (nếu có)..." className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"/>
            <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" disabled={!selected.response} isLoading={loading} onClick={()=>teacherReview('approved')} leftIcon={<CheckCircleIcon className="h-4 w-4"/>}>Duyệt</Button><Button variant="secondary" disabled={!selected.response} onClick={()=>teacherReview('revised')}>Yêu cầu chỉnh</Button><Button variant="outline" disabled={!selected.response} onClick={()=>teacherReview('rejected')}>Từ chối</Button></div>
          </section>:null}
        </div>}
      </main>
    </div>
  </div>;
};
