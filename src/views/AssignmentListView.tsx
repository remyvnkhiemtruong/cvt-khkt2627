import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { Assignment, PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Card,
  Tabs,
  FilterBar,
  Pagination,
  Drawer,
  EmptyState
} from '../components/ui';
import {
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

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
  const { portfolios } = usePortfolioStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTextFilter, setSelectedTextFilter] = useState<string>('all');
  const [selectedAxisFilter, setSelectedAxisFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected assignment for detail drawer
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const assignments = mockDb.getAssignments();
  const literatureTexts = mockDb.getLiteratureTexts();
  const rubricSubmissions = mockDb.getRubricSubmissions();
  const allFeedbacks = mockDb.getFeedbacks();

  // Helper to determine accurate Vietnamese status per assignment for current student
  const getAssignmentStatusInfo = useCallback((assignment: Assignment): { status: AssignmentStatusVi; badgeVariant: 'slate' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'; unresolvedFbCount: number; versionCount: number } => {
    const port = portfolios[`port-${currentUser.id}-${assignment.id}`];
    const versions = port?.versions || [];
    const fbs = allFeedbacks.filter(f => f.studentId === currentUser.id && f.assignmentId === assignment.id);
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
      return { status: 'Đã nộp lại', badgeVariant: 'purple', unresolvedFbCount, versionCount };
    }

    return { status: 'Đang thực hiện', badgeVariant: 'blue', unresolvedFbCount, versionCount };
  }, [currentUser.id, portfolios, allFeedbacks, rubricSubmissions]);

  // Filter and Search pipeline
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const textObj = literatureTexts.find(t => t.id === item.textId);
      const statusInfo = getAssignmentStatusInfo(item);

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchText = textObj?.title.toLowerCase().includes(q) || textObj?.author.toLowerCase().includes(q);
        const matchPrompt = item.prompt.toLowerCase().includes(q);
        if (!matchTitle && !matchText && !matchPrompt) return false;
      }

      // Text filter
      if (selectedTextFilter !== 'all' && item.textId !== selectedTextFilter) {
        return false;
      }

      // Axis filter
      if (selectedAxisFilter !== 'all' && !item.targetAxes.includes(selectedAxisFilter as PoeticAxisId)) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && statusInfo.status !== selectedStatusFilter) {
        return false;
      }

      // Tab filter
      if (activeTab === 'in_progress' && !['Đang thực hiện', 'Chưa bắt đầu'].includes(statusInfo.status)) return false;
      if (activeTab === 'needs_revision' && statusInfo.status !== 'Cần chỉnh sửa') return false;
      if (activeTab === 'completed' && statusInfo.status !== 'Hoàn thành') return false;
      if (activeTab === 'upcoming' && statusInfo.status !== 'Chưa bắt đầu') return false;

      return true;
    });
  }, [assignments, literatureTexts, getAssignmentStatusInfo, searchQuery, selectedTextFilter, selectedAxisFilter, selectedStatusFilter, activeTab]);

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFiltersCount = (selectedTextFilter !== 'all' ? 1 : 0) + (selectedAxisFilter !== 'all' ? 1 : 0) + (selectedStatusFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedTextFilter('all');
    setSelectedAxisFilter('all');
    setSelectedStatusFilter('all');
    setSearchQuery('');
  };

  const handleOpenDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailOpen(true);
  };

  const selectedTextObj = literatureTexts.find(t => t.id === selectedAssignment?.textId);
  const selectedStatusInfo = selectedAssignment ? getAssignmentStatusInfo(selectedAssignment) : null;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200 mb-2">
            <BookOpenIcon className="w-4 h-4" />
            Hệ Thống Nhiệm Vụ Đọc Hiểu Theo Trục Thi Pháp
          </div>
          <h1 className="text-h2 font-bold text-slate-900 tracking-tight">
            Danh Mục Nhiệm Vụ Học Tập
          </h1>
          <p className="text-small text-slate-500 mt-1">
            Giao diện quản lý và tiếp cận các bài tập đọc hiểu truyện ngắn hiện đại THPT
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => onNavigate('portfolio-list')}
            leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
          >
            Xem Danh sách Hồ sơ đọc
          </Button>
          {assignments[0] && (
            <Button
              variant="academic"
              onClick={() => onNavigate('editor', { assignmentId: assignments[0].id })}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              Làm bài trọng tâm
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id);
          setCurrentPage(1);
        }}
        items={[
          { id: 'all', label: 'Tất cả nhiệm vụ', count: assignments.length },
          { id: 'in_progress', label: 'Đang làm' },
          { id: 'needs_revision', label: 'Cần chỉnh sửa' },
          { id: 'completed', label: 'Đã hoàn thành' },
          { id: 'upcoming', label: 'Sắp tới' },
        ]}
      />

      {/* Search & Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Tìm theo tên tác phẩm, tác giả, tên nhiệm vụ..."
        activeFilterCount={activeFiltersCount}
        onResetFilters={resetFilters}
        filters={
          <>
            {/* Filter by Literature Text */}
            <select
              value={selectedTextFilter}
              onChange={e => {
                setSelectedTextFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="all">Tất cả tác phẩm</option>
              {literatureTexts.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.author})</option>
              ))}
            </select>

            {/* Filter by Poetic Axis */}
            <select
              value={selectedAxisFilter}
              onChange={e => {
                setSelectedAxisFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="all">Tất cả trục thi pháp</option>
              {POETIC_AXES.map(a => (
                <option key={a.id} value={a.id}>{a.shortName}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
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

      {/* Assignment List / Cards */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhiệm vụ phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các bộ lọc tác phẩm và trục thi pháp."
          action={
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Xóa bộ lọc tìm kiếm
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {paginatedAssignments.map(item => {
            const textObj = literatureTexts.find(t => t.id === item.textId);
            const statusInfo = getAssignmentStatusInfo(item);

            return (
              <Card
                key={item.id}
                padding="md"
                className="hover:border-slate-300 transition-all border border-slate-200 bg-white"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      <Badge variant={statusInfo.badgeVariant}>
                        {statusInfo.status}
                      </Badge>

                      {/* Difficulty */}
                      <Badge variant={item.difficulty === 'Nâng cao' ? 'purple' : 'slate'} size="sm">
                        {item.difficulty}
                      </Badge>

                      <span className="text-caption text-slate-500 font-medium">
                        Tác phẩm: <strong className="text-slate-800">{textObj?.title}</strong> ({textObj?.author})
                      </span>

                      <span className="text-caption text-slate-400">• Giáo viên: {(item as any).teacherName || 'Cô Nguyễn Thị Mai'}</span>
                    </div>

                    <div>
                      <h2
                        onClick={() => handleOpenDetail(item)}
                        className="text-base font-bold text-slate-900 tracking-tight hover:text-indigo-600 cursor-pointer transition truncate"
                      >
                        {item.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>

                    {/* Target Axes Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.targetAxes.map(axisId => {
                        const axis = POETIC_AXES.find(a => a.id === axisId);
                        return (
                          <span
                            key={axisId}
                            className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            {axis?.shortName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Version Count, Feedback & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{statusInfo.versionCount}</strong> phiên bản
                      </span>

                      {statusInfo.unresolvedFbCount > 0 && (
                        <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                          {statusInfo.unresolvedFbCount} góp ý
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-slate-500">
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        {item.deadline}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(item)}
                        leftIcon={<EyeIcon className="w-3.5 h-3.5" />}
                      >
                        Chi tiết
                      </Button>

                      {statusInfo.status === 'Chưa bắt đầu' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onNavigate('editor', { assignmentId: item.id })}
                          rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                          className="bg-indigo-900 text-white font-bold"
                        >
                          Bắt đầu tạo hồ sơ
                        </Button>
                      ) : statusInfo.status === 'Cần chỉnh sửa' ? (
                        <Button
                          size="sm"
                          variant="academic"
                          onClick={() => onNavigate('editor', { assignmentId: item.id })}
                          rightIcon={<ArrowPathIcon className="w-3.5 h-3.5" />}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        >
                          Xem phản hồi & Chỉnh sửa
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onNavigate('editor', { assignmentId: item.id })}
                          rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        >
                          Tiếp tục hồ sơ
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* B. ASSIGNMENT DETAIL DRAWER */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        width="xl"
        title="Chi Tiết Nhiệm Vụ Đọc Hiểu"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
              Đóng lại
            </Button>

            <Button
              variant="academic"
              onClick={() => {
                if (selectedAssignment) {
                  onNavigate('editor', { assignmentId: selectedAssignment.id });
                  setIsDetailOpen(false);
                }
              }}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              {selectedStatusInfo?.status === 'Chưa bắt đầu' ? 'Tạo hồ sơ ngay' : 'Vào phòng soạn thảo'}
            </Button>
          </div>
        }
      >
        {selectedAssignment && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={selectedStatusInfo?.badgeVariant || 'slate'}>
                  {selectedStatusInfo?.status}
                </Badge>
                <span className="text-caption text-slate-500 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" /> Hạn nộp: {selectedAssignment.deadline}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900">{selectedAssignment.title}</h2>
              <div className="text-caption text-slate-600 flex items-center gap-2">
                <span>Tác phẩm: <strong>{selectedTextObj?.title}</strong> ({selectedTextObj?.author})</span>
                <span>• Giáo viên: {(selectedAssignment as any).teacherName || 'Cô Nguyễn Thị Mai'}</span>
              </div>
            </div>

            {/* Mục tiêu học tập */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AcademicCapIcon className="w-4 h-4 text-indigo-600" />
                1. Mục Tiêu Năng Lực Cần Đạt
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                <li>Nhận diện và phân tích đặc trưng của thể loại truyện ngắn hiện đại qua hệ thống 6 trục thi pháp.</li>
                <li>Biết trích xuất dẫn chứng cụ thể từ văn bản nghệ thuật để minh chứng cho luận điểm cá nhân.</li>
                <li>Rèn luyện kỹ năng tiếp thu phản hồi đa chiều để chỉnh sửa và nâng cao chất lượng hồ sơ qua các phiên bản.</li>
              </ul>
            </div>

            {/* Trục thi pháp trọng tâm */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-indigo-600" />
                2. Trục Thi Pháp & Câu Hỏi Scaffolding
              </h3>
              <div className="space-y-2">
                {selectedAssignment.targetAxes.map(axisId => {
                  const axis = POETIC_AXES.find(a => a.id === axisId);
                  return (
                    <div key={axisId} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">{axis?.title}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{axis?.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Yêu cầu sản phẩm & Rubric Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                3. Yêu Cầu Sản Phẩm & Thang Đánh Giá
              </h3>
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2">
                <p className="text-indigo-950 font-medium">
                  Hồ sơ được đánh giá theo Ma trận Rubric 4 Mức độ (Chưa đạt, Đạt, Khá, Xuất sắc) trên thang điểm 24.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <strong>Bản sơ thảo v1.0:</strong> Yêu cầu hoàn thành tối thiểu 4/6 trục thi pháp.
                  </div>
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <strong>Bản chỉnh sửa v2.0:</strong> Tiếp thu ít nhất 2 phản hồi từ giáo viên/bạn học.
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline các mốc */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                4. Tiến Trình Các Mốc Thời Gian
              </h3>
              <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="font-bold text-slate-800">Mốc 1: Nộp bản sơ thảo v1.0</div>
                  <div className="text-caption text-slate-500">Đã đóng băng và chuyển sang giai đoạn nhận xét</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="font-bold text-slate-800">Mốc 2: Đánh giá đồng đẳng & Nhận xét của GV</div>
                  <div className="text-caption text-slate-500">Gắn các phản hồi neo ngữ cảnh trực tiếp vào bài</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <div className="font-bold text-slate-800">Mốc 3: Hoàn thiện và đóng băng bản v2.0</div>
                  <div className="text-caption text-slate-500">Hạn chót: {selectedAssignment.deadline}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
