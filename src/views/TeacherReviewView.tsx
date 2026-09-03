import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import { Avatar, Badge, Button } from '../components/ui';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TeacherReviewViewProps {
  studentId?: string;
  assignmentId?: string;
  isPeerMode?: boolean;
  onNavigate: (view: string, extraParams?: any) => void;
}

const StatePanel: React.FC<{title:string;message:string;actionLabel?:string;onAction?:()=>void;loading?:boolean}> = ({title,message,actionLabel,onAction,loading}) => (
  <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    {loading ? <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/> : <ExclamationTriangleIcon className="mx-auto mb-4 h-9 w-9 text-slate-400"/>}
    <h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    {actionLabel && onAction && <Button className="mt-5" variant="primary" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

export const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({ studentId = '', assignmentId = '', isPeerMode = false, onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { addToast } = useNotificationStore();
  const {
    assignments, literatureTexts, portfolios, feedbacks, rubric, isLoading, dataError,
    refreshAcademicData, addAnchoredFeedback, submitRubric
  } = usePortfolio();

  const queue = useMemo(() => {
    const all = Object.values(portfolios);
    const scoped = assignmentId ? all.filter(item => item.assignmentId === assignmentId) : all;
    return (scoped.length ? scoped : all).sort((a,b)=>a.studentName.localeCompare(b.studentName,'vi'));
  }, [portfolios, assignmentId]);

  const [currentIndex,setCurrentIndex]=useState(0);
  const [activeAxisId,setActiveAxisId]=useState<PoeticAxisId>('plot_situation');
  const [selectedVersion,setSelectedVersion]=useState('');
  const [selectedText,setSelectedText]=useState('');
  const [feedbackText,setFeedbackText]=useState('');
  const [overallFeedback,setOverallFeedback]=useState('');
  const [rubricScores,setRubricScores]=useState<Record<string,number>>({});

  useEffect(()=>{
    if(queue.length===0){setCurrentIndex(0);return;}
    const requested=studentId?queue.findIndex(item=>item.studentId===studentId):-1;
    if(requested>=0)setCurrentIndex(requested);
    else if(currentIndex>=queue.length)setCurrentIndex(0);
  },[queue,studentId,currentIndex]);

  const currentPortfolio=queue[currentIndex];
  const assignment=currentPortfolio ? assignments.find(item=>item.id===currentPortfolio.assignmentId) : undefined;
  const literatureText=assignment ? literatureTexts.find(item=>item.id===assignment.textId) : undefined;

  const latestVersionNumber = currentPortfolio?.versions[currentPortfolio.versions.length-1]?.versionNumber || '';
  useEffect(()=>{
    setSelectedVersion(latestVersionNumber);
  },[currentPortfolio?.id, latestVersionNumber]);

  useEffect(()=>{
    setRubricScores(previous=>{
      const next={...previous};
      for(const criterion of rubric.criteria||[]) if(next[criterion.id]===undefined) next[criterion.id]=0;
      return next;
    });
  },[rubric]);

  const selectedSnapshot=currentPortfolio?.versions.find(item=>item.versionNumber===selectedVersion);
  const responses=selectedSnapshot?.responses || currentPortfolio?.currentDraft;
  const activeResponse=responses?.[activeAxisId];
  const currentFeedbacks=useMemo(()=>{
    if(!currentPortfolio||!assignment)return [];
    return feedbacks.filter(item=>item.studentId===currentPortfolio.studentId && item.assignmentId===assignment.id && item.axisId===activeAxisId);
  },[feedbacks,currentPortfolio,assignment,activeAxisId]);

  const evaluatorRole = currentUser.role === 'peer' || isPeerMode ? 'peer' : 'teacher';
  const totalScore=(rubric.criteria||[]).reduce((sum,criterion)=>sum+(rubricScores[criterion.id]||0)*Number(criterion.weight||1),0);
  const maxScore=(rubric.criteria||[]).reduce((sum,criterion)=>sum+4*Number(criterion.weight||1),0);

  if(isLoading&&queue.length===0)return <StatePanel loading title="Đang tải bài nộp" message="Hệ thống đang lấy danh sách hồ sơ thật từ PostgreSQL."/>;
  if(dataError&&queue.length===0)return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={()=>void refreshAcademicData()}/>;
  if(queue.length===0)return <StatePanel title="Chưa có bài để chấm" message="Không tìm thấy hồ sơ học sinh phù hợp. Hãy kiểm tra lớp, nhiệm vụ hoặc trạng thái nộp bài." actionLabel="Về bàn giáo viên" onAction={()=>onNavigate('teacher-dashboard')}/>;
  if(!currentPortfolio||!assignment)return <StatePanel title="Dữ liệu bài nộp không đầy đủ" message="Hồ sơ không còn liên kết với nhiệm vụ hợp lệ. Hãy tải lại dữ liệu." actionLabel="Tải lại" onAction={()=>void refreshAcademicData()}/>;

  const createFeedback=()=>{
    const comment=feedbackText.trim();
    if(!comment){addToast({type:'warning',title:'Chưa có nội dung phản hồi',message:'Hãy nhập nhận xét trước khi gửi.'});return;}
    if(!selectedVersion){addToast({type:'warning',title:'Học sinh chưa nộp phiên bản',message:'Chỉ phản hồi sau khi học sinh đã tạo snapshot.'});return;}
    addAnchoredFeedback({
      assignmentId:assignment.id,
      studentId:currentPortfolio.studentId,
      versionNumber:selectedVersion,
      axisId:activeAxisId,
      selectedSnippet:selectedText,
      comment,
      authorId:currentUser.id,
      authorName:currentUser.name,
      authorRole:evaluatorRole
    });
    setFeedbackText(''); setSelectedText('');
    addToast({type:'success',title:'Đã gửi phản hồi',message:'Nhận xét đang được lưu vào hồ sơ học sinh.'});
  };

  const saveRubric=()=>{
    if(!selectedVersion){addToast({type:'warning',title:'Chưa có phiên bản để chấm',message:'Học sinh cần nộp ít nhất v1.0.'});return;}
    if((rubric.criteria||[]).some(criterion=>(rubricScores[criterion.id]||0)<1)){
      addToast({type:'warning',title:'Rubric chưa hoàn tất',message:'Hãy chọn mức 1–4 cho tất cả tiêu chí.'});return;
    }
    const criterionScores=Object.fromEntries((rubric.criteria||[]).map(criterion=>{
      const level=rubricScores[criterion.id]||0;
      return [criterion.id,{level,score:level*Number(criterion.weight||1),note:''}];
    }));
    submitRubric({
      assignmentId:assignment.id,
      studentId:currentPortfolio.studentId,
      versionNumber:selectedVersion,
      evaluatorId:currentUser.id,
      evaluatorName:currentUser.name,
      evaluatorRole,
      criterionScores,
      overallFeedback:overallFeedback.trim(),
      totalScore,
      maxScore
    });
    addToast({type:'success',title:'Đã gửi đánh giá rubric',message:`Điểm ${totalScore}/${maxScore} đang được lưu vào hệ thống.`});
  };

  const captureSelection=()=>{
    const text=window.getSelection()?.toString().trim()||'';
    if(text.length>=5)setSelectedText(text.slice(0,1000));
  };
  const changeStudent=(offset:number)=>{
    const next=currentIndex+offset;
    if(next>=0&&next<queue.length)setCurrentIndex(next);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
      <header className="border-b border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3"><Button size="sm" variant="ghost" onClick={()=>onNavigate('teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button><div><div className="text-xs font-semibold text-indigo-700">{evaluatorRole==='peer'?'Phản biện đồng đẳng':'Đánh giá của giáo viên'}</div><h1 className="text-lg font-bold text-slate-900">{assignment.title}</h1><p className="text-xs text-slate-500">{literatureText?`${literatureText.title} — ${literatureText.author}`:'Ngữ liệu chưa khả dụng'}</p></div></div>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentIndex===0} onClick={()=>changeStudent(-1)} leftIcon={<ChevronLeftIcon className="h-4 w-4"/>}>Trước</Button><span className="text-xs font-semibold text-slate-500">{currentIndex+1}/{queue.length}</span><Button size="sm" variant="outline" disabled={currentIndex>=queue.length-1} onClick={()=>changeStudent(1)}>Sau <ChevronRightIcon className="ml-1 h-4 w-4"/></Button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-3 sm:p-5 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
        <aside className="space-y-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><Avatar name={currentPortfolio.studentName} size="md"/><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-900">{currentPortfolio.studentName}</div><div className="text-xs text-slate-500">{currentPortfolio.className||'Chưa gán lớp'}</div></div></div>
            <div className="mt-3"><label className="text-[11px] font-semibold text-slate-500">Phiên bản đang xem</label><select value={selectedVersion} onChange={e=>setSelectedVersion(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"><option value="">Bản nháp hiện tại</option>{currentPortfolio.versions.map(version=><option key={version.id} value={version.versionNumber}>{version.versionNumber}</option>)}</select></div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Học sinh trong hàng đợi</div><div className="max-h-[55vh] space-y-1 overflow-y-auto">{queue.map((item,index)=><button key={item.id} onClick={()=>setCurrentIndex(index)} className={`w-full rounded-xl px-3 py-2.5 text-left text-xs ${index===currentIndex?'bg-slate-900 text-white':'hover:bg-slate-100'}`}><div className="truncate font-semibold">{item.studentName}</div><div className={`mt-0.5 ${index===currentIndex?'text-slate-300':'text-slate-400'}`}>{item.className||'—'} • {item.versions.length?item.versions[item.versions.length-1].versionNumber:'Chưa nộp'}</div></button>)}</div></section>
        </aside>

        <main className="space-y-4">
          {dataError&&<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Dữ liệu có thể chưa mới nhất: {dataError}</div>}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">{POETIC_AXES.map(axis=><button key={axis.id} onClick={()=>setActiveAxisId(axis.id)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeAxisId===axis.id?'bg-indigo-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{axis.shortName}</button>)}</div>
            <div className="border-t border-slate-100 pt-4"><div className="mb-2 flex items-center justify-between gap-2"><h2 className="font-bold text-slate-900">{POETIC_AXES.find(axis=>axis.id===activeAxisId)?.title}</h2><Badge variant={selectedVersion?'blue':'slate'} size="sm">{selectedVersion||'Bản nháp'}</Badge></div><div onMouseUp={captureSelection} className="min-h-72 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-5 font-serif text-[15px] leading-8 text-slate-800">{activeResponse?.analysisText?.trim() || <span className="font-sans italic text-slate-400">Học sinh chưa viết nội dung ở trục này.</span>}</div>{activeResponse?.evidenceQuotes?.length>0&&<div className="mt-3 space-y-2"><div className="text-xs font-bold text-slate-600">Dẫn chứng</div>{activeResponse.evidenceQuotes.map(item=><blockquote key={item.id} className="rounded-lg border-l-2 border-indigo-300 bg-indigo-50/40 px-3 py-2 text-xs italic text-slate-600">{item.text}</blockquote>)}</div>}</div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600"/><h2 className="font-bold text-slate-900">Phản hồi đã có</h2></div>{currentFeedbacks.length===0?<p className="mt-3 text-xs text-slate-500">Chưa có phản hồi ở trục này.</p>:<div className="mt-3 space-y-2">{currentFeedbacks.map(item=><div key={item.id} className="rounded-xl bg-slate-50 p-3 text-xs"><strong>{item.authorName}</strong><span className="ml-2 text-slate-400">{item.versionNumber}</span><p className="mt-1 leading-5 text-slate-700">{item.comment}</p></div>)}</div>}</section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-slate-900"><ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600"/>Gửi phản hồi</h2>{selectedText&&<div className="mt-3 rounded-lg border-l-2 border-indigo-400 bg-indigo-50 px-3 py-2 text-xs italic text-slate-600">“{selectedText}”</div>}<textarea rows={5} value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Nêu điểm mạnh, chỗ cần sửa và gợi ý cụ thể…" className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><Button className="mt-2 w-full" variant="primary" disabled={!selectedVersion} onClick={createFeedback}>Gửi phản hồi</Button>{!selectedVersion&&<p className="mt-2 text-[11px] text-amber-600">Học sinh chưa có phiên bản đã nộp.</p>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-slate-900"><AcademicCapIcon className="h-5 w-5 text-emerald-600"/>Rubric</h2>{rubric.criteria.length===0?<p className="mt-3 text-xs text-slate-500">Chưa có rubric hoạt động.</p>:<div className="mt-3 space-y-3">{rubric.criteria.map(criterion=><div key={criterion.id}><div className="mb-1 text-xs font-semibold text-slate-700">{criterion.title}</div><div className="grid grid-cols-4 gap-1">{[1,2,3,4].map(level=><button key={level} onClick={()=>setRubricScores(prev=>({...prev,[criterion.id]:level}))} className={`rounded-lg border py-2 text-xs font-bold ${rubricScores[criterion.id]===level?'border-emerald-600 bg-emerald-600 text-white':'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{level}</button>)}</div></div>)}</div>}<textarea rows={3} value={overallFeedback} onChange={e=>setOverallFeedback(e.target.value)} placeholder="Nhận xét tổng thể…" className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500"/><div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-500">Tổng điểm</span><strong className="text-lg text-slate-900">{totalScore}/{maxScore}</strong></div><Button className="mt-2 w-full" variant="academic" disabled={!selectedVersion||rubric.criteria.length===0} onClick={saveRubric}>Gửi đánh giá rubric</Button></section>
        </aside>
      </div>
    </div>
  );
};
