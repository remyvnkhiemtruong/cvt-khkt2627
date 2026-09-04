import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PortfolioVersion, PoeticAxisId } from '../types';
import { computeAxisDiff, type DiffSegment } from '../utils/diffEngine';
import { Button } from '../components/ui';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface VersionDiffViewProps {
  assignmentId?: string;
  studentId?: string;
  v1Number?: string;
  v2Number?: string;
  onNavigate: (view: string, extraParams?: unknown) => void;
}

const StatePanel: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}> = ({ title, message, actionLabel, onAction, loading }) => (
  <div className="mx-auto mt-16 max-w-md space-y-3 p-6 text-center">
    {loading && <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    <p className="text-sm leading-relaxed text-slate-500">{message}</p>
    {actionLabel && onAction && <div className="pt-2"><Button variant="primary" onClick={onAction}>{actionLabel}</Button></div>}
  </div>
);

export const VersionDiffView: React.FC<VersionDiffViewProps> = ({
  assignmentId = '',
  studentId: initialStudentId,
  v1Number,
  v2Number,
  onNavigate
}) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const { assignments, portfolios, feedbacks, isLoading, dataError, refreshAcademicData } = usePortfolio();
  const isStudent = currentUser.role === 'student';
  const [selectedStudentId, setSelectedStudentId] = useState(isStudent ? currentUser.id : (initialStudentId || ''));
  const [selectedV1, setSelectedV1] = useState(v1Number || '');
  const [selectedV2, setSelectedV2] = useState(v2Number || '');

  const assignment = assignments.find(item => item.id === assignmentId);
  const relevantPortfolios = useMemo(
    () => assignment ? Object.values(portfolios).filter(item => item.assignmentId === assignment.id) : [],
    [assignment, portfolios]
  );

  useEffect(() => {
    if (!isStudent && initialStudentId) setSelectedStudentId(initialStudentId);
  }, [isStudent, initialStudentId]);

  const portfolio = useMemo(() => {
    if (!assignment) return undefined;
    const targetStudentId = isStudent ? currentUser.id : selectedStudentId;
    if (!targetStudentId) return undefined;
    return relevantPortfolios.find(item => item.studentId === targetStudentId);
  }, [assignment, relevantPortfolios, isStudent, currentUser.id, selectedStudentId]);

  const versions = useMemo(() => portfolio?.versions || [], [portfolio?.versions]);
  const requestedBeforeMissing = Boolean(v1Number && versions.length && !versions.some(item => item.versionNumber === v1Number));
  const requestedAfterMissing = Boolean(v2Number && versions.length && !versions.some(item => item.versionNumber === v2Number));

  useEffect(() => {
    if (versions.length === 0) return;
    if (!selectedV1 && !v1Number) setSelectedV1(versions[0].versionNumber);
    if (!selectedV2 && !v2Number) setSelectedV2(versions[versions.length - 1].versionNumber);
  }, [versions, selectedV1, selectedV2, v1Number, v2Number]);

  useEffect(() => {
    if (v1Number) setSelectedV1(v1Number);
    if (v2Number) setSelectedV2(v2Number);
  }, [v1Number, v2Number]);

  const before = useMemo(() => versions.find(item => item.versionNumber === selectedV1), [versions, selectedV1]);
  const after = useMemo(() => versions.find(item => item.versionNumber === selectedV2), [versions, selectedV2]);

  const diffByAxis = useMemo(() => {
    if (!before || !after) return {};
    const result: Record<string, ReturnType<typeof computeAxisDiff>> = {};
    for (const axis of POETIC_AXES) {
      const v1Text = before.responses?.[axis.id as PoeticAxisId]?.analysisText || '';
      const v2Text = after.responses?.[axis.id as PoeticAxisId]?.analysisText || '';
      result[axis.id] = computeAxisDiff(axis.id, v1Text, v2Text);
    }
    return result;
  }, [before, after]);

  const aggregateMetrics = useMemo(() => {
    let totalAdded = 0;
    let totalRemoved = 0;
    let changedAxesCount = 0;
    for (const axis of POETIC_AXES) {
      const diff = diffByAxis[axis.id];
      if (!diff) continue;
      totalAdded += diff.wordsAdded;
      totalRemoved += diff.wordsRemoved;
      if (diff.wordsAdded > 0 || diff.wordsRemoved > 0) changedAxesCount += 1;
    }
    return { totalAdded, totalRemoved, changedAxesCount };
  }, [diffByAxis]);

  if (isLoading && !assignment) return <StatePanel loading title="Đang mở bản so sánh" message="Đang đối chiếu dữ liệu các phiên bản..." />;
  if (dataError && !assignment) return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  if (!assignment) return <StatePanel title="Không tìm thấy nhiệm vụ" message="Nhiệm vụ này không tồn tại hoặc bạn không còn quyền truy cập." actionLabel="Về danh sách nhiệm vụ" onAction={() => onNavigate('assignment-list')} />;

  if (!isStudent && !selectedStudentId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="border-b border-slate-200 pb-3">
          <h1 className="text-xl font-semibold text-slate-900">So sánh phiên bản</h1>
          <p className="mt-1 text-sm text-slate-500">Chọn một học sinh để xem tiến trình chỉnh sửa.</p>
        </div>
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
          {relevantPortfolios.length === 0 ? <p className="p-4 text-sm text-slate-500">Chưa có học sinh nào nộp bài cho nhiệm vụ này.</p> : relevantPortfolios.map(p => (
            <button key={p.id} type="button" onClick={() => setSelectedStudentId(p.studentId)} className="flex w-full items-center justify-between p-3.5 text-left text-sm transition-colors hover:bg-slate-50">
              <div><div className="font-medium text-slate-900">{p.studentName}</div><div className="text-sm text-slate-500">Lớp {p.className}</div></div>
              <span className="text-sm text-slate-500">{p.versions.length} phiên bản</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio) return <StatePanel title="Chưa có hồ sơ" message="Không tìm thấy hồ sơ bài làm thuộc phạm vi bạn được phép xem." actionLabel="Quay lại" onAction={() => onNavigate('portfolio-list')} />;
  if (versions.length < 2) return <StatePanel title="Chưa đủ phiên bản để so sánh" message={versions.length === 0 ? 'Chưa có bản nộp nào. Cần nộp ít nhất 2 phiên bản để so sánh.' : `Hiện mới có 1 phiên bản (${versions[0].versionNumber}). Cần nộp thêm phiên bản sửa đổi.`} actionLabel={isStudent ? 'Quay lại bài viết' : 'Quay lại danh sách'} onAction={() => onNavigate(isStudent ? 'editor' : 'portfolio-list', { assignmentId: assignment.id })} />;
  if (requestedBeforeMissing || requestedAfterMissing) return <StatePanel title="Phiên bản không tồn tại" message="Phiên bản được yêu cầu không còn tồn tại hoặc không thuộc hồ sơ này." />;
  if (!before || !after) return <StatePanel title="Chọn phiên bản" message="Hãy chọn hai phiên bản hợp lệ để so sánh." />;

  const sameVersion = before.id === after.id;
  const formatDate = (version: PortfolioVersion) => new Date(version.createdAt).toLocaleDateString('vi-VN');

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Button size="sm" variant="ghost" onClick={() => onNavigate(isStudent ? 'portfolio-list' : 'teacher-dashboard')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>Quay lại</Button>
            <span>·</span><span>{assignment.title}</span><span>·</span><strong className="text-slate-700">{portfolio.studentName}</strong>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">So sánh phiên bản</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isStudent && <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none">{relevantPortfolios.map(p => <option key={p.id} value={p.studentId}>{p.studentName} ({p.className})</option>)}</select>}
          <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<PrinterIcon className="h-4 w-4" />}>In</Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2"><span className="text-sm text-slate-500">Bản trước:</span><select value={selectedV1} onChange={e => setSelectedV1(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-slate-500 focus:outline-none">{versions.map(version => <option key={version.id} value={version.versionNumber}>{version.versionNumber} ({formatDate(version)})</option>)}</select></label>
          <span className="text-slate-400">→</span>
          <label className="flex items-center gap-2"><span className="text-sm text-slate-500">Bản sau:</span><select value={selectedV2} onChange={e => setSelectedV2(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-slate-500 focus:outline-none">{versions.map(version => <option key={version.id} value={version.versionNumber}>{version.versionNumber} ({formatDate(version)})</option>)}</select></label>
        </div>
        {sameVersion && <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Bạn đang chọn cùng một phiên bản ở hai bên. Vui lòng chọn hai phiên bản khác nhau.</div>}
        <div className="rounded-r border-l-2 border-slate-400 bg-slate-50/70 py-1 pl-3 text-sm text-slate-600">+{aggregateMetrics.totalAdded} từ mới · −{aggregateMetrics.totalRemoved} từ lược bớt · {aggregateMetrics.changedAxesCount}/6 trục thay đổi{after.confidence ? ` · Mức tự tin bản sau: ${after.confidence}/5` : ''}</div>
        {(after.revisionReason || after.changeSummary) && <div className="space-y-0.5 pt-1 text-sm text-slate-600">{after.changeSummary && <div><strong>Đã sửa:</strong> {after.changeSummary}</div>}{after.revisionReason && <div><strong>Lí do sửa:</strong> {after.revisionReason}</div>}</div>}
      </div>

      <div className="space-y-6">
        {POETIC_AXES.map(axis => {
          const diffResult = diffByAxis[axis.id];
          const hasChange = Boolean(diffResult && (diffResult.wordsAdded > 0 || diffResult.wordsRemoved > 0));
          const causal = feedbacks.filter(item => item.assignmentId === assignment.id && item.studentId === portfolio.studentId && item.axisId === axis.id && item.versionNumber === before.versionNumber && (!item.resolvedByVersionId || item.resolvedByVersionId === after.id));
          return (
            <section key={axis.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-900">{axis.title}</h2><span className="text-sm text-slate-500">{hasChange ? `(+${diffResult?.wordsAdded || 0}, −${diffResult?.wordsRemoved || 0})` : '(không đổi)'}</span></div>
                <span className="text-sm text-slate-500">{hasChange ? 'Đã chỉnh sửa' : 'Giữ nguyên'}</span>
              </div>
              <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="p-4"><div className="mb-2 text-sm font-medium text-slate-500">{before.versionNumber}</div><div className="min-h-16 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{diffResult?.v1Text || <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
                <div className="bg-slate-50/30 p-4"><div className="mb-2 text-sm font-medium text-slate-700">{after.versionNumber}</div><div className="min-h-16 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">{diffResult?.diffSegments?.length ? diffResult.diffSegments.map((seg: DiffSegment, idx: number) => seg.type === 'added' ? <span key={idx} className="rounded bg-emerald-100 px-0.5 text-emerald-950">{seg.value}</span> : seg.type === 'removed' ? <span key={idx} className="rounded bg-rose-100 px-0.5 text-rose-900 line-through opacity-70">{seg.value}</span> : <span key={idx}>{seg.value}</span>) : <span className="italic text-slate-400">Chưa có nội dung</span>}</div></div>
              </div>
              {causal.length > 0 && <div className="space-y-1 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-sm text-slate-600"><div className="font-medium text-slate-700">Phản hồi liên quan đến lần sửa này:</div>{causal.map(f => <div key={f.id} className="border-l-2 border-slate-300 pl-2"><span>{f.authorName || (f.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học')}: </span><span>{f.comment}</span></div>)}</div>}
            </section>
          );
        })}
      </div>
    </div>
  );
};
