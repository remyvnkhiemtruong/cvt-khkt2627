import React, { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { AcademicClass, PoeticAxisId } from '../types';
import { Alert, Button } from '../components/ui';
import { POETIC_AXES } from '../data/seedData';

interface Props { onNavigate: (view: string, params?: any) => void; }

async function post(payload: unknown) {
  const r = await fetch('/api/academic/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || d.code || 'Không thể tạo nhiệm vụ');
  return d;
}

export const AssignmentBuilderView: React.FC<Props> = ({ onNavigate }) => {
  const { literatureTexts, rubric, rubrics, refreshAcademicData } = usePortfolio();
  const texts = useMemo(() => literatureTexts.filter(t => t.isLatest !== false), [literatureTexts]);
  const rubricOptions = useMemo(() => Object.values(rubrics || {}), [rubrics]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', classId: '', textId: '', rubricId: '', deadline: '', prompt: '', difficulty: 'Nâng cao' });
  const [axes, setAxes] = useState<PoeticAxisId[]>(POETIC_AXES.map(a => a.id));
  const [predictionEnabled, setPredictionEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { void fetch('/api/academic/snapshot', { credentials: 'include', cache: 'no-store' }).then(r => r.json()).then(d => { const cs = d.snapshot?.classes || []; setClasses(cs); setForm(f => ({ ...f, classId: f.classId || cs[0]?.code || '', textId: f.textId || texts[0]?.id || '', rubricId: f.rubricId || rubricOptions[0]?.id || rubric.id || '' })); }); }, [texts, rubricOptions, rubric.id]);
  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const toggleAxis = (id: PoeticAxisId) => setAxes(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]);
  const publish = async () => {
    if (!form.title.trim() || !form.classId || !form.textId || !form.rubricId) { setMessage('Thiếu tên nhiệm vụ, lớp, tác phẩm hoặc rubric.'); return; }
    const textId = form.textId;
    const rubricId = form.rubricId;
    setSaving(true); setMessage('');
    try {
      await post({
        action: 'create_assignment',
        title: form.title.trim(),
        textVersionId: textId,
        classId: form.classId,
        rubricId,
        deadline: form.deadline || null,
        difficulty: form.difficulty,
        targetAxes: axes,
        prompt: form.prompt,
        workflowConfig: {
          predictionEnabled,
          aiReviewRequired: true,
          teacherApprovalRequired: true,
          reflectionRequired: true,
          officialRubricRequired: true
        },
        predictionTemplate: { enabled: predictionEnabled, requireConfidence: true },
        guidingSteps: [
          ...(predictionEnabled ? ['Hoàn thành V0 trước đọc'] : []),
          'Nộp V1 để nhận góp ý AI/giáo viên',
          'Đọc góp ý và chỉnh sửa V2',
          'Hoàn thành REF1',
          'Chờ giáo viên chấm Rubric chính thức'
        ]
      });
      await refreshAcademicData(); onNavigate('teacher-dashboard');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Không thể tạo nhiệm vụ.'); } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5 pb-16">
    <div className="border-b border-slate-200 pb-4"><h1 className="text-2xl font-semibold text-slate-950">Tạo nhiệm vụ</h1><p className="mt-1 text-sm text-slate-500">Thiết lập theo từng bước, có preview workflow trước khi xuất bản.</p></div>
    {message && <Alert type="error" title="Chưa thể xuất bản">{message}</Alert>}
    <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1">{['Lớp & ngữ liệu','Yêu cầu','Workflow','Kiểm tra'].map((label,i) => <button key={label} onClick={() => setStep(i+1)} className={`rounded-lg px-2 py-2 text-xs font-semibold ${step===i+1?'bg-slate-900 text-white':'text-slate-500'}`}>{i+1}. {label}</button>)}</div>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {step===1 && <div className="grid gap-4 md:grid-cols-2"><Field label="Tên nhiệm vụ" value={form.title} onChange={v=>set('title',v)} /><Select label="Lớp" value={form.classId} onChange={v=>set('classId',v)} options={classes.map(c=>[c.code,c.code])} /><Select label="Tác phẩm" value={form.textId} onChange={v=>set('textId',v)} options={texts.map(t=>[t.id,`${t.title} - ${t.author}`])} /><Select label="Rubric" value={form.rubricId} onChange={v=>set('rubricId',v)} options={rubricOptions.map(r=>[r.id,r.title])} /></div>}
      {step===2 && <div className="space-y-4"><Field label="Hạn nộp" type="datetime-local" value={form.deadline} onChange={v=>set('deadline',v)} /><textarea rows={5} value={form.prompt} onChange={e=>set('prompt',e.target.value)} placeholder="Yêu cầu đề bài..." className="w-full rounded-lg border border-slate-300 p-3 text-sm" /><div className="grid gap-2 sm:grid-cols-2">{POETIC_AXES.map(a=><label key={a.id} className="flex gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={axes.includes(a.id)} onChange={()=>toggleAxis(a.id)} />{a.title}</label>)}</div></div>}
      {step===3 && <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-sm"><span><b>V0 trước đọc</b><small className="mt-1 block text-slate-500">Có thể bật/tắt theo mục tiêu bài học.</small></span><input type="checkbox" checked={predictionEnabled} onChange={()=>setPredictionEnabled(value=>!value)} /></label>
        <RequiredStep title="Phản hồi AI" description="Bắt buộc để giữ đúng quy trình phản hồi và provenance." />
        <RequiredStep title="REF1 tự phản tư" description="Bắt buộc sau V2 trước khi chấm chính thức." />
        <RequiredStep title="Rubric giáo viên" description="Điểm cuối do server tính theo rubric đã gắn với nhiệm vụ." />
      </div>}
      {step===4 && <div className="space-y-3 text-sm text-slate-700"><b>{form.title || 'Chưa đặt tên'}</b><div>Lớp: {form.classId || '—'} · {axes.length} trục thi pháp</div><div>Workflow: {predictionEnabled ? 'V0 → ' : ''}V1 → AI/GV → V2 → REF1 → Rubric → Hoàn thành</div></div>}
    </section>
    <div className="flex justify-between"><Button variant="outline" onClick={() => step>1 ? setStep(step-1) : onNavigate('teacher-dashboard')}>{step>1?'Quay lại':'Hủy'}</Button>{step<4?<Button variant="primary" onClick={()=>setStep(step+1)}>Tiếp tục</Button>:<Button variant="primary" isLoading={saving} onClick={publish}>Xuất bản nhiệm vụ</Button>}</div>
  </div>;
};

const RequiredStep = ({ title, description }: { title: string; description: string }) => <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"><span><b>{title}</b><small className="mt-1 block text-slate-500">{description}</small></span><input type="checkbox" checked readOnly aria-label={`${title} bắt buộc`} /></div>;
const Field = ({ label, value, onChange, type='text' }: { label:string; value:string; onChange:(v:string)=>void; type?:string }) => <label className="text-xs font-medium text-slate-700">{label}<input type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm" /></label>;
const Select = ({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:Array<[string,string]> }) => <label className="text-xs font-medium text-slate-700">{label}<select value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm">{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>;
