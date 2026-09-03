import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolio } from '../contexts/PortfolioContext';
import { POETIC_AXES } from '../data/seedData';
import type { Assignment } from '../types';
import {
  Button,
  Badge,
  Tabs,
  FilterBar,
  Pagination,
  Drawer,
  EmptyState
} from '../components/ui';

interface AssignmentListViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export type AssignmentStatusVi =
  | 'Chưa bắt đầu'
  | 'Đang thực hiện'
  | 'Đã nộp'
  | 'Cần chỉnh sửa'
  | 'Đã nộp lại'
  | 'Hoàn thành';

export const AssignmentListView: React.FC<AssignmentListViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuthStore();
  const {
    assignments,
    literatureTexts,
    portfolios,
    feedbacks,
    rubricSubmissions
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTextFilter, setSelectedTextFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getAssignmentStatusInfo = useCallback((assignment: Assignment): {
    status: AssignmentStatusVi;
    badgeVariant: 'slate' | 'blue' | 'emerald' | 'amber' | 'indigo';
    unresolvedFbCount: number;
    versionCount: number;
  } => {
    const port = portfolios[`port-${currentUser.id}-${assignment.id}`];
    const versions = port?.versions || [];
    const fbs = feedbacks.filter(f => f.studentId === currentUser.id && f.assignmentId === assignment.id);
    const unresolvedFbCount = fbs.filter(f => !f.resolved).length;
    const versionCount = versions.length;

    const studentRubrics = rubricSubmissions.filter(s => s.studentId === currentUser.id && s.assignmentId === assignment.id);
    const hasTeacherScore = studentRubrics.some(s => s.evaluatorRole === 'teacher');

    if (versionCount === 0) {
      return { status: 'Chưa bắt đầu', badgeVariant: 'slate', unresolvedFbCount, versionCount };
    }

    if (versionCount === 1) {
      if (unresolvedFbCount > 0) {
        return { status: 'Cần chỉnh sửa', badgeVariant: 'amber', unresolvedFbCount, versionCount };
      }
      return { status: 'Đã nộp', badgeVariant: 'blue', unresolvedFbCount, versionCount };
    }

    if (versionCount >= 2) {
      if (hasTeacherScore) {
        return { status: 'Hoàn thành', badgeVariant: 'emerald', unresolvedFbCount, versionCount };
      }
      return { status: 'Đã nộp lại', badgeVariant: 'indigo', unresolvedFbCount, versionCount };
    }

    return { status: 'Đang thực hiện', badgeVariant: 'blue', unresolvedFbCount, versionCount };
  }, [currentUser.id, portfolios, feedbacks, rubricSubmissions]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const textObj = literatureTexts.find(t => t.id === item.textId);
      const statusInfo = getAssignmentStatusInfo(item);

      if (activeTab === 'pending' && (statusInfo.status === 'Hoàn thành' || statusInfo.status === 'Đã nộp')) return false;
      if (activeTab === 'revision' && statusInfo.status !== 'Cần chỉnh sửa') return false;
      if (activeTab === 'completed' && statusInfo.status !== 'Hoàn thành') return false;

      if (selectedTextFilter !== 'all' && item.textId !== selectedTextFilter) return false;
      if (selectedStatusFilter !== 'all' && statusInfo.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPrompt = item.prompt?.toLowerCase().includes(q);
        const matchText = textObj ? `${textObj.title} ${textObj.author}`.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchPrompt && !matchText) return false;
      }

      return true;
    });
  }, [assignments, literatureTexts, getAssignmentStatusInfo, activeTab, selectedTextFilter, selectedStatusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssignments.slice(start, start + itemsPerPage);
  }, [filteredAssignments, currentPage, itemsPerPage]);

  const handleOpenDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailOpen(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTextFilter('all');
    setSelectedStatusFilter('all');
    setCurrentPage(1);
  };

  const selectedTextObj = selectedAssignment
    ? literatureTexts.find(t => t.id === selectedAssignment.textId)
    : null;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nhiệm vụ</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Danh mục các bài đọc hiểu và phân tích văn học
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {assignments.length} nhiệm vụ tổng số
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={id => {
          setActiveTab(id);
          setCurrentPage(1);
        }}
        items={[
          { id: 'all', label: 'Tất cả', count: assignments.length },
          {
            id: 'pending',
            label: 'Cần làm',
            count: assignments.filter(a => {
              const s = getAssignmentStatusInfo(a).status;
              return s !== 'Hoàn thành' && s !== 'Đã nộp';
            }).length
          },
          {
            id: 'revision',
            label: 'Cần chỉnh sửa',
            count: assignments.filter(a => getAssignmentStatusInfo(a).status === 'Cần chỉnh sửa').length
          },
          {
            id: 'completed',
            label: 'Đã hoàn thành',
            count: assignments.filter(a => getAssignmentStatusInfo(a).status === 'Hoàn thành').length
          }
        ]}
      />

      {/* Filter Toolbar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm nhiệm vụ hoặc tác phẩm..."
        activeFilterCount={(selectedTextFilter !== 'all' ? 1 : 0) + (selectedStatusFilter !== 'all' ? 1 : 0)}
        onResetFilters={resetFilters}
        filters={
          <>
            <select
              value={selectedTextFilter}
              onChange={e => {
                setSelectedTextFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-sm rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-none focus:border-slate-500"
            >
              <option value="all">Tất cả tác phẩm</option>
              {literatureTexts.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.author})</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-sm rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-none focus:border-slate-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Chưa bắt đầu">Chưa bắt đầu</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Đã nộp">Đã nộp</option>
              <option value="Cần chỉnh sửa">Cần chỉnh sửa</option>
              <option value="Đã nộp lại">Đã nộp lại</option>
              <option value="Hoàn thành">Hoàn thành</option>
            </select>
          </>
        }
      />

      {/* Rows Table */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhiệm vụ phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc."
          action={
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Đặt lại bộ lọc
            </Button>
          }
        />
      ) : (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden divide-y divide-slate-200">
          {paginatedAssignments.map(item => {
            const textObj = literatureTexts.find(t => t.id === item.textId);
            const statusInfo = getAssignmentStatusInfo(item);
            const axesText = (item.targetAxes || [])
              .map(id => POETIC_AXES.find(a => a.id === id)?.title)
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusInfo.badgeVariant}>
                      {statusInfo.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {textObj ? `${textObj.title} — ${textObj.author}` : 'Ngữ liệu'}
                    </span>
                    {item.deadline && (
                      <>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          Hạn: {new Date(item.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    <h2
                      onClick={() => handleOpenDetail(item)}
                      className="text-base font-medium text-slate-900 hover:text-slate-700 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h2>
                    {item.prompt && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    )}
                  </div>

                  {axesText && (
                    <div className="text-xs text-slate-500">
                      Trọng tâm: {axesText}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDetail(item)}
                  >
                    Chi tiết
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onNavigate('editor', { assignmentId: item.id })}
                  >
                    {statusInfo.versionCount > 0 ? 'Viết tiếp' : 'Bắt đầu'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Detail Drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedAssignment?.title || 'Chi tiết nhiệm vụ'}
        width="md"
        footer={
          selectedAssignment && (
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsDetailOpen(false);
                  onNavigate('editor', { assignmentId: selectedAssignment.id });
                }}
              >
                Mở bài viết
              </Button>
            </div>
          )
        }
      >
        {selectedAssignment && (
          <div className="space-y-6 text-sm text-slate-700">
            <div>
              <div className="text-xs text-slate-500">
                Tác phẩm: <strong>{selectedTextObj?.title}</strong> ({selectedTextObj?.author})
              </div>
              {selectedAssignment.deadline && (
                <div className="text-xs text-slate-500 mt-1">
                  Hạn nộp: {new Date(selectedAssignment.deadline).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>

            {selectedAssignment.prompt && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-slate-900">Yêu cầu nhiệm vụ</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                  {selectedAssignment.prompt}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">Trọng tâm thi pháp</h3>
              <div className="space-y-2">
                {(selectedAssignment.targetAxes || []).map(axisId => {
                  const axis = POETIC_AXES.find(a => a.id === axisId);
                  return (
                    <div key={axisId} className="border-l-2 border-slate-300 pl-3 py-1 space-y-0.5">
                      <div className="font-medium text-slate-900">{axis?.title}</div>
                      <p className="text-xs text-slate-500">{axis?.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900">Quy trình đánh giá</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bài viết được phản hồi và đánh giá theo chuẩn Rubric. Học sinh tiếp thu các ý kiến đóng góp của giáo viên để hoàn thiện bài viết qua các phiên bản tiếp theo.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
