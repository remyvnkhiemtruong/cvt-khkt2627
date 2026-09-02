import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui';
import type { UserRole } from '../types';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface AdminAuditViewProps {
  onNavigate: (view: string, extraParams?: any) => void;
}

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  peer: 'Phản biện',
  researcher: 'Nghiên cứu',
  admin: 'Quản trị',
  ai: 'AI'
};

const formatDate = (value: string | null) => {
  if (!value) return 'Chưa ghi nhận';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  return date.toLocaleString('vi-VN');
};

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('cvt_auth_token');
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Không thể tải dữ liệu quản trị.');
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const totals = useMemo(() => {
    const byRole = users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] || 0) + 1;
      return accumulator;
    }, {});
    return {
      total: users.length,
      students: byRole.student || 0,
      teachers: byRole.teacher || 0,
      privileged: (byRole.admin || 0) + (byRole.researcher || 0) + (byRole.ai || 0),
      passwordChange: users.filter((user) => user.must_change_password).length
    };
  }, [users]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 animate-fade-in">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-card sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheckIcon className="h-4 w-4" />
            QUẢN TRỊ PRODUCTION
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <ServerIcon className="h-7 w-7 text-indigo-400" />
            Trung tâm quản trị hệ thống
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Dữ liệu tài khoản bên dưới được đọc trực tiếp từ PostgreSQL. Các số liệu backup, audit và trạng thái giả đã được loại khỏi phiên bản chính thức.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadUsers()}
            isLoading={loading}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            className="border-slate-600 text-white hover:bg-slate-800"
          >
            Tải lại dữ liệu
          </Button>
          <Button
            size="sm"
            variant="academic"
            onClick={() => onNavigate('researcher-view')}
            leftIcon={<AcademicCapIcon className="h-4 w-4" />}
          >
            Không gian nghiên cứu
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">Không tải được dữ liệu quản trị</div>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <section aria-label="Tổng quan tài khoản" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Tổng tài khoản', totals.total, UserGroupIcon],
          ['Học sinh', totals.students, UserGroupIcon],
          ['Giáo viên', totals.teachers, AcademicCapIcon],
          ['Tài khoản đặc quyền', totals.privileged, ShieldCheckIcon],
          ['Cần đổi mật khẩu', totals.passwordChange, CircleStackIcon]
        ].map(([label, value, Icon]) => {
          const ItemIcon = Icon as React.ElementType;
          return (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">{String(label)}</span>
                <ItemIcon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{loading ? '—' : String(value)}</div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-bold text-slate-900">Tài khoản trong cơ sở dữ liệu</h2>
            <p className="mt-1 text-xs text-slate-500">Danh sách chỉ đọc trong bản hiện tại để không giả lập thao tác quản trị chưa có API ghi an toàn.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Nguồn: PostgreSQL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold sm:px-5">Người dùng</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-4 py-3 font-semibold">Đăng nhập gần nhất</th>
                <th className="px-4 py-3 font-semibold">Bảo mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">Đang tải dữ liệu thật từ máy chủ…</td>
                </tr>
              )}
              {!loading && users.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">Chưa có tài khoản nào trong cơ sở dữ liệu.</td>
                </tr>
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 sm:px-5">
                    <div className="font-semibold text-slate-900">{user.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{user.email}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">{user.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    {user.must_change_password ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Cần đổi mật khẩu</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đã thiết lập</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Audit & nhật ký</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Phiên bản hiện tại không dựng audit log giả. Khi cần audit đầy đủ, backend phải ghi sự kiện thật theo request ID, actor và timestamp server.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Backup dữ liệu</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sao lưu database được quản lý tại lớp hạ tầng Neon/Vercel; frontend không hiển thị tiến trình backup giả hoặc checksum hard-code.
          </p>
        </div>
      </section>
    </div>
  );
};
