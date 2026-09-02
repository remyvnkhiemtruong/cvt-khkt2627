import React, { useEffect, useState } from 'react';
import { Button, Input, Alert } from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import { ClipboardDocumentIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

type Note = { id:string; title:string; prompt:string; answer:string; created_at:string; updated_at:string };

export const AiWorkspaceView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [title,setTitle]=useState(''); const [prompt,setPrompt]=useState(''); const [answer,setAnswer]=useState('');
  const [notes,setNotes]=useState<Note[]>([]); const [loading,setLoading]=useState(false); const [message,setMessage]=useState<string|null>(null);
  useEffect(()=>{fetch('/api/ai/notes',{credentials:'include'}).then(r=>r.ok?r.json():null).then(d=>d?.notes&&setNotes(d.notes)).catch(()=>{});},[]);
  const save=async()=>{setLoading(true);setMessage(null);try{const r=await fetch('/api/ai/notes',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({title:title||'Ghi chú AI',prompt,answer})});const d=await r.json();if(!r.ok)throw new Error(d.message||'Không thể lưu');setNotes(n=>[d.note,...n]);setTitle('');setPrompt('');setAnswer('');setMessage('Đã lưu vào tài khoản AI');}catch(e:any){setMessage(e.message)}finally{setLoading(false)}};
  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800"><SparklesIcon className="h-4 w-4"/>TÀI KHOẢN AI</div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Kho câu trả lời AI</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tra cứu AI bên ngoài theo cách bạn muốn, sau đó dán câu hỏi và câu trả lời vào đây để lưu thành minh chứng chính thức.</p></div>
      <div className="rounded-xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm"><div className="font-semibold text-slate-900">{currentUser.name || 'AI'}</div><div>{currentUser.email || 'ai@cvt.edu.vn'}</div></div>
    </div>
    {message&&<Alert type={message.startsWith('Đã')?'success':'error'} title={message.startsWith('Đã')?'Đã lưu':'Chưa lưu'}>{message}</Alert>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Lưu phiên tra cứu mới</h2><p className="mt-1 text-sm text-slate-500">Dán nguyên văn câu trả lời để giữ lại nguồn tham khảo và bối cảnh.</p><div className="mt-5 space-y-4"><Input label="Tiêu đề" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ví dụ: Gợi ý phân tích điểm nhìn" /><label className="block text-sm font-semibold text-slate-700">Câu hỏi đã tra AI<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Dán câu hỏi hoặc prompt đã dùng..." /></label><label className="block text-sm font-semibold text-slate-700">Câu trả lời AI<textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={12} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Dán câu trả lời AI tại đây..." /></label><Button onClick={save} isLoading={loading} leftIcon={<ClipboardDocumentIcon className="h-4 w-4"/>}>Lưu vào tài khoản AI</Button></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Lịch sử đã lưu</h2><div className="mt-4 space-y-3">{notes.length===0?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có ghi chú nào. Hãy lưu phiên đầu tiên.</p>:notes.map(note=><button key={note.id} type="button" onClick={()=>{setTitle(note.title);setPrompt(note.prompt);setAnswer(note.answer)}} className="block w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"><div className="flex items-start justify-between gap-3"><span className="font-semibold text-slate-900">{note.title}</span><CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600"/></div><p className="mt-1 line-clamp-3 text-sm text-slate-600">{note.answer}</p><time className="mt-2 block text-xs text-slate-400">{new Date(note.updated_at).toLocaleString('vi-VN')}</time></button>)}</div></section>
    </div>
  </div>;
};
