import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PortfolioVersion } from '../types';
import { Badge, Button } from '../components/ui';
import { ArrowLeftIcon, ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface VersionDiffViewProps {
  assignmentId?: string;
  v1Number?: string;
  v2Number?: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

const StatePanel: React.FC<{title:string;message:string;actionLabel?:string;onAction?:()=>void;loading?:boolean}> = ({title,message,actionLabel,onAction,loading}) => (
  <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    {loading ? <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/> : <ExclamationTriangleIcon className="mx-auto mb-4 h-9 w-9 text-slate-400"/>}
    <h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    {actionLabel && onAction && <Button className="mt-5" variant="primary" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

export const VersionDiffView: React.FC<VersionDiffViewProps> = ({ assignmentId = '', v1Number, v2Number, onNavigate }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { assignments, portfolios, feedbacks, isLoading, dataError, refreshAcademicData } = usePortfolio();
  const [selectedV1, setSelectedV1] = useState(v1Number || '');
  const [selectedV2, setSelectedV2] = useState(v2Number || '');

  const assignment = assignments.find(item => item.id === assignmentId);
  const relevantPortfolios = useMemo(
    () => assignment ? Object.values(portfolios).filter(item => item.assignmentId === assignment.id) : [],
    [assignment, portfolios]
  );
  const portfolio = useMemo(() => {
    if (!assignment) return undefined;
    return relevantPortfolios.find(item => item.studentId === currentUser.id) || relevantPortfolios[0];
  }, [assignment, relevantPortfolios, currentUser.id]);
  const versions = useMemo(() => portfolio?.versions || [], [portfolio?.versions]);

  useEffect(() => {
    if (versions.length === 0) return;
    const validBefore = versions.some(item => item.versionNumber === selectedV1);
    const validAfter = versions.some(item => item.versionNumber === selectedV2);
    if (!validBefore) {
      const requested = v1Number ? versions.find(item => item.versionNumber === v1Number) : undefined;
      setSelectedV1(requested?.versionNumber || versions[0].versionNumber);
    }
    if (!validAfter) {
      const requested = v2Number ? versions.find(item => item.versionNumber === v2Number) : undefined;
      setSelectedV2(requested?.versionNumber || versions[versions.length - 1].versionNumber);
    }
  }, [versions, selectedV1, selectedV2, v1Number, v2Number]);

  const before = versions.find(item => item.versionNumber === selectedV1);
  const after = versions.find(item => item.versionNumber === selectedV2);

  const metrics = useMemo(() => {
    if (!before || !after) return { beforeWords:0, afterWords:0, changedAxes:0 };
    let beforeWords=0, afterWords=0, changedAxes=0;
    for (const axis of POETIC_AXES) {
      const a=String(before.responses?.[axis.id]?.analysisText || '');
      const b=String(after.responses?.[axis.id]?.analysisText || '');
      beforeWords += countWords(a); afterWords += countWords(b);
      if (a.trim() !== b.trim()) changedAxes += 1;
    }
    return { beforeWords, afterWords, changedAxes };
  }, [before, after]);

  if (isLoading && !assignment) return <StatePanel loading title="Đang tải phiên bản" message="Hệ thống đang đồng bộ các snapshot đã lưu."/>;
  if (dataError && !assignment) return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={()=>void refreshAcademicData()}/>;
  if (!assignment) return <StatePanel title="Không tìm thấy nhiệm vụ" message="Nhiệm vụ cần so sánh không còn khả dụng hoặc bạn không có quyền truy cập." actionLabel="Quay lại" onAction={()=>onNavigate('portfolio-list')}/>;
  if (!portfolio) return <StatePanel title="Không có hồ sơ phù hợp" message="Chưa tìm thấy hồ sơ học tập cho nhiệm vụ này." actionLabel="Tải lại dữ liệu" onAction={()=>void refreshAcademicData()}/>;
  if (versions.length < 2) return <StatePanel title="Chưa đủ phiên bản để so sánh" message={versions.length === 0 ? 'Hồ sơ chưa có snapshot nào. Hãy nộp v1.0 trước.' : `Hiện mới có ${versions[0].versionNumber}. Hãy chỉnh sửa và tạo thêm một phiên bản để xem sự tiến bộ.`} actionLabel={currentUser.role==='student'?'Quay lại bài viết':'Quay lại danh sách'} onAction={()=>onNavigate(currentUser.role==='student'?'editor':'portfolio-list',{assignmentId:assignment.id})}/>;
  if (!before || !after) return <StatePanel title="Phiên bản không hợp lệ" message="Một trong hai phiên bản được chọn không còn tồn tại. Hãy chọn lại."/>;

  const sameVersion = before.id === after.id;
  const formatDate = (version: PortfolioVersion) => new Date(version.createdAt).toLocaleString('vi-VN');

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2"><Button size="sm" variant="ghost" onClick={()=>onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button><span className="text-xs text-slate-400">/</span><span className="text-xs font-semibold text-slate-600">{assignment.title}</span></div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ArrowsRightLeftIcon className="h-6 w-6 text-indigo-600"/>So sánh phiên bản thật</h1>
            <p className="mt-1 text-sm text-slate-500">Đối chiếu nội dung đã đóng băng trong PostgreSQL theo từng trục thi pháp.</p>
          </div>
          <Button variant="outline" onClick={()=>window.print()} leftIcon={<PrinterIcon className="h-4 w-4"/>}>In / Xuất PDF</Button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Bản trước</span><select value={selectedV1} onChange={e=>setSelectedV1(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500">{versions.map(version=><option key={version.id} value={version.versionNumber}>{version.versionNumber} — {formatDate(version)}</option>)}</select></label>
          <ArrowsRightLeftIcon className="mx-auto hidden h-5 w-5 text-slate-400 md:block"/>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Bản sau</span><select value={selectedV2} onChange={e=>setSelectedV2(e.target.value)} className="w-full rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-950 outline-none focus:border-indigo-500">{versions.map(version=><option key={version.id} value={version.versionNumber}>{version.versionNumber} — {formatDate(version)}</option>)}</select></label>
        </div>
        {sameVersion && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Bạn đang chọn cùng một phiên bản ở hai bên.</div>}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs"><div className="rounded-xl bg-slate-50 p-3"><div className="text-lg font-bold text-slate-900">{metrics.beforeWords}</div><div className="text-slate-500">Từ ở bản trước</div></div><div className="rounded-xl bg-indigo-50 p-3"><div className="text-lg font-bold text-indigo-800">{metrics.afterWords}</div><div className="text-indigo-600">Từ ở bản sau</div></div><div className="rounded-xl bg-emerald-50 p-3"><div className="text-lg font-bold text-emerald-800">{metrics.changedAxes}/6</div><div className="text-emerald-600">Trục có thay đổi</div></div></div>
      </section>

      <div className="space-y-4">
        {POETIC_AXES.map(axis => {
          const beforeText=String(before.responses?.[axis.id]?.analysisText || '');
          const afterText=String(after.responses?.[axis.id]?.analysisText || '');
          const changed=beforeText.trim()!==afterText.trim();
          const related=feedbacks.filter(item=>item.assignmentId===assignment.id && item.studentId===portfolio.studentId && item.axisId===axis.id);
          return <section key={axis.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3"><div><div className="text-sm font-bold text-slate-900">{axis.title}</div><div className="text-[11px] text-slate-500">{changed?'Nội dung đã thay đổi':'Không thay đổi giữa hai bản'}</div></div><Badge variant={changed?'blue':'slate'} size="sm">{changed?'Đã chỉnh sửa':'Giữ nguyên'}</Badge></div>
            <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-4"><div className="mb-2 text-xs font-bold text-slate-500">{before.versionNumber}</div><div className="min-h-24 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{beforeText || <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
              <div className={`p-4 ${changed?'bg-indigo-50/30':''}`}><div className="mb-2 text-xs font-bold text-indigo-600">{after.versionNumber}</div><div className="min-h-24 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">{afterText || <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
            </div>
            {related.length>0 && <div className="border-t border-slate-100 px-4 py-3"><div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"><ChatBubbleLeftRightIcon className="h-4 w-4"/>Phản hồi liên quan</div><div className="space-y-2">{related.slice(0,4).map(item=><div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><strong className="text-slate-800">{item.authorName}:</strong> {item.comment}</div>)}</div></div>}
          </section>;
        })}
      </div>
    </div>
  );
};
