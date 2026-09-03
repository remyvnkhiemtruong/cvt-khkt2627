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
  <div className="mx-auto mt-10 max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center">
    {loading ? <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"/> : <ExclamationTriangleIcon className="mx-auto mb-3 h-8 w-8 text-slate-400"/>}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2><p className="mt-1.5 text-xs leading-5 text-slate-500">{message}</p>
    {actionLabel && onAction && <Button className="mt-4" variant="primary" onClick={onAction}>{actionLabel}</Button>}
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
  if (versions.length < 2) return <StatePanel title="Chưa đủ phiên bản để so sánh" message={versions.length === 0 ? 'Hồ sơ chưa có bản lưu nào. Hãy nộp v1.0 trước.' : `Hiện mới có ${versions[0].versionNumber}. Hãy chỉnh sửa và lưu thêm một phiên bản để so sánh tiến bộ.`} actionLabel={currentUser.role==='student'?'Quay lại bài viết':'Quay lại danh sách'} onAction={()=>onNavigate(currentUser.role==='student'?'editor':'portfolio-list',{assignmentId:assignment.id})}/>;
  if (!before || !after) return <StatePanel title="Phiên bản không hợp lệ" message="Một trong hai phiên bản được chọn không còn tồn tại. Hãy chọn lại."/>;

  const sameVersion = before.id === after.id;
  const formatDate = (version: PortfolioVersion) => new Date(version.createdAt).toLocaleString('vi-VN');

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={()=>onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4"/>}>Quay lại</Button>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs text-slate-600 truncate max-w-xs">{assignment.title}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">So sánh phiên bản</h1>
          <p className="mt-0.5 text-xs text-slate-500">Đối chiếu nội dung giữa hai phiên bản theo từng trục thi pháp.</p>
        </div>
        <Button variant="outline" size="sm" onClick={()=>window.print()} leftIcon={<PrinterIcon className="h-4 w-4"/>}>In / Xuất PDF</Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Bản trước</span><select value={selectedV1} onChange={e=>setSelectedV1(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500">{versions.map(version=><option key={version.id} value={version.versionNumber}>{version.versionNumber} — {formatDate(version)}</option>)}</select></label>
          <ArrowsRightLeftIcon className="mx-auto hidden h-4 w-4 text-slate-400 md:block"/>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Bản sau</span><select value={selectedV2} onChange={e=>setSelectedV2(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500">{versions.map(version=><option key={version.id} value={version.versionNumber}>{version.versionNumber} — {formatDate(version)}</option>)}</select></label>
        </div>
        {sameVersion && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Bạn đang chọn cùng một phiên bản ở hai bên.</div>}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-md bg-slate-50 p-2.5"><div className="text-base font-bold text-slate-900">{metrics.beforeWords}</div><div className="text-slate-500 text-xs mt-0.5">Từ ở bản trước</div></div>
          <div className="rounded-md bg-slate-50 p-2.5"><div className="text-base font-bold text-slate-900">{metrics.afterWords}</div><div className="text-slate-500 text-xs mt-0.5">Từ ở bản sau</div></div>
          <div className="rounded-md bg-slate-50 p-2.5"><div className="text-base font-bold text-slate-900">{metrics.changedAxes}/6</div><div className="text-slate-500 text-xs mt-0.5">Trục có thay đổi</div></div>
        </div>
      </section>

      <div className="space-y-4">
        {POETIC_AXES.map(axis => {
          const beforeText=String(before.responses?.[axis.id]?.analysisText || '');
          const afterText=String(after.responses?.[axis.id]?.analysisText || '');
          const changed=beforeText.trim()!==afterText.trim();
          const related=feedbacks.filter(item=>item.assignmentId===assignment.id && item.studentId===portfolio.studentId && item.axisId===axis.id);
          return <section key={axis.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-900">{axis.title}</div>
                <div className="text-xs text-slate-500">{changed?'Nội dung đã thay đổi':'Không thay đổi giữa hai bản'}</div>
              </div>
              <Badge variant={changed?'blue':'slate'} size="sm">{changed?'Đã chỉnh sửa':'Giữ nguyên'}</Badge>
            </div>
            <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-4"><div className="mb-1.5 text-xs font-medium text-slate-500">{before.versionNumber}</div><div className="min-h-20 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-700">{beforeText || <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
              <div className={`p-4 ${changed?'bg-indigo-50/20':''}`}><div className="mb-1.5 text-xs font-medium text-indigo-700">{after.versionNumber}</div><div className="min-h-20 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-800">{afterText || <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
            </div>
            {related.length>0 && <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50/50"><div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600"><ChatBubbleLeftRightIcon className="h-3.5 w-3.5"/>Phản hồi liên quan</div><div className="space-y-1.5">{related.slice(0,4).map(item=><div key={item.id} className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"><strong className="text-slate-800">{item.authorName}:</strong> {item.comment}</div>)}</div></div>}
          </section>;
        })}
      </div>
    </div>
  );
};
