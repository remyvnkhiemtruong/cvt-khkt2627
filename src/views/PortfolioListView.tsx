import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import type { StudentPortfolio, Assignment, LiteratureText, FeedbackItem, RubricAssessmentSubmission } from '../types';
import {
  Button,
  Badge,
  FilterBar,
  Pagination,
  EmptyState
} from '../components/ui';

interface PortfolioListViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const PortfolioListView: React.FC<PortfolioListViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuthStore();
  const { portfolios, assignments, literatureTexts, rubricSubmissions, feedbacks: allFeedbacks } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'assignment' | 'text' | 'updated'>('updated');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Find most recent active portfolio based on lastAutosavedAt
  const mostRecentPortfolio = useMemo(() => {
    const allPortfolios: StudentPortfolio[] = Object.values(portfolios);
    const active = allPortfolios.filter(
      p => p.studentId === currentUser.id && p.status !== 'completed'
    );
    if (!active.length) return null;
    return active.sort((a, b) => {
      const timeA = new Date(a.lastAutosavedAt || 0).getTime();
      const timeB = new Date(b.lastAutosavedAt || 0).getTime();
      return timeB - timeA;
    })[0];
  }, [portfolios, currentUser.id]);

  // Aggregate student portfolios
  const portfolioList = useMemo(() => {
    return assignments.map((assignment: Assignment) => {
      const textObj = literatureTexts.find((t: LiteratureText) => t.id === assignment.textId);
      const port: StudentPortfolio | undefined = portfolios[`port-${currentUser.id}-${assignment.id}`];
      const versions = port?.versions || [];
      const versionCount = versions.length;
      const currentVersion = port?.currentActiveVersion || (versionCount > 0 ? versions[versions.length - 1].versionNumber : 'v1.0 (nháp)');

      const myFbs = allFeedbacks.filter((f: FeedbackItem) => f.studentId === currentUser.id && f.assignmentId === assignment.id);
      const unresolvedFbCount = myFbs.filter((f: FeedbackItem) => !f.resolved).length;

      const myRubrics = rubricSubmissions.filter((s: RubricAssessmentSubmission) => s.studentId === currentUser.id && s.assignmentId === assignment.id);
      const latestTeacherRubric = myRubrics
        .filter((s: RubricAssessmentSubmission) => s.evaluatorRole === 'teacher')
        .sort((a: RubricAssessmentSubmission, b: RubricAssessmentSubmission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

      let scoreDisplay = '—';
      if (latestTeacherRubric) {
        scoreDisplay = `${latestTeacherRubric.totalScore}/${latestTeacherRubric.maxScore}`;
      }

      let statusLabel = 'Đang viết nháp';
      let statusVariant: 'slate' | 'blue' | 'indigo' | 'amber' | 'emerald' = 'slate';

      if (versionCount === 1) {
        if (unresolvedFbCount > 0) {
          statusLabel = 'Cần chỉnh sửa';
          statusVariant = 'amber';
        } else {
          statusLabel = 'Đã nộp v1.0';
          statusVariant = 'blue';
        }
      } else if (versionCount >= 2) {
        if (latestTeacherRubric) {
          statusLabel = 'Đã hoàn thành';
          statusVariant = 'emerald';
        } else {
          statusLabel = 'Đã nộp v2.0';
          statusVariant = 'indigo';
        }
      }

      const rawUpdated = port?.lastAutosavedAt || (versions.length > 0 ? versions[versions.length - 1].createdAt : null);
      const updatedTimestamp = rawUpdated ? new Date(rawUpdated).getTime() : 0;
      const updatedFormatted = rawUpdated
        ? new Date(rawUpdated).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '—';

      return {
        id: `port-row-${assignment.id}`,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        textId: assignment.textId,
        textTitle: textObj?.title || 'Tác phẩm',
        textAuthor: textObj?.author || 'Tác giả',
        currentVersion,
        versionCount,
        unresolvedFbCount,
        scoreDisplay,
        statusLabel,
        statusVariant,
        updatedTimestamp,
        updatedFormatted,
        hasMultipleVersions: versionCount >= 2
      };
    });
  }, [assignments, literatureTexts, portfolios, currentUser.id, allFeedbacks, rubricSubmissions]);

  // Filtering & Sorting
  const filteredList = useMemo(() => {
    let result = portfolioList.filter(item => {
      if (selectedStatusFilter !== 'all' && item.statusLabel !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.assignmentTitle.toLowerCase().includes(q) ||
          item.textTitle.toLowerCase().includes(q) ||
          item.textAuthor.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'assignment') {
      result.sort((a, b) => a.assignmentTitle.localeCompare(b.assignmentTitle, 'vi'));
    } else if (sortBy === 'text') {
      result.sort((a, b) => a.textTitle.localeCompare(b.textTitle, 'vi'));
    } else {
      result.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp);
    }

    return result;
  }, [portfolioList, selectedStatusFilter, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hồ sơ học tập</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quá trình hoàn thiện và các phiên bản bài viết của bạn
          </p>
        </div>

        {mostRecentPortfolio && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('editor', { assignmentId: mostRecentPortfolio.assignmentId })}
          >
            Viết tiếp bài gần nhất
          </Button>
        )}
      </div>

      {/* Filter & Sort Toolbar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm hồ sơ theo nhiệm vụ hoặc tác phẩm..."
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedStatusFilter('all');
          setSortBy('updated');
          setCurrentPage(1);
        }}
        filters={
          <>
            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-sm rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-none focus:border-slate-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang viết nháp">Đang viết nháp</option>
              <option value="Đã nộp v1.0">Đã nộp v1.0</option>
              <option value="Cần chỉnh sửa">Cần chỉnh sửa</option>
              <option value="Đã nộp v2.0">Đã nộp v2.0</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-300 text-sm rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:border-slate-500"
              >
                <option value="updated">Mới cập nhật</option>
                <option value="assignment">Theo nhiệm vụ</option>
                <option value="text">Theo tác phẩm</option>
              </select>
            </div>
          </>
        }
      />

      {/* Table-based records (desktop table, compact mobile rows) */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="Chưa có hồ sơ bài viết"
          description="Bắt đầu viết một nhiệm vụ để tạo hồ sơ học tập."
          action={
            <Button variant="primary" onClick={() => onNavigate('assignment-list')}>
              Xem danh sách nhiệm vụ
            </Button>
          }
        />
      ) : (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                <tr>
                  <th className="py-3 px-4">Nhiệm vụ</th>
                  <th className="py-3 px-4">Tác phẩm</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Phiên bản</th>
                  <th className="py-3 px-4">Phản hồi</th>
                  <th className="py-3 px-4">Điểm</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {item.assignmentTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs truncate">
                      {item.textTitle} ({item.textAuthor})
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={item.statusVariant} size="sm">
                        {item.statusLabel}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      {item.currentVersion}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {item.unresolvedFbCount > 0 ? (
                        <span className="text-amber-700 font-medium">{item.unresolvedFbCount} cần xem</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                      {item.scoreDisplay}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {item.updatedFormatted}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      {item.hasMultipleVersions && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigate('version-diff', { assignmentId: item.assignmentId })}
                        >
                          So sánh
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigate('editor', { assignmentId: item.assignmentId })}
                      >
                        Viết tiếp
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Rows View */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedList.map(item => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.statusVariant} size="sm">
                    {item.statusLabel}
                  </Badge>
                  <span className="text-xs text-slate-400">{item.updatedFormatted}</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">{item.assignmentTitle}</h3>
                  <div className="text-xs text-slate-500">{item.textTitle} ({item.textAuthor})</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                  <span>Phiên bản: {item.currentVersion}</span>
                  <span>·</span>
                  <span>Điểm: {item.scoreDisplay}</span>
                  {item.unresolvedFbCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700">{item.unresolvedFbCount} góp ý</span>
                    </>
                  )}
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  {item.hasMultipleVersions && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onNavigate('version-diff', { assignmentId: item.assignmentId })}
                    >
                      So sánh
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate('editor', { assignmentId: item.assignmentId })}
                  >
                    Viết tiếp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredList.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
