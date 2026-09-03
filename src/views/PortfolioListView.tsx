import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { mockDb } from '../services/mockApi/mockDb';
import {
  Button,
  Badge,
  Card,
  FilterBar,
  Pagination,
  EmptyState,
  PageHeader
} from '../components/ui';
import {
  BookOpenIcon,
  ArrowRightIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface PortfolioListViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const PortfolioListView: React.FC<PortfolioListViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuthStore();
  const { portfolios, lastSavedTime } = usePortfolioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'assignment' | 'text' | 'status' | 'updated'>('assignment');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const assignments = mockDb.getAssignments();
  const literatureTexts = mockDb.getLiteratureTexts();
  const rubricSubmissions = mockDb.getRubricSubmissions();
  const allFeedbacks = mockDb.getFeedbacks();

  // Aggregate student portfolios
  const portfolioList = useMemo(() => {
    return assignments.map(assignment => {
      const textObj = literatureTexts.find(t => t.id === assignment.textId);
      const port = portfolios[`port-${currentUser.id}-${assignment.id}`];
      const versions = port?.versions || [];
      const versionCount = versions.length;
      const currentVersion = port?.currentActiveVersion || (versionCount > 0 ? versions[versions.length - 1].versionNumber : 'v1.0 (nháp)');

      const myFbs = allFeedbacks.filter(f => f.studentId === currentUser.id && f.assignmentId === assignment.id);
      const unresolvedFbCount = myFbs.filter(f => !f.resolved).length;

      const myRubrics = rubricSubmissions.filter(s => s.studentId === currentUser.id && s.assignmentId === assignment.id);
      const latestTeacherRubric = myRubrics.find(s => s.evaluatorRole === 'teacher');
      const scoreDisplay = latestTeacherRubric ? `${latestTeacherRubric.totalScore}/${latestTeacherRubric.maxScore} đ` : 'Chờ chấm';

      // Status determination
      let statusLabel = 'Chưa bắt đầu';
      let statusVariant: 'slate' | 'blue' | 'emerald' | 'amber' | 'purple' = 'slate';

      if (versionCount === 0) {
        statusLabel = 'Đang viết nháp';
        statusVariant = 'blue';
      } else if (versionCount === 1) {
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
          statusLabel = 'Đã nộp lại v2.0';
          statusVariant = 'purple';
        }
      }

      return {
        id: `port-card-${assignment.id}`,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        textId: assignment.textId,
        textTitle: textObj?.title || 'Tác phẩm THPT',
        textAuthor: textObj?.author || 'Tác giả',
        currentVersion,
        versionCount,
        lastSaved: lastSavedTime || 'vừa xong',
        unresolvedFbCount,
        scoreDisplay,
        statusLabel,
        statusVariant,
        hasMultipleVersions: versionCount >= 2,
        updatedAt: port?.lastAutosavedAt || new Date().toISOString()
      };
    });
  }, [assignments, literatureTexts, portfolios, allFeedbacks, rubricSubmissions, currentUser, lastSavedTime]);

  // Filter and search
  const filteredList = useMemo(() => {
    return portfolioList.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.assignmentTitle.toLowerCase().includes(q);
        const matchText = item.textTitle.toLowerCase().includes(q) || item.textAuthor.toLowerCase().includes(q);
        if (!matchTitle && !matchText) return false;
      }

      if (selectedStatusFilter !== 'all' && item.statusLabel !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [portfolioList, searchQuery, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Hồ sơ học tập"
        description="Tổng hợp quá trình đọc hiểu, các phiên bản bài viết và nhận xét đánh giá."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => onNavigate('student-dashboard')}
              leftIcon={<BookOpenIcon className="w-4 h-4" />}
            >
              Quay lại Nhiệm vụ
            </Button>
            {(filteredList[0]?.assignmentId || assignments[0]?.id) && (
              <Button
                variant="primary"
                onClick={() => onNavigate('editor', { assignmentId: filteredList[0]?.assignmentId || assignments[0]?.id })}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                Viết tiếp bài gần nhất
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Grouping Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Tìm kiếm theo tác phẩm (Vợ nhặt, Chí Phèo...) hoặc nhiệm vụ..."
        activeFilterCount={selectedStatusFilter !== 'all' ? 1 : 0}
        onResetFilters={() => setSelectedStatusFilter('all')}
        filters={
          <>
            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="all">Tất cả trạng thái hồ sơ</option>
              <option value="Đang viết nháp">Đang viết nháp</option>
              <option value="Đã nộp v1.0">Đã nộp v1.0</option>
              <option value="Cần chỉnh sửa">Cần chỉnh sửa</option>
              <option value="Đã nộp lại v2.0">Đã nộp lại v2.0</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200 hidden sm:flex">
              <span>Nhìn theo:</span>
              <button
                onClick={() => setGroupBy('assignment')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${groupBy === 'assignment' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Nhiệm vụ
              </button>
              <button
                onClick={() => setGroupBy('text')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${groupBy === 'text' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Tác phẩm
              </button>
            </div>
          </>
        }
      />

      {/* D. EMPTY STATE */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="Bạn chưa có hồ sơ đọc nào."
          description="Hồ sơ mới sẽ được tạo khi bạn bắt đầu một nhiệm vụ."
          action={
            <Button
              variant="primary"
              onClick={() => onNavigate('student-dashboard')}
              leftIcon={<BookOpenIcon className="w-4 h-4" />}
            >
              Xem danh sách nhiệm vụ
            </Button>
          }
        />
      ) : (
        /* Portfolio Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedList.map(item => (
            <Card
              key={item.id}
              padding="md"
              className="border border-slate-200 flex flex-col justify-between space-y-4 bg-white"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <Badge variant={item.statusVariant}>
                    {item.statusLabel}
                  </Badge>
                  <span className="text-caption text-slate-400 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {item.lastSaved}
                  </span>
                </div>

                {/* Literary Work & Assignment Title */}
                <div>
                  <span className="text-xs font-medium text-slate-600 block">
                    {item.textTitle} ({item.textAuthor})
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2">
                    {item.assignmentTitle}
                  </h2>
                </div>

                {/* Metrics: Version, Unresolved Feedback, Rubric Score */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-md border border-slate-200 text-center">
                  <div>
                    <span className="text-xs text-slate-500 block">Phiên bản</span>
                    <span className="font-semibold text-xs text-slate-900">{item.currentVersion}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Phản hồi</span>
                    <span className={`font-semibold text-xs ${item.unresolvedFbCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {item.unresolvedFbCount > 0 ? `${item.unresolvedFbCount} góp ý` : '0'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block">Điểm Rubric</span>
                    <span className="font-semibold text-xs text-indigo-700">{item.scoreDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {item.hasMultipleVersions ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate('version-diff', { assignmentId: item.assignmentId })}
                    leftIcon={<ArrowsRightLeftIcon className="w-3.5 h-3.5" />}
                    className="text-caption"
                  >
                    So sánh Diff
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate('student-analytics')}
                    leftIcon={<ChartBarIcon className="w-3.5 h-3.5" />}
                    className="text-caption"
                  >
                    Tiến bộ
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate('editor', { assignmentId: item.assignmentId })}
                  rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                  className="text-caption font-bold"
                >
                  Tiếp tục hồ sơ
                </Button>
              </div>
            </Card>
          ))}
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
