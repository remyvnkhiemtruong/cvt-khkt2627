import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { useNotificationStore } from '../app/store/useNotificationStore';
import { mockDb } from '../services/mockApi/mockDb';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId, FeedbackItem } from '../types';
import {
  Button,
  Badge,
  Card,
  Modal,
  Avatar
} from '../components/ui';
import {
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

interface TeacherReviewViewProps {
  studentId?: string;
  assignmentId?: string;
  isPeerMode?: boolean;
  onNavigate: (view: string, extraParams?: any) => void;
}

type AssessmentMode = 'teacher' | 'peer' | 'self';

export const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({
  studentId: initialStudentId = 'user-std-1',
  assignmentId = 'assign-vo-nhat',
  isPeerMode = false,
  onNavigate
}) => {
  const { currentUser } = useAuthStore();
  const { getPortfolio } = usePortfolioStore();
  const { addToast } = useNotificationStore();

  const assignments = mockDb.getAssignments();
  const literatureTexts = mockDb.getLiteratureTexts();

  // Student Queue for 11A1 continuous grading
  const studentQueue = useMemo(() => [
    { id: 'user-std-1', name: 'Nguyễn Văn An', className: '11A1', status: 'Chờ chấm v1.0', statusVariant: 'amber' as const, currentVersion: 'v1.0' },
    { id: 'user-std-2', name: 'Trần Thị Bình', className: '11A1', status: 'Đã nộp lại v2.0', statusVariant: 'purple' as const, currentVersion: 'v2.0' },
    { id: 'user-std-3', name: 'Lê Hoàng Nam', className: '11A1', status: 'Cần hỗ trợ gấp', statusVariant: 'rose' as const, currentVersion: 'v1.0' },
    { id: 'user-std-4', name: 'Phạm Minh Đức', className: '11A1', status: 'Chờ chấm v1.0', statusVariant: 'amber' as const, currentVersion: 'v1.0' },
    { id: 'user-std-5', name: 'Vũ Thu Trang', className: '11A1', status: 'Đã chấm v2.0', statusVariant: 'emerald' as const, currentVersion: 'v2.0' },
  ], []);

  const [currentStudentIndex, setCurrentStudentIndex] = useState(() => {
    const idx = studentQueue.findIndex(s => s.id === initialStudentId);
    return idx >= 0 ? idx : 0;
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'pending' | 'graded'>('all');

  const currentStudent = studentQueue[currentStudentIndex] || studentQueue[0];
  const assignment = assignments.find(a => a.id === assignmentId) || assignments[0];
  const literatureText = literatureTexts.find(t => t.id === assignment?.textId);

  // Active Assessment Mode
  const assessmentMode: AssessmentMode = useMemo(() => {
    if (isPeerMode || currentUser.role === 'peer') return 'peer';
    if (currentUser.role === 'student' && currentUser.id === currentStudent.id) return 'self';
    return 'teacher';
  }, [isPeerMode, currentUser, currentStudent]);

  // Selected Version to review & active axis
  const [selectedVersion, setSelectedVersion] = useState(currentStudent.currentVersion);
  const [activeAxisId, setActiveAxisId] = useState<PoeticAxisId>('narrator_pov');
  const [rightTab, setRightTab] = useState<'rubric' | 'feedbacks' | 'history'>('rubric');

  // Text selection floating feedback trigger
  const [selectedText, setSelectedText] = useState('');
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Rubric Scores State (Levels 0 - 4)
  const [rubricScores, setRubricScores] = useState<Record<PoeticAxisId, { score: number; comment: string }>>({
    plot_situation: { score: 3, comment: 'Xác định tình huống truyện độc đáo, giàu kịch tính.' },
    character_detail: { score: 3, comment: 'Phân tích tốt các chi tiết biểu cảm của bà cụ Tứ.' },
    narrator_pov: { score: 2, comment: 'Cần làm rõ sự dịch chuyển điểm nhìn từ người kể chuyện sang nhân vật Tràng.' },
    space_time: { score: 3, comment: 'Đối chiếu tốt không gian tăm tối và ánh sáng ngày mới.' },
    language_tone_symbol: { score: 3, comment: 'Chỉ ra được biểu tượng nồi cháo cám và bát bánh đúc.' },
    form_argument: { score: 3, comment: 'Bố cục rõ ràng, lập luận mạch lạc.' }
  });

  const [isRubricLocked, setIsRubricLocked] = useState(false);

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    return mockDb.getFeedbacks().filter(f => f.assignmentId === assignment.id && f.studentId === currentStudent.id);
  });

  // Total score calculation (out of 24)
  const totalRubricScore = useMemo(() => {
    return Object.values(rubricScores).reduce((acc, curr) => acc + curr.score, 0);
  }, [rubricScores]);

  // Keyboard Shortcuts (Alt + Left/Right for students, Ctrl + S for draft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStudent();
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStudent();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveRubric(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStudentIndex]);

  const handleNextStudent = () => {
    if (currentStudentIndex < studentQueue.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
      setSelectedVersion(studentQueue[currentStudentIndex + 1].currentVersion);
      addToast({ type: 'info', title: 'Chuyển học sinh tiếp theo', message: studentQueue[currentStudentIndex + 1].name });
    }
  };

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(prev => prev - 1);
      setSelectedVersion(studentQueue[currentStudentIndex - 1].currentVersion);
      addToast({ type: 'info', title: 'Chuyển học sinh trước đó', message: studentQueue[currentStudentIndex - 1].name });
    }
  };

  // Text selection for Contextual Anchoring
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 5) {
      setSelectedText(selection.toString().trim());
    }
  };

  // Create Contextual Anchored Feedback
  const handleCreateFeedback = () => {
    if (!feedbackContent.trim()) return;

    const newFb: FeedbackItem = {
      id: `fb-${Date.now()}`,
      assignmentId: assignment.id,
      studentId: currentStudent.id,
      versionNumber: selectedVersion,
      axisId: activeAxisId,
      selectedSnippet: selectedText || 'Điểm nhìn nghệ thuật hòa nhập vào dòng tâm trạng bên trong nhân vật',
      comment: feedbackContent.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: assessmentMode === 'teacher' ? 'teacher' : 'peer',
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      resolved: false
    };

    setFeedbacks(prev => [newFb, ...prev]);
    mockDb.saveFeedback(newFb);

    setIsAnchorModalOpen(false);
    setFeedbackContent('');
    setSelectedText('');

    addToast({
      type: 'success',
      title: 'Đã tạo phản hồi neo ngữ cảnh',
      message: `Góp ý đã được gắn vào phiên bản ${selectedVersion} của ${currentStudent.name}.`
    });
  };

  // Save Rubric Evaluation
  const handleSaveRubric = (isSubmit = false) => {
    if (isSubmit) {
      setIsRubricLocked(true);
      addToast({
        type: 'success',
        title: 'Đã nộp kết quả đánh giá Rubric',
        message: `Đã chấm bài cho ${currentStudent.name}: ${totalRubricScore}/24 điểm.`
      });
    } else {
      addToast({
        type: 'info',
        title: 'Đã lưu bản nháp Rubric',
        message: `Điểm nháp cho ${currentStudent.name} đã được lưu an toàn.`
      });
    }
  };

  // Filtered Student Queue
  const filteredQueue = studentQueue.filter(s => {
    if (studentSearch.trim() && !s.name.toLowerCase().includes(studentSearch.toLowerCase())) {
      return false;
    }
    if (studentFilter === 'pending' && s.status.includes('Đã chấm')) return false;
    if (studentFilter === 'graded' && !s.status.includes('Đã chấm')) return false;
    return true;
  });

  const port = getPortfolio(currentStudent.id, assignment.id, currentStudent.name, currentStudent.className);
  const currentAxisContent = port.currentDraft?.[activeAxisId]?.analysisText ||
    'Kim Lân đã lựa chọn điểm nhìn trần thuật ngôi thứ ba toàn tri trong truyện ngắn Vợ nhặt. Điểm nhìn nghệ thuật thường xuyên dịch chuyển và hòa nhập vào dòng tâm trạng bên trong của các nhân vật (Tràng, bà cụ Tứ, người vợ nhặt). Nhìn người đàn bà ngồi ở mép giường, Tràng chợt thấy thương thương... Trong một lúc, cái đói khát ghê gớm dường như lùi xa. Lời trần thuật nửa trực tiếp: Câu văn vừa là lời người kể chuyện ngôi thứ ba, vừa tái hiện chính xác cảm xúc rung động, thức tỉnh trách nhiệm của Tràng trước ngưỡng cửa gia đình.';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header Bar */}
      <header className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate(currentUser.role === 'teacher' ? 'teacher-dashboard' : 'dashboard')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="text-slate-600 hover:text-slate-900 p-0 pr-2"
            >
              {currentUser.role === 'teacher' ? 'Bàn làm việc Giáo viên' : 'Dashboard'}
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Phòng Chấm Bài 3-Pane Liên Tục</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h3 font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AcademicCapIcon className="w-6 h-6 text-indigo-700" />
              Không Gian Chấm Bài & Phản Hồi Neo
            </h1>
            <Badge variant="blue">Lớp 11A1</Badge>
            <span className="text-xs text-slate-500">Tác phẩm: <strong>{literatureText?.title}</strong></span>
          </div>
        </div>

        {/* Previous / Next Student Fast Navigation & Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              disabled={currentStudentIndex === 0}
              onClick={handlePrevStudent}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
              title="Học sinh trước (Alt + Mũi tên trái)"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800">
              {currentStudentIndex + 1} / {studentQueue.length}
            </span>
            <button
              type="button"
              disabled={currentStudentIndex === studentQueue.length - 1}
              onClick={handleNextStudent}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
              title="Học sinh tiếp theo (Alt + Mũi tên phải)"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('version-diff', { assignmentId: assignment.id })}
            leftIcon={<ArrowsRightLeftIcon className="w-4 h-4" />}
          >
            Visual Diff
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3-PANE LAYOUT: LEFT (QUEUE) | CENTER (ARTIFACT) | RIGHT (RUBRIC / FEEDBACK) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ========================================================================= */}
        {/* PANE 1: LEFT (3 COLS) — STUDENT LIST & SEARCH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 space-y-3">
          <Card padding="md" className="border-slate-200 bg-white shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hàng Đợi Chấm Bài
              </span>
              <Badge variant="slate" size="sm">{studentQueue.length} HS</Badge>
            </div>

            {/* Student Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Tìm học sinh..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setStudentFilter('all')}
                className={`px-2 py-1 rounded-md font-semibold ${studentFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStudentFilter('pending')}
                className={`px-2 py-1 rounded-md font-semibold ${studentFilter === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Chờ chấm
              </button>
              <button
                onClick={() => setStudentFilter('graded')}
                className={`px-2 py-1 rounded-md font-semibold ${studentFilter === 'graded' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Đã chấm
              </button>
            </div>

            {/* Student Cards Queue List */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
              {filteredQueue.map((std, idx) => {
                const isSelected = std.id === currentStudent.id;
                return (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => {
                      setCurrentStudentIndex(idx);
                      setSelectedVersion(std.currentVersion);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={std.name} size="sm" />
                      <div>
                        <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                          {std.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Lớp {std.className}</span>
                      </div>
                    </div>

                    <Badge variant={std.statusVariant} size="sm">
                      {std.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* PANE 2: CENTER (5 COLS) — STUDENT ARTIFACT & CONTEXTUAL HIGHLIGHTS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            {/* Top Student Header Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bài làm của học sinh
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {currentStudent.name} ({currentStudent.className})
                </h2>
              </div>

              {/* Version Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Phiên bản:</span>
                <select
                  value={selectedVersion}
                  onChange={e => setSelectedVersion(e.target.value)}
                  className="bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold py-1 px-2.5 text-indigo-950 focus:outline-none"
                >
                  <option value="v1.0">v1.0 (Sơ thảo)</option>
                  <option value="v2.0">v2.0 (Chỉnh sửa)</option>
                </select>
              </div>
            </div>

            {/* Axis tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {POETIC_AXES.map(axis => (
                <button
                  key={axis.id}
                  onClick={() => setActiveAxisId(axis.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    activeAxisId === axis.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {axis.shortName}
                </button>
              ))}
            </div>

            {/* Text selection tip & floating action */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-[11px] text-indigo-950 flex items-center justify-between">
              <span>💡 <strong>Neo nhận xét:</strong> Bôi đen câu văn bất kỳ để gắn phản hồi.</span>
              {selectedText && (
                <Button
                  size="sm"
                  variant="academic"
                  onClick={() => setIsAnchorModalOpen(true)}
                  leftIcon={<ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />}
                  className="text-[11px] shrink-0 font-bold ml-2"
                >
                  + Phản hồi câu chọn
                </Button>
              )}
            </div>

            {/* Student Essay Body */}
            <div
              onMouseUp={handleMouseUp}
              className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 text-slate-900 text-xs sm:text-sm font-serif leading-loose select-text cursor-text min-h-[300px]"
            >
              <p className="whitespace-pre-line">
                {currentAxisContent}
              </p>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* PANE 3: RIGHT (4 COLS) — RUBRIC MATRIX, FEEDBACKS & HISTORY TABS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="md" className="border-indigo-200 bg-white shadow-card space-y-4 sticky top-16">
            {/* Tabs Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRightTab('rubric')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    rightTab === 'rubric' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rubric ({totalRubricScore}/24 đ)
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('feedbacks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    rightTab === 'feedbacks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Góp ý ({feedbacks.length})
                </button>
              </div>

              <Badge variant="purple" size="sm">{selectedVersion}</Badge>
            </div>

            {/* TAB CONTENT 1: RUBRIC EVALUATION MATRIX */}
            {rightTab === 'rubric' && (
              <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
                {POETIC_AXES.map(axis => {
                  const currentData = rubricScores[axis.id] || { score: 2, comment: '' };
                  return (
                    <div
                      key={axis.id}
                      className={`p-3 rounded-xl border space-y-2 text-xs transition ${
                        activeAxisId === axis.id ? 'border-indigo-300 bg-indigo-50/20 shadow-xs' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{axis.shortName}</span>
                        <Badge variant={currentData.score >= 3 ? 'emerald' : 'amber'} size="sm">
                          {currentData.score}.0 / 4.0 đ
                        </Badge>
                      </div>

                      {/* Level 0 - 4 Buttons */}
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {[0, 1, 2, 3, 4].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            disabled={isRubricLocked}
                            onClick={() => {
                              setRubricScores(prev => ({
                                ...prev,
                                [axis.id]: { ...prev[axis.id], score: lvl }
                              }));
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                              currentData.score === lvl
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={1}
                        disabled={isRubricLocked}
                        value={currentData.comment}
                        onChange={e => {
                          const val = e.target.value;
                          setRubricScores(prev => ({
                            ...prev,
                            [axis.id]: { ...prev[axis.id], comment: val }
                          }));
                        }}
                        placeholder="Nhận xét tiêu chí..."
                        className="w-full text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT 2: ANCHORED FEEDBACKS LIST */}
            {rightTab === 'feedbacks' && (
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {feedbacks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                    Chưa có góp ý neo nào trên bài này.
                  </div>
                ) : (
                  feedbacks.map(fb => (
                    <div key={fb.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{fb.authorName}</span>
                        <span className="text-[10px] text-slate-400">{fb.createdAt}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border-l-2 border-amber-400 italic text-[11px]">
                        "{fb.selectedSnippet}"
                      </div>
                      <p className="text-slate-800">{fb.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bottom Actions Bar: Save Draft & Submit */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isRubricLocked}
                onClick={() => handleSaveRubric(false)}
                className="text-xs"
              >
                Lưu nháp (Ctrl+S)
              </Button>

              <Button
                size="sm"
                variant="primary"
                disabled={isRubricLocked}
                onClick={() => handleSaveRubric(true)}
                leftIcon={isRubricLocked ? <LockClosedIcon className="w-4 h-4" /> : <ShieldCheckIcon className="w-4 h-4" />}
                className="bg-indigo-900 text-white font-bold text-xs"
              >
                {isRubricLocked ? 'Đã nộp điểm' : 'Nộp kết quả'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL: CONTEXTUAL ANCHORED FEEDBACK */}
      <Modal
        isOpen={isAnchorModalOpen}
        onClose={() => setIsAnchorModalOpen(false)}
        title="Tạo Phản Hồi Neo Ngữ Cảnh"
        description={`Gắn nhận xét trực tiếp vào bài của ${currentStudent.name} (${selectedVersion}).`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAnchorModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateFeedback}
              className="bg-indigo-900 text-white font-bold"
            >
              Gửi phản hồi neo
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 italic font-serif">
            "{selectedText || 'Điểm nhìn nghệ thuật hòa nhập vào dòng tâm trạng bên trong nhân vật'}"
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800">
              Mức độ ưu tiên tiếp thu:
            </label>
            <select
              value={feedbackPriority}
              onChange={e => setFeedbackPriority(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs py-2 px-3 focus:outline-none"
            >
              <option value="high">🔴 Quan trọng (Bắt buộc sửa ở v2.0)</option>
              <option value="medium">🟡 Khá quan trọng (Cần thêm dẫn chứng)</option>
              <option value="low">🟢 Góp ý tham khảo</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800">
              Nội dung nhận xét & câu hỏi định hướng:
            </label>
            <textarea
              rows={3}
              value={feedbackContent}
              onChange={e => setFeedbackContent(e.target.value)}
              placeholder="Em đã xác định đúng người quan sát, nhưng cần giải thích việc chuyển điểm nhìn làm thay đổi nhận thức người đọc..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
