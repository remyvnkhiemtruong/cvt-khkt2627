import React, { useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Avatar, Badge, Button, Card, Progress, StatCard, PageHeader } from '../components/ui';
import { ArrowRightIcon, BookOpenIcon, ChartBarIcon, ChatBubbleLeftRightIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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
    <PageHeader
      title={`Tổng quan giảng dạy — ${user.name}`}
      description="Theo dõi tiến độ hoàn thành nhiệm vụ, hồ sơ bài nộp và đánh giá rubric của các lớp."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>onNavigate('class-analytics')} leftIcon={<ChartBarIcon className="h-4 w-4"/>}>Phân tích lớp</Button>
          <Button variant="primary" size="sm" onClick={()=>onNavigate('assignment-builder')} leftIcon={<PlusIcon className="h-4 w-4"/>}>Tạo nhiệm vụ</Button>
        </div>
      }
    />
    {dataError&&<div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{dataError}</div>}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard label="Lớp phụ trách" value={isLoading?'—':`${classes.length} lớp`} subValue={classes.join(', ')||'Chưa có lớp'} icon={<UserGroupIcon className="h-4 w-4"/>}/>
      <StatCard label="Nhiệm vụ" value={isLoading?'—':`${assignments.length} bài`} subValue="Đang giao" icon={<BookOpenIcon className="h-4 w-4"/>}/>
      <StatCard label="Hồ sơ đã nộp" value={isLoading?'—':`${submissions.length} hồ sơ`} subValue="Đã có bài nộp" icon={<ChatBubbleLeftRightIcon className="h-4 w-4"/>}/>
      <StatCard label="Chưa phản hồi" value={isLoading?'—':String(unresolved)} subValue="Cần xem xét" icon={<ChatBubbleLeftRightIcon className="h-4 w-4"/>}/>
      <StatCard label="Gợi ý AI" value={isLoading?'—':String(aiFeedbacks)} subValue="Tự động hỗ trợ" icon={<ChatBubbleLeftRightIcon className="h-4 w-4"/>}/>
    </section>

    <div className="grid gap-6 lg:grid-cols-12">
      <Card padding="md" className="lg:col-span-7">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hoàn thành theo nhiệm vụ</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tiến độ nộp bài của học sinh theo từng bài tập</p>
          </div>
          <Button size="sm" variant="ghost" onClick={()=>onNavigate('class-analytics')} rightIcon={<ArrowRightIcon className="h-3.5 w-3.5"/>}>Chi tiết</Button>
        </div>
        <div className="space-y-3">
          {progress.length===0 ? (
            <p className="text-xs text-slate-500 py-3">Chưa có nhiệm vụ nào được giao.</p>
          ) : (
            progress.map(item=>(
              <div key={item.assignment.id} className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="blue">{item.assignment.classId||'Chưa gán lớp'}</Badge>
                    <h3 className="mt-1 text-xs font-semibold text-slate-900">{item.assignment.title}</h3>
                  </div>
                  <b className="text-xs text-slate-700">{item.done}/{item.total}</b>
                </div>
                <Progress value={item.pct} max={100} variant={item.pct===100?'success':'indigo'} size="sm"/>
                <div className="mt-1 text-right text-xs font-medium text-slate-600">{item.pct}%</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card padding="md" className="lg:col-span-5">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Hồ sơ nộp gần đây</h2>
          <p className="text-xs text-slate-500 mt-0.5">Các bài nộp mới cần giáo viên đọc và chấm</p>
        </div>
        <div className="space-y-2.5">
          {submissions.slice(0,8).map(p=>{
            const version=p.versions.at(-1);
            return (
              <button
                key={p.id}
                onClick={()=>onNavigate('teacher-review',{studentId:p.studentId,assignmentId:p.assignmentId})}
                className="w-full rounded-md border border-slate-200 p-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={p.studentName} size="sm"/>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-semibold text-slate-900">{p.studentName}</b>
                    <span className="text-xs text-slate-500">{p.className} • {version?.versionNumber}</span>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-slate-400">Nộp: {version?new Date(version.createdAt).toLocaleString('vi-VN'):'—'}</div>
              </button>
            );
          })}
          {submissions.length===0&&<p className="text-xs text-slate-500 py-3">Chưa có bài nộp.</p>}
        </div>
      </Card>
    </div>
  </div>;
};
