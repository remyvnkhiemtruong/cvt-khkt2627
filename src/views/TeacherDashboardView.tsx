import React, { useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Avatar, Badge, Button, Card, Progress, StatCard } from '../components/ui';
import { ArrowRightIcon, BookOpenIcon, ChartBarIcon, ChatBubbleLeftRightIcon, PlusIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface TeacherDashboardViewProps { onNavigate:(view:string,extraParams?:any)=>void; }

export const TeacherDashboardView:React.FC<TeacherDashboardViewProps>=({onNavigate})=>{
  const user=useAuthStore(s=>s.currentUser);
  const {assignments,portfolios,feedbacks,isLoading,dataError}=usePortfolio();
  const portfolioList=useMemo(()=>Object.values(portfolios),[portfolios]);
  const classes=useMemo(()=>Array.from(new Set(portfolioList.map(p=>p.className).filter(Boolean))),[portfolioList]);
  const submissions=useMemo(()=>portfolioList.filter(p=>p.versions.length>0).sort((a,b)=>new Date(b.versions.at(-1)?.createdAt||0).getTime()-new Date(a.versions.at(-1)?.createdAt||0).getTime()),[portfolioList]);
  const unresolved=feedbacks.filter(f=>!f.resolved).length;
  const aiFeedbacks=feedbacks.filter(f=>f.authorRole==='ai').length;
  const progress=assignments.map(a=>{const ps=portfolioList.filter(p=>p.assignmentId===a.id);const done=ps.filter(p=>p.versions.length>0).length;return{assignment:a,total:ps.length,done,pct:ps.length?Math.round(done/ps.length*100):0};});

  return <div className="space-y-6 pb-16">
    <header className="flex flex-col gap-5 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white md:flex-row md:items-center md:justify-between"><div><div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300"><SparklesIcon className="h-3.5 w-3.5 text-emerald-400"/>DỮ LIỆU LỚP THẬT</div><h1 className="text-2xl font-bold">Bàn làm việc Giáo viên — {user.name}</h1><p className="mt-2 text-sm text-slate-300">Tiến độ được tính trực tiếp từ portfolio/version PostgreSQL, không dùng danh sách học sinh mẫu.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="border-slate-700 text-white" onClick={()=>onNavigate('class-analytics')} leftIcon={<ChartBarIcon className="h-4 w-4"/>}>Phân tích lớp</Button><Button className="bg-white text-slate-900" onClick={()=>onNavigate('assignment-builder')} leftIcon={<PlusIcon className="h-4 w-4"/>}>Tạo nhiệm vụ</Button></div></header>
    {dataError&&<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{dataError}</div>}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5"><StatCard label="Lớp có dữ liệu" value={isLoading?'—':`${classes.length} lớp`} subValue={classes.join(', ')||'Chưa có lớp'} icon={<UserGroupIcon className="h-5 w-5"/>}/><StatCard label="Nhiệm vụ" value={isLoading?'—':`${assignments.length} bài`} subValue="Từ PostgreSQL" icon={<BookOpenIcon className="h-5 w-5"/>}/><StatCard label="Hồ sơ đã nộp" value={isLoading?'—':`${submissions.length} hồ sơ`} subValue="Có ít nhất 1 version" icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>}/><StatCard label="Phản hồi chưa xử lý" value={isLoading?'—':String(unresolved)} subValue="Teacher/peer/AI" icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>}/><StatCard label="Phản hồi AI" value={isLoading?'—':String(aiFeedbacks)} subValue="Đã trả cho học sinh" icon={<SparklesIcon className="h-5 w-5"/>}/></section>

    <div className="grid gap-6 lg:grid-cols-12"><Card padding="lg" className="lg:col-span-7"><div className="mb-4 flex items-center justify-between border-b pb-3"><div><div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Tiến độ thật</div><h2 className="font-bold">Hoàn thành theo nhiệm vụ</h2></div><Button size="sm" variant="ghost" onClick={()=>onNavigate('class-analytics')} rightIcon={<ArrowRightIcon className="h-3.5 w-3.5"/>}>Chi tiết</Button></div><div className="space-y-4">{progress.length===0?<p className="text-sm text-slate-500">Chưa có nhiệm vụ.</p>:progress.map(item=><div key={item.assignment.id} className="rounded-xl border bg-slate-50/50 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div><Badge variant="blue">{item.assignment.classId||'Chưa gán lớp'}</Badge><h3 className="mt-1 text-sm font-bold">{item.assignment.title}</h3></div><b className="text-sm">{item.done}/{item.total}</b></div><Progress value={item.pct} max={100} variant={item.pct===100?'success':'indigo'} size="sm"/><div className="mt-1 text-right text-xs font-semibold text-emerald-700">{item.pct}%</div></div>)}</div></Card>

      <Card padding="lg" className="lg:col-span-5"><div className="mb-4 border-b pb-3"><div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Bài mới nộp</div><h2 className="font-bold">Hồ sơ chờ giáo viên xem</h2></div><div className="space-y-3">{submissions.slice(0,8).map(p=>{const version=p.versions.at(-1);return <button key={p.id} onClick={()=>onNavigate('teacher-review',{studentId:p.studentId,assignmentId:p.assignmentId})} className="w-full rounded-xl border p-3 text-left hover:bg-slate-50"><div className="flex items-center gap-2"><Avatar name={p.studentName} size="sm"/><div className="min-w-0"><b className="block truncate text-sm">{p.studentName}</b><span className="text-xs text-slate-500">{p.className} • {version?.versionNumber}</span></div></div><div className="mt-2 text-[11px] text-slate-500">Nộp: {version?new Date(version.createdAt).toLocaleString('vi-VN'):'—'}</div></button>})}{submissions.length===0&&<p className="text-sm text-slate-500">Chưa có bài nộp.</p>}</div></Card>
    </div>
  </div>;
};
