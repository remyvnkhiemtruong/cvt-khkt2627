import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PortfolioVersion, PoeticAxisId } from '../types';
import { computeAxisDiff, type DiffSegment } from '../utils/diffEngine';
import { Button } from '../components/ui';
import {
  ArrowLeftIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

interface VersionDiffViewProps {
  assignmentId?: string;
  studentId?: string;
  v1Number?: string;
  v2Number?: string;
  onNavigate: (view: string, extraParams?: any) => void;
}

const StatePanel: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}> = ({ title, message, actionLabel, onAction, loading }) => (
  <div className="mx-auto mt-16 max-w-md p-6 text-center space-y-3">
    {loading && (
      <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
    )}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
    {actionLabel && onAction && (
      <div className="pt-2">
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      </div>
    )}
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
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isStudent ? currentUser.id : (initialStudentId || '')
  );
  const [selectedV1, setSelectedV1] = useState(v1Number || '');
  const [selectedV2, setSelectedV2] = useState(v2Number || '');

  const assignment = assignments.find(item => item.id === assignmentId);
  const relevantPortfolios = useMemo(
    () => (assignment ? Object.values(portfolios).filter(item => item.assignmentId === assignment.id) : []),
    [assignment, portfolios]
  );

  useEffect(() => {
    if (!isStudent && initialStudentId && !selectedStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [isStudent, initialStudentId, selectedStudentId]);

  const portfolio = useMemo(() => {
    if (!assignment) return undefined;
    if (isStudent) return relevantPortfolios.find(item => item.studentId === currentUser.id);
    if (!selectedStudentId) return undefined;
    return relevantPortfolios.find(item => item.studentId === selectedStudentId);
  }, [assignment, relevantPortfolios, isStudent, currentUser.id, selectedStudentId]);

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

  const before = useMemo(
    () => versions.find(item => item.versionNumber === selectedV1) || versions[0],
    [versions, selectedV1]
  );
  const after = useMemo(
    () => versions.find(item => item.versionNumber === selectedV2) || versions[versions.length - 1],
    [versions, selectedV2]
  );

  const diffByAxis = useMemo(() => {
    if (!before || !after) return {};
    const result: Record<string, ReturnType<typeof computeAxisDiff>> = {};
    for (const axis of POETIC_AXES) {
      const v1Resp = before.responses?.[axis.id as PoeticAxisId];
      const v2Resp = after.responses?.[axis.id as PoeticAxisId];
      const v1Text = v1Resp?.analysisText || '';
      const v2Text = v2Resp?.analysisText || '';
      result[axis.id] = computeAxisDiff(v1Text, v2Text);
    }
    return result;
  }, [before, after]);

  const aggregateMetrics = useMemo(() => {
    let totalAdded = 0;
    let totalRemoved = 0;
    let changedAxesCount = 0;
    for (const axis of POETIC_AXES) {
      const diff = diffByAxis[axis.id];
      if (diff) {
        totalAdded += diff.wordsAdded;
        totalRemoved += diff.wordsRemoved;
        if (diff.wordsAdded > 0 || diff.wordsRemoved > 0) changedAxesCount += 1;
      }
    }
    return { totalAdded, totalRemoved, changedAxesCount };
  }, [diffByAxis]);

  if (isLoading && !assignment) {
    return <StatePanel loading title="Đang mở bản so sánh" message="Đang đối chiếu dữ liệu các phiên bản..." />;
  }
  if (dataError && !assignment) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (!assignment) {
    return (
      <StatePanel
        title="Không tìm thấy nhiệm vụ"
        message="Nhiệm vụ này không tồn tại hoặc đã bị xóa."
        actionLabel="Về danh sách nhiệm vụ"
        onAction={() => onNavigate('assignment-list')}
      />
    );
  }

  if (!isStudent && !selectedStudentId) {
    return (
      <div className="mx-auto max-w-2xl py-8 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h1 className="text-xl font-semibold text-slate-900">So sánh phiên bản</h1>
          <p className="text-xs text-slate-500 mt-1">Chọn một học sinh để xem tiến trình chỉnh sửa.</p>
        </div>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
          {relevantPortfolios.length === 0 ? (
            <p className="p-4 text-xs text-slate-500">Chưa có học sinh nào nộp bài cho nhiệm vụ này.</p>
          ) : (
            relevantPortfolios.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedStudentId(p.studentId)}
                className="w-full p-3.5 text-left text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900">{p.studentName}</div>
                  <div className="text-xs text-slate-500">Lớp {p.className}</div>
                </div>
                <span className="text-xs text-slate-500">{p.versions.length} phiên bản</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <StatePanel
        title="Chưa có hồ sơ"
        message="Học sinh chưa có hồ sơ bài làm cho nhiệm vụ này."
        actionLabel="Quay lại"
        onAction={() => onNavigate('portfolio-list')}
      />
    );
  }

  if (versions.length < 2) {
    return (
      <StatePanel
        title="Chưa đủ phiên bản để so sánh"
        message={
          versions.length === 0
            ? 'Chưa có bản nộp nào. Cần nộp ít nhất 2 phiên bản để so sánh.'
            : `Hiện mới có 1 phiên bản (${versions[0].versionNumber}). Cần nộp thêm phiên bản sửa đổi.`
        }
        actionLabel={isStudent ? 'Quay lại bài viết' : 'Quay lại danh sách'}
        onAction={() => onNavigate(isStudent ? 'editor' : 'portfolio-list', { assignmentId: assignment.id })}
      />
    );
  }

  if (!before || !after) {
    return <StatePanel title="Lỗi phiên bản" message="Một trong hai phiên bản không còn tồn tại." />;
  }

  const sameVersion = before.id === after.id;
  const formatDate = (version: PortfolioVersion) => new Date(version.createdAt).toLocaleDateString('vi-VN');

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate(isStudent ? 'portfolio-list' : 'teacher-dashboard')}
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Quay lại
            </Button>
            <span>·</span>
            <span>{assignment.title}</span>
            <span>·</span>
            <strong className="text-slate-700">{portfolio.studentName}</strong>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">So sánh phiên bản</h1>
        </div>

        <div className="flex items-center gap-2">
          {!isStudent && (
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {relevantPortfolios.map(p => (
                <option key={p.id} value={p.studentId}>
                  {p.studentName} ({p.className})
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<PrinterIcon className="h-4 w-4" />}>
            In
          </Button>
        </div>
      </div>

      {/* Version Selectors & Clean Summary Line */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Bản trước:</span>
            <select
              value={selectedV1}
              onChange={e => setSelectedV1(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {versions.map(version => (
                <option key={version.id} value={version.versionNumber}>
                  {version.versionNumber} ({formatDate(version)})
                </option>
              ))}
            </select>
          </label>

          <span className="text-slate-400">→</span>

          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Bản sau:</span>
            <select
              value={selectedV2}
              onChange={e => setSelectedV2(e.target.value)}
              className="bg-white border border-slate-300 rounded-md py-1 px-2 text-sm text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {versions.map(version => (
                <option key={version.id} value={version.versionNumber}>
                  {version.versionNumber} ({formatDate(version)})
                </option>
              ))}
            </select>
          </label>
        </div>

        {sameVersion && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Bạn đang chọn cùng một phiên bản ở hai bên. Vui lòng chọn hai phiên bản khác nhau.
          </div>
        )}

        {/* Compact Summary Line */}
        <div className="text-sm text-slate-600 border-l-2 border-slate-400 pl-3 py-1 bg-slate-50/70 rounded-r">
          +{aggregateMetrics.totalAdded} từ mới · −{aggregateMetrics.totalRemoved} từ lược bớt · {aggregateMetrics.changedAxesCount}/6 trục thay đổi
          {after.confidence ? ` · Mức tự tin bản sau: ${after.confidence}/5` : ''}
        </div>

        {/* Metadata of After Version */}
        {(after.revisionReason || after.changeSummary) && (
          <div className="text-xs text-slate-600 space-y-0.5 pt-1">
            {after.changeSummary && <div><strong>Đã sửa:</strong> {after.changeSummary}</div>}
            {after.revisionReason && <div><strong>Lí do sửa:</strong> {after.revisionReason}</div>}
          </div>
        )}
      </div>

      {/* Axis Diff Sections */}
      <div className="space-y-6">
        {POETIC_AXES.map(axis => {
          const diffResult = diffByAxis[axis.id];
          const hasChange = diffResult && (diffResult.wordsAdded > 0 || diffResult.wordsRemoved > 0);
          const related = feedbacks.filter(
            item =>
              item.assignmentId === assignment.id &&
              item.studentId === portfolio.studentId &&
              item.axisId === axis.id
          );

          return (
            <section key={axis.id} className="border border-slate-200 rounded-md bg-white overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">{axis.title}</h2>
                  <span className="text-xs text-slate-500">
                    {hasChange
                      ? `(+${diffResult.wordsAdded}, −${diffResult.wordsRemoved})`
                      : '(không đổi)'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {hasChange ? 'Đã chỉnh sửa' : 'Giữ nguyên'}
                </span>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="p-4">
                  <div className="mb-2 text-xs font-medium text-slate-500">{before.versionNumber}</div>
                  <div className="min-h-16 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                    {diffResult?.v1Text || <span className="italic text-slate-400">Chưa có nội dung</span>}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/30">
                  <div className="mb-2 text-xs font-medium text-slate-700">{after.versionNumber}</div>
                  <div className="min-h-16 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
                    {diffResult?.diffSegments && diffResult.diffSegments.length > 0 ? (
                      diffResult.diffSegments.map((seg: DiffSegment, idx: number) => {
                        if (seg.type === 'added') {
                          return (
                            <span key={idx} className="bg-emerald-100 text-emerald-950 px-0.5 rounded">
                              {seg.value}
                            </span>
                          );
                        }
                        if (seg.type === 'removed') {
                          return (
                            <span key={idx} className="bg-rose-100 text-rose-900 line-through px-0.5 rounded opacity-70">
                              {seg.value}
                            </span>
                          );
                        }
                        return <span key={idx}>{seg.value}</span>;
                      })
                    ) : (
                      <span className="italic text-slate-400">Chưa có nội dung</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Related feedback notes */}
              {related.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/60 text-xs text-slate-600 space-y-1">
                  <div className="font-medium text-slate-700">Phản hồi đã nhận ở trục này:</div>
                  {related.map(f => (
                    <div key={f.id} className="pl-2 border-l-2 border-slate-300">
                      <span>{f.authorName || (f.authorRole === 'teacher' ? 'Giáo viên' : 'Bạn học')}: </span>
                      <span>{f.comment}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
