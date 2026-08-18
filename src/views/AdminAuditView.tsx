import React, { useState, useMemo } from 'react';
import { useNotificationStore } from '../app/store/useNotificationStore';
import type { UserRole } from '../types';
import {
  Button,
  Badge,
  Card,
  StatCard,
  Tabs,
  FilterBar,
  Modal,
  Avatar
} from '../components/ui';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ServerIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface AdminAuditViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({ onNavigate }) => {
  const { addToast } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'logs' | 'backup'>('users');

  // User Management State
  const [userList, setUserList] = useState(() => {
    return [
      { id: 'user-std-1', username: 'nguyenvanan', name: 'Nguyễn Văn An', role: 'student' as UserRole, className: '11A1', status: 'active', lastLogin: 'Hôm nay 14:32' },
      { id: 'user-std-2', username: 'tranthibinh', name: 'Trần Thị Bình', role: 'student' as UserRole, className: '11A1', status: 'active', lastLogin: 'Hôm nay 10:15' },
      { id: 'user-std-3', username: 'lehoangnam', name: 'Lê Hoàng Nam', role: 'student' as UserRole, className: '11A2', status: 'active', lastLogin: '3 ngày trước' },
      { id: 'user-std-4', username: 'phamminhduc', name: 'Phạm Minh Đức', role: 'student' as UserRole, className: '11A1', status: 'locked', lastLogin: '5 ngày trước' },
      { id: 'user-tch-1', username: 'nguyenthimai', name: 'Cô Nguyễn Thị Mai', role: 'teacher' as UserRole, className: 'Tổ Văn', status: 'active', lastLogin: 'Vừa xong' },
      { id: 'user-peer-1', username: 'lethuthao_peer', name: 'Lê Thu Thảo (Phản biện)', role: 'peer' as UserRole, className: '11A1', status: 'active', lastLogin: 'Hôm qua 16:40' },
      { id: 'user-res-1', username: 'dr_lethanhhuong', name: 'TS. Lê Thanh Hương (Giám khảo)', role: 'researcher' as UserRole, className: 'Hội đồng Khoa học', status: 'active', lastLogin: 'Hôm nay 08:30' },
      { id: 'user-adm-1', username: 'admin_sys', name: 'Quản trị viên Hệ thống', role: 'admin' as UserRole, className: 'Ban CNTT', status: 'active', lastLogin: 'Vừa xong' }
    ];
  });

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected User Modal States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('student');

  // Backup & Restore State
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userList.filter(u => {
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [userList, userSearch, roleFilter, statusFilter]);

  // Audit Logs Data
  const auditLogs = useMemo(() => [
    { id: 'log-1', timestamp: '18/09/2026 14:32:15', actor: 'Nguyễn Văn An (HS)', action: 'CREATE_VERSION_SNAPSHOT', target: 'Hồ sơ Vợ nhặt (v2.0)', severity: 'info' as const, ip: '113.190.234.12' },
    { id: 'log-2', timestamp: '18/09/2026 14:15:02', actor: 'Cô Nguyễn Thị Mai (GV)', action: 'ANCHOR_FEEDBACK_CREATED', target: 'Câu trần thuật v1.0', severity: 'info' as const, ip: '118.70.180.45' },
    { id: 'log-3', timestamp: '18/09/2026 11:20:44', actor: 'Cô Nguyễn Thị Mai (GV)', action: 'SUBMIT_RUBRIC_EVALUATION', target: 'Học sinh Trần Thị Bình (3.6/4)', severity: 'info' as const, ip: '118.70.180.45' },
    { id: 'log-4', timestamp: '18/09/2026 09:05:11', actor: 'Phạm Minh Đức (HS)', action: 'LOGIN_FAILED_ATTEMPT', target: 'Sai mật khẩu lần 3', severity: 'warning' as const, ip: '14.161.32.88' },
    { id: 'log-5', timestamp: '18/09/2026 03:00:00', actor: 'SYSTEM_DAEMON', action: 'AUTOMATED_DATABASE_BACKUP', target: 'Cold Snapshot SHA256: 8f4a...29b', severity: 'info' as const, ip: '127.0.0.1' },
    { id: 'log-6', timestamp: '17/09/2026 16:40:19', actor: 'Lê Thu Thảo (Peer)', action: 'PEER_REVIEW_FEEDBACK_SAVED', target: 'Học sinh Nguyễn Văn An', severity: 'info' as const, ip: '171.244.9.15' }
  ], []);

  // Toggle user active / locked
  const handleToggleUserStatus = (userId: string) => {
    setUserList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'locked' : 'active';
        addToast({
          type: nextStatus === 'active' ? 'success' : 'info',
          title: nextStatus === 'active' ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản',
          message: `Tài khoản ${u.username} (${u.name}) đã được cập nhật.`
        });
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Change Role
  const handleChangeRole = () => {
    if (!selectedUser) return;
    setUserList(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, role: newRole };
      }
      return u;
    }));
    setIsChangeRoleModalOpen(false);
    addToast({
      type: 'success',
      title: 'Đã thay đổi phân quyền RBAC',
      message: `Tài khoản ${selectedUser.username} được chuyển sang vai trò: ${newRole.toUpperCase()}.`
    });
  };

  // Reset Password
  const handleResetPassword = () => {
    if (!selectedUser) return;
    setIsResetPassModalOpen(false);
    addToast({
      type: 'info',
      title: 'Đã tạo liên kết đặt lại mật khẩu',
      message: `Đã gửi mã xác thực khôi phục mật khẩu tạm thời cho ${selectedUser.name}.`
    });
  };

  // Manual Backup trigger
  const handleTriggerBackup = () => {
    setIsBackupRunning(true);
    setTimeout(() => {
      setIsBackupRunning(false);
      addToast({
        type: 'success',
        title: 'Sao lưu hệ thống thành công',
        message: 'Bản snapshot toàn vẹn SHA-256 (Dung lượng 1.42 GB) đã được đồng bộ an toàn.'
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <header className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="text-slate-400 hover:text-white p-0 pr-2"
            >
              Dashboard
            </Button>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-300">Quản Trị Hệ Thống & Vận Hành</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h2 font-bold tracking-tight text-white flex items-center gap-2">
              <ServerIcon className="w-6 h-6 text-indigo-400" />
              Trung Tâm Quản Trị & Audit Log
            </h1>
            <Badge variant="emerald">Hệ thống ổn định 99.98%</Badge>
          </div>
          <p className="text-small text-slate-400 mt-1">
            Giám sát vận hành kỹ thuật, phân quyền RBAC đa vai trò và bảo toàn cơ sở dữ liệu nghiên cứu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            isLoading={isBackupRunning}
            onClick={handleTriggerBackup}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Sao lưu ngay
          </Button>

          <Button
            size="sm"
            variant="academic"
            onClick={() => onNavigate('researcher-view')}
            className="bg-indigo-600 text-white font-bold"
          >
            Chuyển góc nhìn Giám khảo
          </Button>
        </div>
      </header>

      {/* A. 5 OPERATIONAL SUMMARY CARDS */}
      <section aria-label="Chỉ số vận hành hệ thống" className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Tài khoản hoạt động"
          value="84 users"
          subValue="72 học sinh, 4 GV, 8 khác"
          icon={<UserGroupIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Tài khoản bị khóa"
          value="1 user"
          subValue="Phạm Minh Đức (11A1)"
          trend={{ value: "Sai pass > 3 lần", isPositive: false }}
          icon={<LockClosedIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Dung lượng lưu trữ"
          value="1.42 GB"
          subValue="Bao gồm 144 snapshot"
          icon={<CircleStackIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Sao lưu gần nhất"
          value="03:00 hôm nay"
          subValue="Checksum SHA256: Hợp lệ"
          trend={{ value: "✓ Tự động hàng ngày", isPositive: true }}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />

        <StatCard
          label="Cảnh báo an ninh"
          value="0 sự cố"
          subValue="1 warning đăng nhập"
          icon={<ShieldCheckIcon className="w-5 h-5" />}
        />
      </section>

      {/* Navigation Tabs */}
      <Tabs
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        items={[
          { id: 'users', label: 'Quản lý người dùng & Tài khoản' },
          { id: 'permissions', label: 'Ma trận phân quyền (RBAC)' },
          { id: 'logs', label: 'Nhật ký thao tác (Audit Logs)' },
          { id: 'backup', label: 'Sao lưu & Phục hồi cơ sở dữ liệu' }
        ]}
      />

      {/* ========================================================================= */}
      {/* TAB 1: USER MANAGEMENT DATA TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Danh Sách Tài Khoản Người Dùng
              </h2>
              <p className="text-xs text-slate-500">Quản lý định danh, vai trò và trạng thái đăng nhập.</p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Thêm tài khoản',
                  message: 'Hệ thống hỗ trợ đồng bộ danh sách học sinh từ file Excel/CSV theo chuẩn Sở GD&ĐT.'
                });
              }}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              className="bg-indigo-900 text-white font-bold"
            >
              Thêm người dùng mới
            </Button>
          </div>

          {/* Filters & Search */}
          <FilterBar
            searchQuery={userSearch}
            onSearchChange={setUserSearch}
            searchPlaceholder="Tìm theo mã định danh, họ tên hoặc username..."
            onResetFilters={() => {
              setUserSearch('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            filters={
              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="peer">Bạn học phản biện</option>
                  <option value="researcher">Giám khảo / Nghiên cứu</option>
                  <option value="admin">Quản trị viên</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
              </div>
            }
          />

          {/* User Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã người dùng</th>
                  <th className="p-3.5">Tên hiển thị</th>
                  <th className="p-3.5">Vai trò</th>
                  <th className="p-3.5">Lớp / Đơn vị</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5">Đăng nhập gần nhất</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{user.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <div>{user.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">@{user.username}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'rose'
                            : user.role === 'teacher'
                            ? 'emerald'
                            : user.role === 'researcher'
                            ? 'purple'
                            : user.role === 'peer'
                            ? 'amber'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-700">{user.className}</td>
                    <td className="p-3.5">
                      <Badge variant={user.status === 'active' ? 'emerald' : 'rose'} size="sm">
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500">{user.lastLogin}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setIsChangeRoleModalOpen(true);
                          }}
                          className="text-indigo-700 font-bold p-1 text-[11px]"
                        >
                          Đổi quyền
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetPassModalOpen(true);
                          }}
                          className="text-slate-600 p-1 text-[11px]"
                        >
                          Reset pass
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-1 text-[11px] font-bold ${user.status === 'active' ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                          {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE & PERMISSION MATRIX (RBAC UI) */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Ma Trận Phân Quyền Vai Trò (Role-Based Access Control)
            </h2>
            <p className="text-xs text-slate-500">
              Mô hình trực quan thể hiện ranh giới bảo mật nghiêm ngặt được thực thi ở tầng Server-side.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden text-center">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left w-64">Quyền hạn / Chức năng</th>
                  <th className="p-3">Học sinh (Student)</th>
                  <th className="p-3">Bạn học (Peer)</th>
                  <th className="p-3">Giáo viên (Teacher)</th>
                  <th className="p-3">Giám khảo (Researcher)</th>
                  <th className="p-3">Quản trị (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Tạo & Lưu nháp hồ sơ đọc', roles: [true, false, false, false, true] },
                  { name: 'Đóng băng phiên bản (Snapshot v1.0, v2.0)', roles: [true, false, false, false, true] },
                  { name: 'Xem so sánh Visual Diff', roles: [true, true, true, true, true] },
                  { name: 'Gắn nhận xét phản hồi neo ngữ cảnh', roles: [false, true, true, false, true] },
                  { name: 'Chấm điểm Rubric 4 mức độ chính thức', roles: [false, false, true, false, true] },
                  { name: 'Tạo nhiệm vụ đọc hiểu & Quản lý lớp', roles: [false, false, true, false, true] },
                  { name: 'Xem dữ liệu nghiên cứu đối chứng ẩn danh', roles: [false, false, true, true, true] },
                  { name: 'Quản lý tài khoản & Sao lưu hệ thống', roles: [false, false, false, false, true] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 text-left font-bold text-slate-900">{row.name}</td>
                    {row.roles.map((allowed, rIdx) => (
                      <td key={rIdx} className="p-3">
                        {allowed ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Cho phép
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">−</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nhật Ký Thao Tác Hệ Thống (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500">Mọi hành động tạo phiên bản, chấm điểm và thay đổi đều được ghi vết bất biến.</p>
            </div>
            <Badge variant="blue">{auditLogs.length} sự kiện gần nhất</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 font-sans">
                <tr>
                  <th className="p-3.5">Thời gian (UTC+7)</th>
                  <th className="p-3.5">Người thực hiện</th>
                  <th className="p-3.5">Hành động</th>
                  <th className="p-3.5">Đối tượng tác động</th>
                  <th className="p-3.5">Địa chỉ IP</th>
                  <th className="p-3.5 text-center">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-slate-900 font-sans">{log.actor}</td>
                    <td className="p-3.5 font-bold text-indigo-700">{log.action}</td>
                    <td className="p-3.5 text-slate-700 font-sans">{log.target}</td>
                    <td className="p-3.5 text-slate-500">{log.ip}</td>
                    <td className="p-3.5 text-center font-sans">
                      <Badge variant={log.severity === 'warning' ? 'amber' : 'blue'} size="sm">
                        {log.severity.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BACKUP & RESTORE */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backup Snapshot Status */}
          <Card padding="lg" className="border-slate-200 bg-white shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Trạng Thái Sao Lưu Cơ Sở Dữ Liệu
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Snapshot định kỳ 03:00 Hàng Ngày</span>
                  <Badge variant="emerald">Hợp lệ (Verified)</Badge>
                </div>
                <p className="text-slate-700 text-[11px]">
                  Bản ghi đầy đủ chứa 72 học sinh, 144 phiên bản hồ sơ và 216 phản hồi neo.
                </p>
                <div className="font-mono text-[10px] text-emerald-800 pt-1">
                  SHA-256: 8f4a3c9b71d2e850...3a1c92
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Dung lượng tệp</span>
                  <strong className="text-slate-900 text-sm">1.42 GB</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Tần suất</span>
                  <strong className="text-slate-900 text-sm">Mỗi 24 giờ</strong>
                </div>
              </div>

              <Button
                variant="primary"
                isLoading={isBackupRunning}
                onClick={handleTriggerBackup}
                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                className="w-full bg-slate-900 text-white font-bold"
              >
                Tạo bản Snapshot thủ công ngay
              </Button>
            </div>
          </Card>

          {/* Database Restore Action (High Warning) */}
          <Card padding="lg" className="border-rose-200 bg-rose-50/20 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-rose-900">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold">
                Phục Hồi Cơ Sở Dữ Liệu (Cực Kỳ Thận Trọng)
              </h2>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Thao tác phục hồi sẽ đưa hệ thống về trạng thái của bản snapshot được chọn. Mọi phiên bản nháp chưa lưu sau mốc này sẽ bị ghi đè.
            </p>

            <div className="p-3 bg-white rounded-xl border border-rose-200 text-[11px] text-rose-950 space-y-1">
              <strong>Quy trình bảo vệ nghiêm ngặt:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Yêu cầu quyền Quản trị viên tối cao (Super Admin).</li>
                <li>Xác thực mật khẩu cấp 2.</li>
                <li>Xác nhận nhập chuỗi an toàn.</li>
              </ul>
            </div>

            <Button
              variant="academic"
              onClick={() => {
                setRestoreConfirmText('');
                setIsRestoreModalOpen(true);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Mở quy trình phục hồi dữ liệu...
            </Button>
          </Card>
        </div>
      )}

      {/* Modal Change Role */}
      <Modal
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        title={`Thay Đổi Quyền Hạn: ${selectedUser?.name}`}
        description="Phân quyền lại vai trò người dùng trong hệ thống RBAC."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsChangeRoleModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleChangeRole} className="bg-indigo-900 text-white font-bold">
              Xác nhận đổi vai trò
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <p>Chọn vai trò mới cho tài khoản <strong>@{selectedUser?.username}</strong>:</p>
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as UserRole)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs py-2 px-3 focus:outline-none font-bold"
          >
            <option value="student">Học sinh (Student)</option>
            <option value="peer">Bạn học phản biện (Peer)</option>
            <option value="teacher">Giáo viên (Teacher)</option>
            <option value="researcher">Giám khảo / Nghiên cứu (Researcher)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        title={`Đặt Lại Mật Khẩu: ${selectedUser?.name}`}
        description="Tạo mã đặt lại mật khẩu tạm thời cho người dùng."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsResetPassModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleResetPassword} className="bg-indigo-900 text-white font-bold">
              Gửi liên kết đặt lại
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-700">
          Mã xác thực khôi phục sẽ được gửi tới hòm thư hoặc số định danh của tài khoản <strong>@{selectedUser?.username}</strong>.
        </p>
      </Modal>

      {/* Modal Restore Confirmation Multi-step */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="CẢNH BÁO: Xác Nhận Phục Hồi Dữ Liệu"
        description="Thao tác này sẽ ghi đè dữ liệu hiện tại bằng bản Snapshot 03:00 hôm nay."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)}>Hủy bỏ an toàn</Button>
            <Button
              variant="primary"
              disabled={restoreConfirmText !== 'XAC-NHAN-KHOI-PHUC'}
              onClick={() => {
                setIsRestoreModalOpen(false);
                addToast({
                  type: 'success',
                  title: 'Đã hoàn tất phục hồi cơ sở dữ liệu',
                  message: 'Hệ thống đã phục hồi về trạng thái Snapshot 03:00.'
                });
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-40"
            >
              Tiến hành phục hồi ngay
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 font-bold">
            ⚠️ Thao tác không thể hoàn tác sau khi thực thi!
          </div>
          <p>
            Để tiếp tục, vui lòng nhập chính xác chuỗi ký tự bên dưới vào ô nhập liệu:
          </p>
          <div className="p-2 bg-slate-100 rounded text-center font-mono font-bold text-slate-900 select-all">
            XAC-NHAN-KHOI-PHUC
          </div>
          <input
            type="text"
            value={restoreConfirmText}
            onChange={e => setRestoreConfirmText(e.target.value)}
            placeholder="Nhập XAC-NHAN-KHOI-PHUC..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-mono"
          />
        </div>
      </Modal>
    </div>
  );
};
