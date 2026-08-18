import React, { useState, useMemo } from 'react';
import { POETIC_AXES } from '../data/seedData';
import type { PoeticAxisId } from '../types';
import {
  Button,
  Badge,
  Card,
  StatCard,
  Tabs,
  FilterBar,
  Modal,
  Avatar,
  Pagination
} from '../components/ui';
import {
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface ClassAnalyticsViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('11A1');
  const [selectedStudentCell, setSelectedStudentCell] = useState<{
    studentName: string;
    axisId: PoeticAxisId;
    score: number;
    evidence: string;
    comment: string;
    version: string;
  } | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Mock Class Students (Class 11A1 - 36 students)
  const classStudents = useMemo(() => {
    const baseList = [
      { id: 'user-std-1', name: 'Nguyễn Văn An', progress: 100, versionCount: 2, unresolvedFb: 0, gpa: 3.2, lastActive: 'Vừa xong', scores: { plot_situation: 3.5, character_detail: 3.2, narrator_pov: 2.5, space_time: 3.2, language_tone_symbol: 3.0, form_argument: 3.0 } },
      { id: 'user-std-2', name: 'Trần Thị Bình', progress: 100, versionCount: 2, unresolvedFb: 0, gpa: 3.6, lastActive: '2 giờ trước', scores: { plot_situation: 4.0, character_detail: 3.8, narrator_pov: 3.5, space_time: 3.5, language_tone_symbol: 3.5, form_argument: 3.5 } },
      { id: 'user-std-3', name: 'Lê Hoàng Nam', progress: 65, versionCount: 1, unresolvedFb: 3, gpa: 2.2, lastActive: '3 ngày trước', scores: { plot_situation: 2.5, character_detail: 2.2, narrator_pov: 1.8, space_time: 2.5, language_tone_symbol: 2.0, form_argument: 2.2 } },
      { id: 'user-std-4', name: 'Phạm Minh Đức', progress: 40, versionCount: 1, unresolvedFb: 2, gpa: 2.5, lastActive: '5 ngày trước', scores: { plot_situation: 2.8, character_detail: 2.5, narrator_pov: 2.0, space_time: 2.8, language_tone_symbol: 2.5, form_argument: 2.4 } },
      { id: 'user-std-5', name: 'Vũ Thu Trang', progress: 100, versionCount: 3, unresolvedFb: 0, gpa: 3.8, lastActive: '1 giờ trước', scores: { plot_situation: 4.0, character_detail: 4.0, narrator_pov: 3.8, space_time: 3.8, language_tone_symbol: 3.8, form_argument: 3.6 } },
      { id: 'user-std-6', name: 'Hoàng Quốc Bảo', progress: 85, versionCount: 2, unresolvedFb: 1, gpa: 3.0, lastActive: 'Hôm qua', scores: { plot_situation: 3.2, character_detail: 3.0, narrator_pov: 2.8, space_time: 3.0, language_tone_symbol: 3.0, form_argument: 3.0 } },
      { id: 'user-std-7', name: 'Đặng Mai Lan', progress: 95, versionCount: 2, unresolvedFb: 0, gpa: 3.4, lastActive: 'Hôm nay', scores: { plot_situation: 3.8, character_detail: 3.5, narrator_pov: 3.0, space_time: 3.4, language_tone_symbol: 3.2, form_argument: 3.5 } },
      { id: 'user-std-8', name: 'Bùi Gia Huy', progress: 70, versionCount: 1, unresolvedFb: 2, gpa: 2.6, lastActive: '2 ngày trước', scores: { plot_situation: 3.0, character_detail: 2.8, narrator_pov: 2.2, space_time: 2.8, language_tone_symbol: 2.4, form_argument: 2.5 } },
    ];
    return baseList;
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [classStudents, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Heatmap Color Helper
  const getScoreColor = (score: number) => {
    if (score >= 3.6) return 'bg-emerald-500 text-white font-bold';
    if (score >= 3.0) return 'bg-indigo-600 text-white font-bold';
    if (score >= 2.0) return 'bg-amber-400 text-amber-950 font-bold';
    return 'bg-rose-500 text-white font-bold';
  };

  // Export File simulation
  const handleExportData = (type: 'csv' | 'pdf' | 'word') => {
    setIsExporting(true);
    setExportSuccessMessage(null);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccessMessage(`Đã xuất thành công tệp danh sách & ma trận Rubric lớp 11A1 (${type.toUpperCase()}).`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Classroom Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('teacher-dashboard')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="text-slate-600 hover:text-slate-900 p-0 pr-2"
            >
              Bàn làm việc Giáo viên
            </Button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Thống Kê Sư Phạm Lớp</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h2 font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserGroupIcon className="w-6 h-6 text-indigo-700" />
              Hồ Sơ Lớp 11A1 Chuyên Văn
            </h1>
            <Badge variant="blue">Năm học 2026 – 2027</Badge>
          </div>
          <p className="text-small text-slate-500 mt-1">
            Giáo viên phụ trách: <strong className="text-slate-800">Cô Nguyễn Thị Mai</strong> • Sĩ số: <strong className="text-slate-800">36 học sinh</strong> • Tổ Ngữ văn
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportData('csv')}
            isLoading={isExporting}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
          >
            Xuất CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<PrinterIcon className="w-4 h-4" />}
          >
            In báo cáo
          </Button>

          <Button
            size="sm"
            variant="academic"
            onClick={() => onNavigate('assignment-builder')}
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
          >
            Giao nhiệm vụ cho lớp
          </Button>
        </div>
      </header>

      {/* Export Success Notification */}
      {exportSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <section aria-label="Chỉ số lớp" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Điểm trung bình lớp"
          value="3.1 / 4.0 đ"
          subValue="Mức Khá – Tốt"
          trend={{ value: "+0.4 đ toàn kỳ", isPositive: true }}
          icon={<SparklesIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Tỷ lệ nộp bài v2.0"
          value="83%"
          subValue="30/36 học sinh"
          trend={{ value: "Đúng tiến độ", isPositive: true }}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Học sinh cần hỗ trợ"
          value="3 em"
          subValue="Trục Điểm nhìn < 2.5"
          trend={{ value: "Cần kèm cặp", isPositive: false }}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Tổng số góp ý đã trao"
          value="84 phản hồi"
          subValue="100% đã được đọc"
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
        />
      </section>

      {/* Navigation Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'heatmap', label: 'Ma trận Heatmap 6 Trục Thi Pháp' },
          { id: 'students', label: 'Danh sách học sinh', count: classStudents.length },
          { id: 'distribution', label: 'Phân phối điểm & Tiến độ' },
        ]}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Tìm kiếm học sinh theo họ tên..."
        activeFilterCount={selectedClass !== '11A1' ? 1 : 0}
        onResetFilters={() => setSearchQuery('')}
        filters={
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none"
          >
            <option value="11A1">Lớp 11A1 (36 HS)</option>
            <option value="11A2">Lớp 11A2 (36 HS)</option>
          </select>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: PEDAGOGICAL HEATMAP (6 POETIC AXES MATRIX) */}
      {/* ========================================================================= */}
      {activeTab === 'heatmap' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Ma Trận Năng Lực Toàn Lớp
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Bản Đồ Nhiệt (Heatmap) 6 Trục Thi Pháp Lớp 11A1
              </h2>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-bold text-slate-700">Mức điểm:</span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block" />
                <span>&lt; 2.0 (Chưa đạt)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" />
                <span>2.0–2.9 (Cơ bản)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
                <span>3.0–3.5 (Khá)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                <span>3.6–4.0 (Xuất sắc)</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            * Nhấp chuột vào bất kỳ ô điểm nào để mở trích dẫn dẫn chứng và lí giải chi tiết của học sinh đó.
          </p>

          {/* Heatmap Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-center">
                <tr>
                  <th className="p-3 text-left w-48">Học sinh</th>
                  <th className="p-3">Tình huống</th>
                  <th className="p-3">Nhân vật</th>
                  <th className="p-3">Điểm nhìn</th>
                  <th className="p-3">Không gian</th>
                  <th className="p-3">Ngôn ngữ</th>
                  <th className="p-3">Tính chỉnh thể</th>
                  <th className="p-3">Điểm TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(std => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition text-center">
                    <td className="p-3 text-left font-bold text-slate-900 flex items-center gap-2">
                      <Avatar name={std.name} size="sm" />
                      <div>
                        <div>{std.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{std.versionCount} phiên bản</span>
                      </div>
                    </td>

                    {POETIC_AXES.map(axis => {
                      const score = std.scores[axis.id] || 2.0;
                      return (
                        <td key={axis.id} className="p-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentCell({
                                studentName: std.name,
                                axisId: axis.id,
                                score,
                                evidence: '“Nhìn người đàn bà ngồi ở mép giường, Tràng chợt thấy thương thương...”',
                                comment: `Bài làm của ${std.name} ở trục ${axis.shortName} thể hiện tốt khả năng trích dẫn ngữ liệu.`,
                                version: 'v2.0'
                              });
                            }}
                            className={`w-12 h-9 rounded-lg mx-auto flex items-center justify-center transition-transform hover:scale-105 shadow-2xs ${getScoreColor(score)}`}
                            title={`Nhấn xem chi tiết dẫn chứng ${axis.shortName} của ${std.name}`}
                          >
                            {score.toFixed(1)}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-3 font-bold text-slate-900 text-sm">
                      {std.gpa.toFixed(1)} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENT TABLE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Danh Sách Học Sinh & Tiến Trình Nộp Bài
            </h2>
            <Badge variant="blue">{classStudents.length} học sinh</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Học sinh</th>
                  <th className="p-3.5">Tiến độ bài</th>
                  <th className="p-3.5">Số phiên bản</th>
                  <th className="p-3.5">Feedback chưa sửa</th>
                  <th className="p-3.5">Điểm TB</th>
                  <th className="p-3.5">Hoạt động gần nhất</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(std => (
                  <tr key={std.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <Avatar name={std.name} size="sm" />
                      <span>{std.name}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{std.progress}%</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${std.progress}%` }}
                            className={`h-full rounded-full ${std.progress === 100 ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="purple" size="sm">{std.versionCount} phiên bản</Badge>
                    </td>
                    <td className="p-3.5">
                      {std.unresolvedFb > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {std.unresolvedFb} góp ý
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Đã sửa hết
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-900">{std.gpa.toFixed(1)} / 4.0 đ</td>
                    <td className="p-3.5 text-slate-500">{std.lastActive}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onNavigate('teacher-review', { studentId: std.id, assignmentId: 'assign-vo-nhat' })}
                        rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        className="bg-indigo-900 text-white font-bold"
                      >
                        Chấm hồ sơ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCORE DISTRIBUTION & TASK COMPLETION */}
      {/* ========================================================================= */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Phân Bố Mức Điểm 6 Trục Thi Pháp Lớp 11A1
            </h2>

            <div className="space-y-4 pt-2">
              {POETIC_AXES.map(axis => (
                <div key={axis.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{axis.title}</span>
                    <span className="text-indigo-900 font-bold">TB: 3.1 / 4.0 đ</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div style={{ width: '10%' }} className="bg-rose-500" title="Chưa đạt: 10%" />
                    <div style={{ width: '25%' }} className="bg-amber-400" title="Cơ bản: 25%" />
                    <div style={{ width: '45%' }} className="bg-indigo-600" title="Khá: 45%" />
                    <div style={{ width: '20%' }} className="bg-emerald-500" title="Xuất sắc: 20%" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Tỷ Lệ Tiếp Thu Phản Hồi Giữa Các Phiên Bản
            </h2>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                <span className="font-bold text-indigo-950 block text-xs">Hiệu quả sửa đổi từ v1.0 ➔ v2.0:</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Toàn lớp 11A1 đã tiếp thu <strong>84/90 góp ý neo ngữ cảnh</strong> của giáo viên (đạt <strong>93.3%</strong>). Điểm số trung bình sau khi sửa đổi tăng trung bình <strong>+0.7 đ</strong> trên thang 4.0.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Bản sơ thảo v1.0</span>
                  <span className="text-base font-bold text-slate-800">2.4 / 4.0 đ</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[11px]">Bản chỉnh sửa v2.0</span>
                  <span className="text-base font-bold text-emerald-900">3.1 / 4.0 đ (+29%)</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HEATMAP CELL DEEP-LINK EVIDENCE PREVIEW */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedStudentCell}
        onClose={() => setSelectedStudentCell(null)}
        title={`Chi Tiết Năng Lực: ${selectedStudentCell?.studentName}`}
        description={`Trục thi pháp: ${POETIC_AXES.find(a => a.id === selectedStudentCell?.axisId)?.title} • Phiên bản ${selectedStudentCell?.version}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedStudentCell(null)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const stdId = classStudents.find(s => s.name === selectedStudentCell?.studentName)?.id || 'user-std-1';
                onNavigate('teacher-review', { studentId: stdId, assignmentId: 'assign-vo-nhat' });
                setSelectedStudentCell(null);
              }}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              className="bg-indigo-900 text-white font-bold"
            >
              Mở phòng chấm bài chi tiết
            </Button>
          </>
        }
      >
        {selectedStudentCell && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900">Điểm Rubric đã chấm:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getScoreColor(selectedStudentCell.score)}`}>
                {selectedStudentCell.score.toFixed(1)} / 4.0 đ
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Trích dẫn dẫn chứng học sinh đã phân tích:</span>
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-indigo-950 font-serif italic">
                {selectedStudentCell.evidence}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Nhận xét sư phạm của giáo viên:</span>
              <p className="text-slate-800 leading-relaxed p-3 bg-white rounded-xl border border-slate-200">
                {selectedStudentCell.comment}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
