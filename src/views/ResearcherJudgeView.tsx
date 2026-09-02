import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard } from '../components/ui';
import { ArrowLeftIcon, ArrowsRightLeftIcon, ChartBarIcon, DocumentTextIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ResearcherJudgeViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
const axisLabels:Record<PoeticAxisId,string>={plot_situation:'Tình huống',character_detail:'Nhân vật',narrator_pov:'Điểm nhìn',space_time:'Không-thời gian',language_tone_symbol:'Ngôn ngữ',form_argument:'Lập luận'};
const mean=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const sd=(a:number[])=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));};

export const ResearcherJudgeView:React.FC<ResearcherJudgeViewProps>=({onNavigate})=>{
  const {portfolios,rubricSubmissions,rubric,feedbacks,auditLogs}=usePortfolio();
  const criterionAxis=useMemo(()=>Object.fromEntries(rubric.criteria.map(c=>[c.id,c.axisId])),[rubric]);
  const classCodes=useMemo(()=>Array.from(new Set(Object.values(portfolios).map(p=>p.className).filter(Boolean))).sort(),[portfolios]);
  const classAlias=useMemo(()=>Object.fromEntries(classCodes.map((c,i)=>[c,`Cohort ${String.fromCharCode(65+i)}`])),[classCodes]);
  const samples=useMemo(()=>Object.values(portfolios).map((p,index)=>{
    const subs=rubricSubmissions.filter(s=>s.studentId===p.studentId&&s.assignmentId===p.assignmentId).sort((a,b)=>new Date(a.submittedAt).getTime()-new Date(b.submittedAt).getTime());
    const score=(s:any)=>s&&Number(s.maxScore)>0?Number(s.totalScore)/Number(s.maxScore)*4:0;
    const pre=score(subs[0]),post=score(subs.at(-1));const latest=subs.at(-1);const axes:Partial<Record<PoeticAxisId,number>>={};if(latest)Object.entries(latest.criterionScores).forEach(([id,v]:any)=>{const axis=criterionAxis[id] as PoeticAxisId|undefined;if(axis)axes[axis]=Number(v.score||v.level||0);});
    const resolved=feedbacks.filter(f=>f.studentId===p.studentId&&f.assignmentId===p.assignmentId&&f.resolved).length;
    const latestVersion=p.versions.at(-1);const evidence=latestVersion?Object.values(latestVersion.responses).map(r=>r.analysisText).find(Boolean)||'':'';
    return{code:`HS-ANON-${String(index+1).padStart(3,'0')}`,cohort:classAlias[p.className]||'Cohort',assignmentId:p.assignmentId,pre,post,gain:pre&&post?post-pre:0,versionCount:p.versions.length,resolved,axes,evidence:evidence.slice(0,220),studentId:p.studentId};
  }),[portfolios,rubricSubmissions,criterionAxis,feedbacks,classAlias]);
  const paired=samples.filter(s=>s.pre>0&&s.post>0);const gains=paired.map(s=>s.gain);const effect=gains.length>1&&sd(gains)>0?mean(gains)/sd(gains):0;
  const avgPre=mean(paired.map(s=>s.pre)),avgPost=mean(paired.map(s=>s.post));

  return <div className="mx-auto max-w-7xl space-y-6 pb-16">
    <header className="rounded-2xl border bg-white p-5 sm:p-6"><Button size="sm" variant="ghost" onClick={()=>onNavigate('dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Dashboard</Button><div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700"><ShieldCheckIcon className="h-4 w-4"/>Dữ liệu nghiên cứu ẩn danh thật</div><h1 className="mt-1 text-2xl font-bold">Minh chứng tiến bộ & Effect Size</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Không hiển thị họ tên hoặc ID học sinh. Pre/Post chỉ tồn tại khi có ít nhất hai rubric submissions cho cùng hồ sơ.</p></div><Badge variant="purple">{samples.length} hồ sơ ẩn danh</Badge></div></header>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5"><StatCard label="Hồ sơ" value={String(samples.length)} subValue="Portfolio thật" icon={<DocumentTextIcon className="h-5 w-5"/>}/><StatCard label="Cặp Pre/Post" value={String(paired.length)} subValue="Đủ dữ liệu so sánh" icon={<ArrowsRightLeftIcon className="h-5 w-5"/>}/><StatCard label="Pre trung bình" value={paired.length?avgPre.toFixed(2):'—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-5 w-5"/>}/><StatCard label="Post trung bình" value={paired.length?avgPost.toFixed(2):'—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-5 w-5"/>}/><StatCard label="Cohen's dz" value={effect?effect.toFixed(2):'—'} subValue={paired.length>1?'Từ gain paired':'Cần ≥ 2 cặp'} icon={<SparklesIcon className="h-5 w-5"/>}/></section>

    <Card padding="lg"><div className="mb-4"><h2 className="font-bold">Mẫu ẩn danh có truy nguyên</h2><p className="mt-1 text-xs text-slate-500">Mã HS-ANON chỉ được tạo ở client từ danh sách hiện tại; studentId thật không được render.</p></div><div className="overflow-x-auto"><table className="min-w-[950px] w-full text-xs"><thead><tr className="border-b bg-slate-50"><th className="px-3 py-3 text-left">Mã</th><th className="px-3 py-3">Cohort</th><th className="px-3 py-3">Version</th><th className="px-3 py-3">Feedback đã xử lý</th><th className="px-3 py-3">Pre</th><th className="px-3 py-3">Post</th><th className="px-3 py-3">Gain</th><th className="px-3 py-3 text-left">Minh chứng rút gọn</th></tr></thead><tbody>{samples.map(s=><tr key={`${s.code}-${s.assignmentId}`} className="border-b"><td className="px-3 py-3 font-mono font-bold">{s.code}</td><td className="px-3 py-3 text-center"><Badge variant="purple">{s.cohort}</Badge></td><td className="px-3 py-3 text-center">{s.versionCount}</td><td className="px-3 py-3 text-center">{s.resolved}</td><td className="px-3 py-3 text-center">{s.pre?s.pre.toFixed(2):'—'}</td><td className="px-3 py-3 text-center">{s.post?s.post.toFixed(2):'—'}</td><td className={`px-3 py-3 text-center font-bold ${s.gain>0?'text-emerald-700':s.gain<0?'text-rose-700':'text-slate-500'}`}>{s.pre&&s.post?`${s.gain>=0?'+':''}${s.gain.toFixed(2)}`:'—'}</td><td className="max-w-sm px-3 py-3 text-slate-600">{s.evidence||'Chưa có nội dung version.'}</td></tr>)}</tbody></table></div></Card>

    <Card padding="lg"><h2 className="font-bold">Điểm gần nhất theo 6 trục</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{(Object.keys(axisLabels) as PoeticAxisId[]).map(axis=>{const values=samples.map(s=>s.axes[axis]).filter((v):v is number=>typeof v==='number'&&v>0);return <div key={axis} className="rounded-xl border p-4"><div className="flex items-center justify-between"><b className="text-sm">{axisLabels[axis]}</b><Badge variant="blue">n={values.length}</Badge></div><div className="mt-2 text-2xl font-bold">{values.length?mean(values).toFixed(2):'—'}</div></div>;})}</div></Card>
    <Card padding="lg"><h2 className="font-bold">Audit nghiên cứu</h2><p className="mt-1 text-xs text-slate-500">{auditLogs.length} sự kiện audit được quyền nghiên cứu truy cập. Các thao tác quản trị và học thuật quan trọng được ghi timestamp server.</p></Card>
  </div>;
};
