import React, { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { PoeticAxisId } from '../types';
import { Badge, Button, Card, StatCard, PageHeader } from '../components/ui';
import { ArrowLeftIcon, ArrowsRightLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div>
        <div className="mb-2">
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Tổng quan</Button>
        </div>
        <PageHeader
          title="Minh chứng tiến bộ & Chỉ số Effect Size"
          description="Dữ liệu nghiên cứu ẩn danh phân tích đối chứng Pre/Post và đo lường mức độ tăng trưởng năng lực."
          actions={<Badge variant="indigo">{samples.length} hồ sơ ẩn danh</Badge>}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Hồ sơ nghiên cứu" value={String(samples.length)} subValue="Bộ dữ liệu thực tế" icon={<DocumentTextIcon className="h-4 w-4"/>}/>
        <StatCard label="Cặp Pre/Post" value={String(paired.length)} subValue="Đủ điều kiện so sánh" icon={<ArrowsRightLeftIcon className="h-4 w-4"/>}/>
        <StatCard label="Điểm Pre trung bình" value={paired.length?avgPre.toFixed(2):'—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-4 w-4"/>}/>
        <StatCard label="Điểm Post trung bình" value={paired.length?avgPost.toFixed(2):'—'} subValue="Quy đổi thang 4" icon={<ChartBarIcon className="h-4 w-4"/>}/>
        <StatCard label="Cohen's dz" value={effect?effect.toFixed(2):'—'} subValue={paired.length>1?'Độ lớn ảnh hưởng (gain)':'Cần ≥ 2 cặp'} icon={<ChartBarIcon className="h-4 w-4"/>}/>
      </section>

      <Card padding="md">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Mẫu đối chứng ẩn danh</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mã định danh HS-ANON được tạo phục vụ phân tích khoa học; danh tính cá nhân không hiển thị.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="px-3 py-2.5 text-left font-semibold">Mã ẩn danh</th>
                <th className="px-3 py-2.5 text-center font-semibold">Nhóm (Cohort)</th>
                <th className="px-3 py-2.5 text-center font-semibold">Phiên bản</th>
                <th className="px-3 py-2.5 text-center font-semibold">Phản hồi đã xử lý</th>
                <th className="px-3 py-2.5 text-center font-semibold">Pre</th>
                <th className="px-3 py-2.5 text-center font-semibold">Post</th>
                <th className="px-3 py-2.5 text-center font-semibold">Gain</th>
                <th className="px-3 py-2.5 text-left font-semibold">Trích dẫn minh chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map(s=>(
                <tr key={`${s.code}-${s.assignmentId}`} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{s.code}</td>
                  <td className="px-3 py-2.5 text-center"><Badge variant="slate" size="sm">{s.cohort}</Badge></td>
                  <td className="px-3 py-2.5 text-center text-slate-700">{s.versionCount}</td>
                  <td className="px-3 py-2.5 text-center text-slate-700">{s.resolved}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-slate-700">{s.pre?s.pre.toFixed(2):'—'}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-slate-700">{s.post?s.post.toFixed(2):'—'}</td>
                  <td className={`px-3 py-2.5 text-center font-bold ${s.gain>0?'text-emerald-700':s.gain<0?'text-rose-700':'text-slate-500'}`}>
                    {s.pre&&s.post?`${s.gain>=0?'+':''}${s.gain.toFixed(2)}`:'—'}
                  </td>
                  <td className="max-w-sm px-3 py-2.5 text-slate-600 line-clamp-2">{s.evidence||'Chưa có dữ liệu bài viết.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <div className="mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Điểm trung bình các trục thi pháp</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mức điểm trung bình được tổng hợp từ các lần đánh giá rubric gần nhất.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(axisLabels) as PoeticAxisId[]).map(axis=>{
            const values=samples.map(s=>s.axes[axis]).filter((v):v is number=>typeof v==='number'&&v>0);
            return (
              <div key={axis} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{axisLabels[axis]}</span>
                  <Badge variant="blue" size="sm">n={values.length}</Badge>
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900">{values.length?mean(values).toFixed(2):'—'}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-slate-900">Tính bảo mật & kiểm toán nghiên cứu</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Tổng cộng {auditLogs.length} sự kiện hệ thống đã được ghi nhận. Toàn bộ thông tin học sinh được tách rời khỏi danh tính thật trước khi đưa vào báo cáo nghiên cứu sư phạm.
        </p>
      </Card>
    </div>
  );
};
