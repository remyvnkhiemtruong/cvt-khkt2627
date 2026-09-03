import React, { useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import { StatCard, Button, Badge, Card, Progress, Skeleton, EmptyState } from '../components/ui';
import {
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface StudentDashboardViewProps { onNavigate:(view:string,extraParams?:any)=>void; }

export const StudentDashboardView:React.FC<StudentDashboardViewProps>=({onNavigate})=>{
  const currentUser=useAuthStore(state=>state.currentUser);
  const {autosaveStatus,lastSavedTime}=usePortfolioStore();
  const {assignments,literatureTexts,portfolios,feedbacks,rubricSubmissions,rubric,isLoading,dataError,refreshAcademicData}=usePortfolio();

  const myPortfolios=useMemo(()=>Object.values(portfolios).filter(portfolio=>portfolio.studentId===currentUser.id),[portfolios,currentUser.id]);
  const myFeedbacks=useMemo(()=>feedbacks.filter(item=>item.studentId===currentUser.id),[feedbacks,currentUser.id]);
  const unresolvedFeedbacks=myFeedbacks.filter(item=>!item.resolved);
  const myRubrics=useMemo(()=>rubricSubmissions.filter(item=>item.studentId===currentUser.id),[rubricSubmissions,currentUser.id]);

  const activeAssignment=assignments.find(assignment=>{
    const portfolio=portfolios[`port-${currentUser.id}-${assignment.id}`];
    return portfolio && portfolio.status!=='completed';
  }) || assignments[0];
  const activePortfolio=activeAssignment?portfolios[`port-${currentUser.id}-${activeAssignment.id}`]:undefined;
  const activeText=activeAssignment?literatureTexts.find(text=>text.id===activeAssignment.textId):undefined;
  const activeVersion=activePortfolio?.currentActiveVersion||'v1.0 (nháp)';

  const completedAssignments=assignments.filter(assignment=>{
    const portfolio=portfolios[`port-${currentUser.id}-${assignment.id}`];
    if(portfolio?.status==='completed')return true;
    return myRubrics.some(sub=>sub.assignmentId===assignment.id&&sub.evaluatorRole==='teacher');
  }).length;
  const revisionCount=myPortfolios.filter(portfolio=>portfolio.status==='feedback_received'||portfolio.status==='v2_in_revision').length;
  const progressPercent=assignments.length?Math.round(completedAssignments/assignments.length*100):0;

  const latestTeacherRubric=[...myRubrics].filter(item=>item.evaluatorRole==='teacher').sort((a,b)=>new Date(a.submittedAt).getTime()-new Date(b.submittedAt).getTime()).at(-1);
  const axisScores=useMemo(()=>{
    const byCriterion=Object.fromEntries((rubric.criteria||[]).map(criterion=>[criterion.id,criterion.axisId]));
    const scores:Record<string,number>={};
    if(latestTeacherRubric){
      for(const [criterionId,value] of Object.entries(latestTeacherRubric.criterionScores||{})){
        const axis=byCriterion[criterionId];
        if(axis)scores[axis]=Number(value.score||value.level||0);
      }
    }
    return POETIC_AXES.map(axis=>({axis,score:scores[axis.id]||0}));
  },[latestTeacherRubric,rubric]);
  const weakestAxis=axisScores.filter(item=>item.score>0).sort((a,b)=>a.score-b.score)[0];

  const greeting=(()=>{const hour=new Date().getHours();return hour<12?'Chào buổi sáng':hour<18?'Chào buổi chiều':'Chào buổi tối';})();

  if(isLoading&&assignments.length===0)return <div className="space-y-6"><Skeleton className="h-32 w-full rounded-2xl"/><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({length:4}).map((_,index)=><Skeleton key={index} className="h-24 rounded-2xl"/>)}</div><Skeleton className="h-56 w-full rounded-2xl"/></div>;
  if(assignments.length===0)return <Card padding="none"><EmptyState icon={<BookOpenIcon className="h-10 w-10 text-slate-300"/>} title="Chưa có nhiệm vụ Ngữ văn" description={dataError||'Bạn chưa được gán nhiệm vụ nào. Hãy kiểm tra lại sau khi giáo viên hoặc quản trị viên phân công lớp.'} action={<Button variant="outline" onClick={()=>void refreshAcademicData()}>Tải lại dữ liệu</Button>}/></Card>;

  return <div className="space-y-6 pb-12 sm:space-y-8">
    {dataError&&<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Một phần dữ liệu có thể chưa mới nhất: {dataError}</div>}
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-card sm:rounded-3xl sm:p-7 md:flex-row md:items-center">
      <div className="space-y-2"><div className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300"><SparklesIcon className="h-3.5 w-3.5 text-amber-400"/>{currentUser.className?`Lớp ${currentUser.className}`:'Chưa gán lớp'}</div><h1 className="text-2xl font-bold tracking-tight">{greeting}, {currentUser.name.split(' ').pop()}</h1><p className="text-sm text-slate-300">Bạn có <strong className="text-white">{assignments.length} nhiệm vụ</strong>, <strong className="text-amber-300">{unresolvedFeedbacks.length} phản hồi chưa xử lý</strong> và <strong className="text-sky-300">{myPortfolios.length} hồ sơ</strong>.</p></div>
      {activeAssignment&&<Button variant="primary" size="lg" onClick={()=>onNavigate('editor',{assignmentId:activeAssignment.id})} leftIcon={<DocumentTextIcon className="h-5 w-5"/>} rightIcon={<ArrowRightIcon className="h-4 w-4"/>} className="w-full bg-white font-bold text-slate-900 hover:bg-slate-100 sm:w-auto">Tiếp tục bài đang làm</Button>}
    </section>

    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="Nhiệm vụ" value={String(assignments.length)} subValue={`${completedAssignments} đã hoàn thành`} icon={<BookOpenIcon className="h-5 w-5"/>}/>
      <StatCard label="Phản hồi cần xử lý" value={String(unresolvedFeedbacks.length)} subValue={unresolvedFeedbacks.length?'Ưu tiên xem lại':'Không còn phản hồi tồn'} icon={<ChatBubbleLeftRightIcon className="h-5 w-5"/>}/>
      <StatCard label="Hồ sơ đang chỉnh sửa" value={String(revisionCount)} subValue={`${myPortfolios.length} hồ sơ tổng cộng`} icon={<ArrowPathIcon className="h-5 w-5"/>}/>
      <StatCard label="Tiến độ hoàn thành" value={`${progressPercent}%`} subValue={`${completedAssignments}/${assignments.length} nhiệm vụ`} icon={<CheckCircleIcon className="h-5 w-5"/>}/>
    </section>

    {activeAssignment&&<Card padding="lg" className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div className="min-w-0 flex-1 space-y-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="indigo">Nhiệm vụ đang ưu tiên</Badge><span className="text-xs font-medium text-slate-500">{activeText?`${activeText.title} — ${activeText.author}`:'Ngữ liệu chưa khả dụng'}</span></div><div><h2 className="text-lg font-bold text-slate-900">{activeAssignment.title}</h2><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{activeAssignment.prompt||'Chưa có mô tả chi tiết.'}</p></div><div className="flex flex-wrap items-center gap-4 text-xs text-slate-600"><span>Phiên bản: <Badge variant="blue">{activeVersion}</Badge></span><span className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${autosaveStatus==='dirty'?'bg-amber-500':autosaveStatus==='saving'?'bg-sky-500':'bg-emerald-500'}`}/>{autosaveStatus==='dirty'?'Có thay đổi chưa lưu':autosaveStatus==='saving'?'Đang lưu…':`Đã lưu ${lastSavedTime||'gần đây'}`}</span>{activeAssignment.deadline&&<span className="inline-flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5"/>Hạn: {new Date(activeAssignment.deadline).toLocaleDateString('vi-VN')}</span>}</div></div><div className="shrink-0"><Button variant="primary" onClick={()=>onNavigate('editor',{assignmentId:activeAssignment.id})}>Mở bài viết</Button></div></div>
    </Card>}

    <section className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg"><div className="mb-4"><h2 className="font-bold text-slate-900">Phản hồi gần đây</h2><p className="mt-1 text-xs text-slate-500">Chỉ hiển thị feedback thật từ AI, giáo viên hoặc phản biện.</p></div>{myFeedbacks.length===0?<p className="text-sm text-slate-500">Chưa có phản hồi.</p>:<div className="space-y-3">{[...myFeedbacks].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,4).map(item=><div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><div className="flex items-center justify-between gap-2"><strong className="text-slate-800">{item.authorRole==='ai'?'AI':item.authorName}</strong><Badge variant={item.resolved?'emerald':'amber'}>{item.resolved?'Đã xử lý':'Cần xem lại'}</Badge></div><p className="mt-2 line-clamp-3 leading-5 text-slate-600">{item.comment}</p></div>)}</div>}</Card>
      <Card padding="lg"><div className="mb-4"><h2 className="font-bold text-slate-900">Năng lực cần ưu tiên</h2><p className="mt-1 text-xs text-slate-500">Tính từ rubric giáo viên gần nhất; không tạo điểm giả khi chưa có dữ liệu.</p></div>{!latestTeacherRubric||!weakestAxis?<div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có rubric giáo viên để phân tích. Sau lần chấm đầu tiên, hệ thống sẽ chỉ ra trục cần ưu tiên.</div>:<div className="space-y-3"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-slate-900">{weakestAxis.axis.title}</div><div className="text-xs text-slate-500">Mức gần nhất</div></div><div className="text-2xl font-bold text-indigo-700">{weakestAxis.score.toFixed(1)}/4</div></div><Progress value={Math.min(100,weakestAxis.score/4*100)}/><Button size="sm" variant="outline" onClick={()=>activeAssignment&&onNavigate('student-analytics',{studentId:currentUser.id,assignmentId:activeAssignment.id})}>Xem phân tích chi tiết</Button></div>}</Card>
    </section>
  </div>;
};
