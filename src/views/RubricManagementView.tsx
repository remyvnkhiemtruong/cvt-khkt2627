import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { RubricCriterion } from '../types';
import { Alert, Badge, Button, Card, Input, PageHeader } from '../components/ui';
import { ArrowLeftIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface RubricManagementViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
async function saveCatalog(payload:unknown){const r=await fetch('/api/academic/catalog',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.code||'Không thể lưu rubric');return d;}

export const RubricManagementView:React.FC<RubricManagementViewProps>=({onNavigate})=>{
  const {rubric,refreshAcademicData}=usePortfolio();
  const [title,setTitle]=useState(rubric.title);const [description,setDescription]=useState('Rubric 4 mức đánh giá năng lực đọc hiểu theo 6 trục thi pháp.');const [criteria,setCriteria]=useState<RubricCriterion[]>(rubric.criteria);const [saving,setSaving]=useState(false);const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);
  useEffect(()=>{setTitle(rubric.title);setCriteria(rubric.criteria);},[rubric]);
  const updateDescription=(criterionIndex:number,levelIndex:number,value:string)=>setCriteria(prev=>prev.map((c,i)=>i!==criterionIndex?c:{...c,levels:c.levels.map((l,j)=>j!==levelIndex?l:{...l,description:value})}));
  const saveVersion=async()=>{setSaving(true);setMessage(null);try{const d=await saveCatalog({action:'create_rubric_version',title,description,criteria});setMessage({type:'success',text:`Đã tạo phiên bản Rubric mới ${d.id}. Rubric cũ vẫn được giữ nguyên cho các bài đã chấm.`});await refreshAcademicData();}catch(e:any){setMessage({type:'error',text:e.message});}finally{setSaving(false);}};

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
        </div>
        <PageHeader
          title="Ma trận đánh giá Rubric"
          description="Quản lý tiêu chí đánh giá năng lực theo 6 trục thi pháp và các mức độ đạt chuẩn."
          actions={<Badge variant="emerald">{rubric.id}</Badge>}
        />
      </div>

      {message&&<Alert type={message.type} title={message.type==='success'?'Đã lưu':'Có lỗi'}>{message.text}</Alert>}

      <Card padding="md">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên rubric phiên bản mới" value={title} onChange={e=>setTitle(e.target.value)}/>
          <label className="text-xs font-semibold text-slate-700">Mô tả ma trận
            <textarea className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none focus:border-indigo-500" rows={3} value={description} onChange={e=>setDescription(e.target.value)}/>
          </label>
        </div>
      </Card>

      <div className="space-y-4">
        {criteria.map((criterion,ci)=>(
          <Card key={criterion.id} padding="md">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-xs font-medium text-slate-500">Trục {ci+1}</span>
                <h2 className="text-sm font-semibold text-slate-900 mt-0.5">{criterion.title}</h2>
              </div>
              <Badge variant="blue" size="sm">Trọng số {criterion.weight}</Badge>
            </div>
            <div className="grid gap-2.5 lg:grid-cols-4">
              {criterion.levels.map((level,li)=>(
                <label key={level.level} className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <div className="mb-1.5 flex items-center justify-between font-semibold text-slate-800">
                    <span>Mức {level.level}: {level.label}</span>
                    <span className="text-slate-500">{level.score}đ</span>
                  </div>
                  <textarea
                    value={level.description}
                    onChange={e=>updateDescription(ci,li,e.target.value)}
                    rows={4}
                    className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-normal leading-5 text-slate-800 outline-none focus:border-indigo-500"
                  />
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheckIcon className="h-4 w-4 text-slate-400"/>
          <span>Điểm rubric đã nộp không bị ảnh hưởng khi tạo phiên bản rubric mới.</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={saveVersion}
          isLoading={saving}
          disabled={!criteria.length||!title.trim()}
          leftIcon={<CheckCircleIcon className="h-4 w-4"/>}
        >
          Lưu phiên bản Rubric mới
        </Button>
      </div>
    </div>
  );
};
