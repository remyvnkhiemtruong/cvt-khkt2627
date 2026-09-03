import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { AcademicClass, PoeticAxisId } from '../types';
import { Alert, Badge, Button, Card, Input, PageHeader } from '../components/ui';
import { ArrowLeftIcon, CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { POETIC_AXES } from '../data/seedData';

interface AssignmentBuilderViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
async function post(payload:unknown){const r=await fetch('/api/academic/action',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.code||'Không thể tạo nhiệm vụ');return d;}

export const AssignmentBuilderView:React.FC<AssignmentBuilderViewProps>=({onNavigate})=>{
  const {literatureTexts,rubric,refreshAcademicData}=usePortfolio();
  const [classes,setClasses]=useState<AcademicClass[]>([]);const [title,setTitle]=useState('');const [textId,setTextId]=useState('');const [classId,setClassId]=useState('');const [deadline,setDeadline]=useState('');const [difficulty,setDifficulty]=useState<'Cơ bản'|'Nâng cao'|'Chuyên sâu'>('Nâng cao');const [prompt,setPrompt]=useState('');const [axes,setAxes]=useState<PoeticAxisId[]>(POETIC_AXES.map(x=>x.id));const [saving,setSaving]=useState(false);const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);
  useEffect(()=>{if(!textId&&literatureTexts[0])setTextId(literatureTexts[0].id);},[literatureTexts,textId]);
  useEffect(()=>{void fetch('/api/academic/snapshot',{credentials:'include'}).then(r=>r.json()).then(d=>{const cs=d.snapshot?.classes||[];setClasses(cs);if(!classId&&cs[0])setClassId(cs[0].code);});},[classId]);
  const toggle=(id:PoeticAxisId)=>setAxes(prev=>prev.includes(id)?(prev.length>1?prev.filter(x=>x!==id):prev):[...prev,id]);
  const publish=async()=>{if(!title.trim()||!textId||!classId){setMessage({type:'error',text:'Cần tên nhiệm vụ, lớp và tác phẩm.'});return;}setSaving(true);setMessage(null);try{const id=`assign-${Date.now()}`;await post({action:'create_assignment',id,title,textId,classId,rubricId:rubric.id,deadline:deadline||null,difficulty,targetAxes:axes,prompt,guidingSteps:['Đọc và xác định dẫn chứng','Phân tích theo các trục được chọn','Nộp V1 để nhận phản hồi AI','Chỉnh sửa sau phản hồi và nộp phiên bản tiếp theo']});await refreshAcademicData();setMessage({type:'success',text:'Đã xuất bản nhiệm vụ và tạo hồ sơ cho học sinh trong lớp.'});}catch(e:any){setMessage({type:'error',text:e.message});}finally{setSaving(false);}};

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
        </div>
        <PageHeader
          title="Tạo nhiệm vụ học tập"
          description="Thiết lập nhiệm vụ đọc hiểu, chọn trục thi pháp trọng tâm và giao cho lớp học."
        />
      </div>

      {message&&<Alert type={message.type} title={message.type==='success'?'Thành công':'Có lỗi'}>{message.text}</Alert>}

      <Card padding="md">
        <div className="mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Thông tin cơ bản</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên nhiệm vụ" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Phân tích Vợ nhặt theo 6 trục"/>
          <label className="text-xs font-semibold text-slate-700">Lớp học
            <select value={classId} onChange={e=>setClassId(e.target.value)} className="mt-1.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
              {classes.map(c=><option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">Tác phẩm
            <select value={textId} onChange={e=>setTextId(e.target.value)} className="mt-1.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
              {literatureTexts.map(t=><option key={t.id} value={t.id}>{t.title} — {t.author}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">Độ khó
            <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="mt-1.5 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
              <option>Cơ bản</option><option>Nâng cao</option><option>Chuyên sâu</option>
            </select>
          </label>
          <Input label="Hạn nộp" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs">
            <span className="font-semibold text-slate-700 block">Rubric áp dụng:</span>
            <div className="mt-0.5 text-slate-600 truncate">{rubric.title}</div>
            <Badge variant="blue" size="sm" className="mt-1.5">{rubric.id}</Badge>
          </div>
          <label className="md:col-span-2 text-xs font-semibold text-slate-700">Yêu cầu / đề bài
            <textarea rows={5} value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500" placeholder="Mô tả nhiệm vụ, yêu cầu dẫn chứng và cách lập luận..."/>
          </label>
        </div>
      </Card>

      <Card padding="md">
        <div className="mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Trục thi pháp trọng tâm</h2>
          <p className="mt-0.5 text-xs text-slate-500">Chọn các trục thi pháp học sinh cần thực hiện trong bài tập này</p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {POETIC_AXES.map(axis=>(
            <button
              key={axis.id}
              onClick={()=>toggle(axis.id)}
              className={`rounded-md border p-2.5 text-left transition-colors ${axes.includes(axis.id)?'border-indigo-300 bg-indigo-50/50':'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">{axis.shortName}</span>
                {axes.includes(axis.id)&&<CheckCircleIcon className="h-4 w-4 text-indigo-600"/>}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{axis.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={()=>onNavigate('teacher-dashboard')}>Hủy</Button>
        <Button variant="primary" size="sm" onClick={publish} isLoading={saving} leftIcon={<PlusCircleIcon className="h-4 w-4"/>}>Xuất bản nhiệm vụ</Button>
      </div>
    </div>
  );
};
