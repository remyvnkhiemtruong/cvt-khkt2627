import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, PageHeader } from '../components/ui';
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <PageHeader
        title="Hàng đợi phản hồi AI"
        description="Quy trình kiểm duyệt và điều phối phản hồi AI cho bản thảo đầu tiên (V1) của học sinh."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="amber">Chờ xử lý: {reviews.filter(x=>x.status!=='completed').length}</Badge>
            <Badge variant="emerald">Hoàn thành: {reviews.filter(x=>x.status==='completed').length}</Badge>
          </div>
        }
      />

      {message&&<Alert type={message.type} title={message.type==='success'?'Đã cập nhật':'Có lỗi'}>{message.text}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-700">Hàng đợi bài nộp</span>
            <button onClick={()=>void refresh()} className="rounded p-1 hover:bg-slate-100 text-slate-500" title="Tải lại">
              <ArrowPathIcon className="h-3.5 w-3.5"/>
            </button>
          </div>
          <div className="max-h-[68vh] space-y-1.5 overflow-y-auto">
            {reviews.length===0 ? (
              <p className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Chưa có bài V1 chờ phản hồi.</p>
            ) : (
              reviews.map(item=>(
                <button
                  key={item.id}
                  onClick={()=>{setSelectedId(item.id);setResponse(item.response||'');setNote(item.teacher_note||'');}}
                  className={`w-full rounded-md border p-2.5 text-left transition-colors ${selected?.id===item.id?'border-indigo-400 bg-indigo-50/50':'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <b className="text-xs font-semibold text-slate-900 truncate">{item.student_name}</b>
                    <Badge variant={item.status==='completed'?'emerald':'amber'} size="sm">
                      {item.status==='completed'?'Đã phản hồi':'Chờ AI'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.assignment_id} • {item.version_number}</div>
                  {item.teacher_review_status!=='pending'&&(
                    <div className="mt-1 text-[11px] font-medium text-indigo-700">GV: {item.teacher_review_status}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="rounded-lg border border-slate-200 bg-white p-5">
          {!selected ? (
            <div className="py-20 text-center text-xs text-slate-500">Chọn một bài trong danh sách để xem.</div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-slate-900">{selected.student_name} — {selected.version_number}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected.assignment_id}</p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5">
                <span className="block font-semibold text-slate-700 mb-1">Yêu cầu nhiệm vụ:</span>
                <p className="text-slate-600">{selected.prompt}</p>
              </div>

              {(user.role==='ai'||user.role==='admin')&&(
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">Trục thi pháp chính
                    <select className="mt-1.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500" value={axisId} onChange={e=>setAxisId(e.target.value as PoeticAxisId)}>
                      {axes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">Nội dung phản hồi AI
                    <textarea className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs leading-5 text-slate-800 outline-none focus:border-indigo-500" rows={10} value={response} onChange={e=>setResponse(e.target.value)} placeholder="Nhập hoặc dán nội dung phản hồi định hướng cho học sinh..."/>
                  </label>
                  <Button size="sm" variant="primary" onClick={complete} isLoading={loading} disabled={!response.trim()} leftIcon={<SparklesIcon className="h-4 w-4"/>}>
                    Gửi phản hồi cho học sinh
                  </Button>
                </div>
              )}

              {(user.role==='teacher'||user.role==='admin')&&(
                <section className="rounded-md border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <AcademicCapIcon className="h-4 w-4 text-slate-600"/>
                    <span>Giáo viên kiểm duyệt phản hồi AI</span>
                  </div>
                  {selected.response ? (
                    <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800">
                      {selected.response}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">AI chưa có phản hồi cho bản nộp này.</p>
                  )}
                  <textarea
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-indigo-500"
                    rows={3}
                    value={note}
                    onChange={e=>setNote(e.target.value)}
                    placeholder="Ghi chú nhận xét của giáo viên..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" disabled={!selected.response} isLoading={loading} onClick={()=>review('approved')} leftIcon={<CheckCircleIcon className="h-4 w-4"/>}>
                      Duyệt
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!selected.response} onClick={()=>review('revised')}>
                      Yêu cầu sửa
                    </Button>
                    <Button size="sm" variant="outline" disabled={!selected.response} onClick={()=>review('rejected')}>
                      Từ chối
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
