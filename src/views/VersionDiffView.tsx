import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { PortfolioVersion, PoeticAxisId } from '../types';
import { computeAxisDiff, type DiffSegment } from '../utils/diffEngine';
import { Badge, Button } from '../components/ui';
import {
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  SparklesIcon,
  UserIcon
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
  <div className="mx-auto mt-10 max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center">
    {loading ? (
      <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    ) : (
      <ExclamationTriangleIcon className="mx-auto mb-3 h-8 w-8 text-slate-400" />
    )}
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    <p className="mt-1.5 text-xs leading-5 text-slate-500">{message}</p>
    {actionLabel && onAction && (
      <Button className="mt-4" variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
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

  // If teacher/admin hasn't selected student yet and there is an initialStudentId, use it
  useEffect(() => {
    if (!isStudent && initialStudentId && !selectedStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [isStudent, initialStudentId, selectedStudentId]);

  // DO NOT fall back to relevantPortfolios[0] for teacher/admin!
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

  const before = versions.find(item => item.versionNumber === selectedV1);
  const after = versions.find(item => item.versionNumber === selectedV2);

  const diffByAxis: Partial<Record<PoeticAxisId, ReturnType<typeof computeAxisDiff>>> = useMemo(() => {
    if (!before || !after) return {};
    const res: Partial<Record<PoeticAxisId, ReturnType<typeof computeAxisDiff>>> = {};
    for (const axis of POETIC_AXES) {
      const bText = String(before.responses?.[axis.id]?.analysisText || '').normalize('NFC');
      const aText = String(after.responses?.[axis.id]?.analysisText || '').normalize('NFC');
      res[axis.id] = computeAxisDiff(axis.id, bText, aText);
    }
    return res;
  }, [before, after]);

  const aggregateMetrics = useMemo(() => {
    let totalAdded = 0;
    let totalRemoved = 0;
    let changedAxesCount = 0;
    for (const axis of POETIC_AXES) {
      const d = diffByAxis[axis.id];
      if (d) {
        totalAdded += d.wordsAdded;
        totalRemoved += d.wordsRemoved;
        if (d.wordsAdded > 0 || d.wordsRemoved > 0) changedAxesCount += 1;
      }
    }
    return { totalAdded, totalRemoved, changedAxesCount };
  }, [diffByAxis]);

  if (isLoading && !assignment) {
    return <StatePanel loading title="Đang tải phiên bản" message="Hệ thống đang đồng bộ các snapshot đã lưu." />;
  }
  if (dataError && !assignment) {
    return <StatePanel title="Không thể tải dữ liệu" message={dataError} actionLabel="Thử lại" onAction={() => void refreshAcademicData()} />;
  }
  if (!assignment) {
    return (
      <StatePanel
        title="Không tìm thấy nhiệm vụ"
        message="Nhiệm vụ cần so sánh không tồn tại hoặc bạn không có quyền truy cập."
        actionLabel="Quay lại"
        onAction={() => onNavigate(isStudent ? 'student-dashboard' : 'portfolio-list')}
      />
    );
  }

  // If teacher/admin and no student is selected yet: show student selector
  if (!isStudent && !selectedStudentId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="mb-2 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onNavigate('portfolio-list')} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
            Quay lại
          </Button>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs text-slate-600">{assignment.title}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Chọn học sinh để so sánh phiên bản</h2>
          <p className="text-xs text-slate-500 mb-4">
            Vui lòng chọn hồ sơ của một học sinh trong danh sách đã nộp bài tập này để tiến hành đối chiếu.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {relevantPortfolios.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Chưa có học sinh nào nộp bài tập này.</p>
            ) : (
              relevantPortfolios.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedStudentId(p.studentId)}
                  className="w-full flex items-center justify-between rounded-md border border-slate-200 p-3 text-left text-xs hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{p.studentName}</span>
                    <span className="text-slate-400">• Lớp: {p.className || '—'}</span>
                  </div>
                  <Badge variant="blue">{p.versions.length} phiên bản</Badge>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <StatePanel
        title="Không tìm thấy hồ sơ học sinh"
        message="Chưa tìm thấy hồ sơ học tập phù hợp với nhiệm vụ này."
        actionLabel="Tải lại dữ liệu"
        onAction={() => void refreshAcademicData()}
      />
    );
  }

  if (versions.length < 2) {
    return (
      <StatePanel
        title="Chưa đủ phiên bản để so sánh"
        message={
          versions.length === 0
            ? 'Hồ sơ chưa có bản nộp nào. Cần nộp ít nhất 2 phiên bản để thực hiện đối chiếu.'
            : `Hiện mới có 1 phiên bản (${versions[0].versionNumber}). Hãy nộp thêm phiên bản sửa đổi để theo dõi sự tiến bộ.`
        }
        actionLabel={isStudent ? 'Quay lại bài viết' : 'Quay lại danh sách'}
        onAction={() => onNavigate(isStudent ? 'editor' : 'portfolio-list', { assignmentId: assignment.id })}
      />
    );
  }

  if (!before || !after) {
    return <StatePanel title="Phiên bản không hợp lệ" message="Một trong hai phiên bản được chọn không còn tồn tại." />;
  }

  const sameVersion = before.id === after.id;
  const formatDate = (version: PortfolioVersion) => new Date(version.createdAt).toLocaleString('vi-VN');

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate(isStudent ? 'portfolio-list' : 'teacher-dashboard')}
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Quay lại
            </Button>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs text-slate-600 truncate max-w-xs">{assignment.title}</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800">{portfolio.studentName}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">So sánh tiến bộ qua các phiên bản</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Học sinh: <strong>{portfolio.studentName}</strong> • Đối chiếu thay đổi nội dung và xem lí do chỉnh sửa giữa 2 mốc nộp bài.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isStudent && (
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
            >
              {relevantPortfolios.map(p => (
                <option key={p.id} value={p.studentId}>
                  {p.studentName} ({p.className})
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<PrinterIcon className="h-4 w-4" />}>
            In / Xuất PDF
          </Button>
        </div>
      </div>

      {/* Version Selector & Summary Metrics */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Bản mốc trước (Baseline)</span>
            <select
              value={selectedV1}
              onChange={e => setSelectedV1(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
            >
              {versions.map(version => (
                <option key={version.id} value={version.versionNumber}>
                  {version.versionNumber} — {formatDate(version)}
                </option>
              ))}
            </select>
          </label>
          <ArrowsRightLeftIcon className="mx-auto hidden h-4 w-4 text-slate-400 md:block" />
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Bản sau (Revision)</span>
            <select
              value={selectedV2}
              onChange={e => setSelectedV2(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
            >
              {versions.map(version => (
                <option key={version.id} value={version.versionNumber}>
                  {version.versionNumber} — {formatDate(version)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {sameVersion && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Bạn đang chọn cùng một phiên bản ở cả hai bên. Vui lòng chọn hai phiên bản khác nhau để thấy sự khác biệt.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs border-t border-slate-100 pt-4">
          <div className="rounded-md bg-slate-50 p-2.5">
            <div className="text-base font-bold text-emerald-700">+{aggregateMetrics.totalAdded}</div>
            <div className="text-slate-500 text-xs mt-0.5">Từ bổ sung</div>
          </div>
          <div className="rounded-md bg-slate-50 p-2.5">
            <div className="text-base font-bold text-rose-700">-{aggregateMetrics.totalRemoved}</div>
            <div className="text-slate-500 text-xs mt-0.5">Từ lược bớt</div>
          </div>
          <div className="rounded-md bg-slate-50 p-2.5">
            <div className="text-base font-bold text-slate-900">{aggregateMetrics.changedAxesCount}/6</div>
            <div className="text-slate-500 text-xs mt-0.5">Trục có thay đổi</div>
          </div>
          <div className="rounded-md bg-slate-50 p-2.5">
            <div className="text-base font-bold text-indigo-700">
              {after.confidence ? `${after.confidence}/5` : '—'}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">Mức tự tin bản sau</div>
          </div>
        </div>

        {/* After Version Research Metadata */}
        {(after.revisionReason || after.changeSummary || after.changeSource) && (
          <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
              <SparklesIcon className="h-3.5 w-3.5 text-indigo-600" />
              Thông tin nghiên cứu tiến trình của {after.versionNumber}:
            </div>
            {after.changeSummary && (
              <div>
                <strong>Nội dung đã sửa:</strong> {after.changeSummary}
              </div>
            )}
            {after.revisionReason && (
              <div>
                <strong>Lí do sửa:</strong> {after.revisionReason}
              </div>
            )}
            {after.changeSource && (
              <div>
                <strong>Nguồn thay đổi:</strong>{' '}
                {after.changeSource === 'teacher_feedback'
                  ? 'Theo nhận xét giáo viên'
                  : after.changeSource === 'peer_feedback'
                  ? 'Theo góp ý bạn học'
                  : after.changeSource === 'mixed'
                  ? 'Hỗn hợp'
                  : 'Tự phát hiện & chỉnh sửa'}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Axis Diff Sections */}
      <div className="space-y-4">
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
            <section key={axis.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div>
                  <div className="text-xs font-semibold text-slate-900">{axis.title}</div>
                  <div className="text-xs text-slate-500">
                    {hasChange
                      ? `Thay đổi: +${diffResult.wordsAdded} từ, -${diffResult.wordsRemoved} từ (${diffResult.changeRatePercent}% chỉnh sửa)`
                      : 'Không có thay đổi giữa hai phiên bản'}
                  </div>
                </div>
                <Badge variant={hasChange ? 'blue' : 'slate'} size="sm">
                  {hasChange ? 'Đã chỉnh sửa' : 'Giữ nguyên'}
                </Badge>
              </div>

              {/* Side-by-side or highlighted view */}
              <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="p-4">
                  <div className="mb-1.5 text-xs font-medium text-slate-500">{before.versionNumber} (Bản trước)</div>
                  <div className="min-h-20 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-700">
                    {diffResult?.v1Text || <span className="italic text-slate-400">Chưa có nội dung</span>}
                  </div>
                </div>

                <div className={`p-4 ${hasChange ? 'bg-indigo-50/15' : ''}`}>
                  <div className="mb-1.5 text-xs font-medium text-indigo-700">{after.versionNumber} (Bản sau — Diff nổi bật)</div>
                  <div className="min-h-20 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-800">
                    {diffResult?.diffSegments && diffResult.diffSegments.length > 0 ? (
                      diffResult.diffSegments.map((seg: DiffSegment, idx: number) => {
                        if (seg.type === 'added') {
                          return (
                            <span key={idx} className="bg-emerald-100 text-emerald-900 font-medium px-0.5 rounded">
                              {seg.value}
                            </span>
                          );
                        }
                        if (seg.type === 'removed') {
                          return (
                            <span key={idx} className="bg-rose-100 text-rose-800 line-through px-0.5 rounded opacity-60">
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

              {/* Feedback Links */}
              {related.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50/50">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-slate-500" />
                    Phản hồi đã nhận ở trục này ({related.length} góp ý)
                  </div>
                  <div className="space-y-1.5">
                    {related.slice(0, 4).map(item => (
                      <div key={item.id} className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600">
                        <strong className="text-slate-800">
                          {item.authorName} ({item.authorRole === 'teacher' ? 'GV' : item.authorRole === 'peer' ? 'Bạn' : 'AI'}):
                        </strong>{' '}
                        {item.comment}
                        {item.resolved && <span className="text-emerald-600 ml-1 font-medium">• Đã xử lý</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
