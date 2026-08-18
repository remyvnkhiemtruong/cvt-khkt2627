import React from 'react';
import { useAuthStore } from '../app/store/useAuthStore';
import { mockDb } from '../services/mockApi/mockDb';
import {
  StatCard,
  Button,
  Badge,
  Card,
  Progress,
  Avatar
} from '../components/ui';
import {
  UserGroupIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface TeacherDashboardViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuthStore();
  const assignments = mockDb.getAssignments();

  // Submissions waiting for review
  const pendingSubmissions = [
    {
      id: 'sub-1',
      studentId: 'user-std-1',
      studentName: 'Nguyễn Văn An',
      className: '11A1',
      assignmentId: 'assign-vo-nhat',
      assignmentTitle: 'Phân tích nghệ thuật xây dựng tình huống & điểm nhìn (Vợ nhặt)',
      submittedVersion: 'v1.0',
      submittedAt: 'Hôm nay lúc 14:15',
      status: 'Chờ giáo viên chấm',
      statusVariant: 'amber' as const
    },
    {
      id: 'sub-2',
      studentId: 'user-std-2',
      studentName: 'Trần Thị Bình',
      className: '11A1',
      assignmentId: 'assign-vo-nhat',
      submittedVersion: 'v2.0',
      submittedAt: 'Hôm qua lúc 18:30',
      status: 'Đã nộp bản sửa v2.0',
      statusVariant: 'purple' as const
    },
    {
      id: 'sub-3',
      studentId: 'user-std-3',
      studentName: 'Lê Hoàng Nam',
      className: '11A2',
      assignmentId: 'assign-chi-pheo',
      assignmentTitle: 'Phân tích tiếng chửi và diễn biến tâm lý Chí Phèo',
      submittedVersion: 'v1.0',
      submittedAt: '17/09/2026 10:20',
      status: 'Chờ giáo viên chấm',
      statusVariant: 'amber' as const
    }
  ];

  // Students Needing Pedagogical Attention
  const studentsNeedingAttention = [
    {
      id: 'attn-1',
      studentId: 'user-std-3',
      name: 'Lê Hoàng Nam',
      className: '11A2',
      issue: 'Điểm nhìn trần thuật dưới 2.0 ở 2 bài gần nhất',
      priority: 'high' as const,
      lastActivity: '3 ngày trước',
      actionLabel: 'Giao bài luyện điểm nhìn'
    },
    {
      id: 'attn-2',
      studentId: 'user-std-1',
      name: 'Nguyễn Văn An',
      className: '11A1',
      issue: 'Có 3 phản hồi chưa tiếp thu ở bản v1.0',
      priority: 'medium' as const,
      lastActivity: 'Hôm nay 14:15',
      actionLabel: 'Nhắc nhở tiếp thu'
    },
    {
      id: 'attn-3',
      studentId: 'user-std-4',
      name: 'Phạm Minh Đức',
      className: '11A1',
      issue: 'Chưa nộp bản sơ thảo v1.0 (sắp quá hạn)',
      priority: 'high' as const,
      lastActivity: '5 ngày trước',
      actionLabel: 'Gửi thông báo nhắc nhở'
    }
  ];

  // Class Progress Overview
  const classProgressList = [
    {
      id: 'cp-1',
      assignmentId: 'assign-vo-nhat',
      assignmentTitle: 'Vợ nhặt (Kim Lân) — Tình huống & Điểm nhìn',
      className: 'Lớp 11A1 Chuyên Văn',
      completedCount: 30,
      totalCount: 36,
      percentage: 83,
      deadline: '2026-09-30'
    },
    {
      id: 'cp-2',
      assignmentId: 'assign-chi-pheo',
      assignmentTitle: 'Chí Phèo (Nam Cao) — Diễn biến tâm lý & Tiếng chửi',
      className: 'Lớp 11A1 Chuyên Văn',
      completedCount: 34,
      totalCount: 36,
      percentage: 94,
      deadline: '2026-09-20'
    },
    {
      id: 'cp-3',
      assignmentId: 'assign-hai-dua-tre',
      assignmentTitle: 'Hai đứa trẻ (Thạch Lam) — Không gian ánh sáng & Bóng tối',
      className: 'Lớp 11A2 Chuyên Văn',
      completedCount: 36,
      totalCount: 36,
      percentage: 100,
      deadline: '2026-09-15'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 shadow-card border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-caption font-semibold border border-slate-700">
            <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
            Tổ Chuyên Môn Ngữ Văn THPT
          </div>
          <h1 className="text-h2 font-bold tracking-tight text-white">
            Bàn Làm Việc Giáo Viên — Cô {currentUser.name.split(' ').pop()}
          </h1>
          <p className="text-small text-slate-300">
            Tổng quan tiến độ 2 lớp phụ trách: <strong className="text-white">11A1 (36 HS)</strong> và <strong className="text-white">11A2 (36 HS)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => onNavigate('class-analytics')}
            leftIcon={<ChartBarIcon className="w-4 h-4 text-white" />}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Phân tích lớp & Heatmap
          </Button>

          <Button
            variant="primary"
            onClick={() => onNavigate('assignment-builder')}
            leftIcon={<PlusIcon className="w-4 h-4 text-slate-900" />}
            className="bg-white hover:bg-slate-100 text-slate-900 font-bold"
          >
            Tạo nhiệm vụ mới
          </Button>
        </div>
      </header>

      {/* A. 4 SUMMARY CARDS (THE 4 CORE QUESTIONS) */}
      <section aria-label="Chỉ số giáo viên" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Lớp phụ trách"
          value="2 lớp"
          subValue="72 học sinh đang học"
          icon={<UserGroupIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Nhiệm vụ đang mở"
          value={`${assignments.length} bài`}
          subValue="Đang trong tiến trình học"
          icon={<BookOpenIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Bài chờ phản hồi"
          value={`${pendingSubmissions.length} bài nộp`}
          subValue="Cần chấm trong tuần này"
          trend={{ value: "Ưu tiên chấm v1.0", isPositive: false }}
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Học sinh cần hỗ trợ"
          value={`${studentsNeedingAttention.length} em`}
          subValue="Dưới ngưỡng hoặc trễ hạn"
          trend={{ value: "Cần can thiệp", isPositive: false }}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        />
      </section>

      {/* B & C. GRID: CLASS PROGRESS & NEEDS ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* B. CLASS PROGRESS (7 COLS) */}
        <section aria-labelledby="class-progress-heading" className="lg:col-span-7 space-y-4">
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  1. Lớp Đang Tiến Triển Thế Nào?
                </span>
                <h2 id="class-progress-heading" className="text-base font-bold text-slate-900">
                  Tiến Độ Hoàn Thành Nhiệm Vụ Theo Từng Lớp
                </h2>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate('class-analytics')}
                rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                className="text-xs text-indigo-700 font-bold"
              >
                Chi tiết lớp
              </Button>
            </div>

            <div className="space-y-4">
              {classProgressList.map(cp => (
                <div
                  key={cp.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" size="sm">{cp.className}</Badge>
                        <span className="text-caption text-slate-500 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> Hạn nộp: {cp.deadline}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 mt-1">{cp.assignmentTitle}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-indigo-950 block">
                        {cp.completedCount}/{cp.totalCount} hoàn thành
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">{cp.percentage}%</span>
                    </div>
                  </div>

                  <Progress
                    value={cp.percentage}
                    max={100}
                    variant={cp.percentage === 100 ? 'success' : 'indigo'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* C. NEEDS ATTENTION (5 COLS) */}
        <section aria-labelledby="needs-attention-heading" className="lg:col-span-5 space-y-4">
          <Card padding="lg" className="border-amber-200 bg-amber-50/20 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  2. Ai Cần Hỗ Trợ Sư Phạm?
                </span>
                <h2 id="needs-attention-heading" className="text-base font-bold text-slate-900">
                  Học Sinh Gặp Khó Khăn & Cần Can Thiệp
                </h2>
              </div>
              <Badge variant="amber">{studentsNeedingAttention.length} học sinh</Badge>
            </div>

            <div className="space-y-3">
              {studentsNeedingAttention.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-white shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={item.name} size="sm" />
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">Lớp {item.className} • Hoạt động: {item.lastActivity}</span>
                      </div>
                    </div>
                    <Badge variant={item.priority === 'high' ? 'rose' : 'amber'} size="sm">
                      {item.priority === 'high' ? 'Cần hỗ trợ gấp' : 'Theo dõi'}
                    </Badge>
                  </div>

                  <div className="p-2 bg-amber-50 rounded-lg text-amber-950 text-[11px] font-medium">
                    ⚠️ {item.issue}
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate('teacher-review', { studentId: item.studentId, assignmentId: 'assign-vo-nhat' })}
                      className="text-caption font-bold text-indigo-900"
                    >
                      {item.actionLabel} ➔
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* D. RECENT SUBMISSIONS WAITING FOR FEEDBACK */}
      <section aria-labelledby="submissions-heading">
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                3. Bài Nào Đang Chờ Phản Hồi?
              </span>
              <h2 id="submissions-heading" className="text-base font-bold text-slate-900">
                Danh Sách Hồ Sơ Đọc Mới Nộp Chờ Đánh Giá & Neo Nhận Xét
              </h2>
            </div>
            <Badge variant="blue">{pendingSubmissions.length} bài cần xử lý</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Học sinh</th>
                  <th className="p-3.5">Nhiệm vụ</th>
                  <th className="p-3.5">Phiên bản nộp</th>
                  <th className="p-3.5">Thời gian nộp</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <Avatar name={sub.studentName} size="sm" />
                      <div>
                        <div>{sub.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Lớp {sub.className}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-xs truncate">
                      {sub.assignmentTitle || 'Phân tích truyện ngắn Vợ nhặt (Kim Lân)'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={sub.statusVariant} size="sm">{sub.submittedVersion}</Badge>
                    </td>
                    <td className="p-3.5 text-slate-500">{sub.submittedAt}</td>
                    <td className="p-3.5">
                      <Badge variant={sub.statusVariant} size="sm">{sub.status}</Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onNavigate('teacher-review', { studentId: sub.studentId, assignmentId: sub.assignmentId })}
                        rightIcon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        className="bg-indigo-900 text-white font-bold"
                      >
                        Chấm bài & Neo nhận xét
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};
