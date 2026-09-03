import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Input, Modal, PageHeader } from '../components/ui';
import type { AcademicClass, AuditLog, UserRole } from '../types';
import { AcademicCapIcon, ArrowPathIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface AdminAuditViewProps { onNavigate:(view:string,extraParams?:any)=>void; }
type AdminUser={id:string;email:string;name:string;role:UserRole;account_status:'active'|'locked';must_change_password:boolean;created_at:string;last_login:string|null;};
const roles:UserRole[]=['student','teacher','peer','researcher','admin','ai'];
const labels:Record<UserRole,string>={student:'Học sinh',teacher:'Giáo viên',peer:'Phản biện',researcher:'Nghiên cứu',admin:'Quản trị',ai:'AI'};
const fmt=(v:string|null)=>v?new Date(v).toLocaleString('vi-VN'):'Chưa ghi nhận';
async function act(payload:unknown){const r=await fetch('/api/admin/manage',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.code||'Không thể cập nhật');return d;}

export const AdminAuditView:React.FC<AdminAuditViewProps>=({onNavigate})=>{
  const [users,setUsers]=useState<AdminUser[]>([]),[classes,setClasses]=useState<AcademicClass[]>([]),[logs,setLogs]=useState<AuditLog[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
  const [selected,setSelected]=useState<AdminUser|null>(null),[editRole,setEditRole]=useState<UserRole>('student'),[editStatus,setEditStatus]=useState<'active'|'locked'>('active'),[tempPassword,setTempPassword]=useState('');
  const [newName,setNewName]=useState(''),[newEmail,setNewEmail]=useState(''),[newRole,setNewRole]=useState<UserRole>('student'),[newPassword,setNewPassword]=useState('');
  const [classCode,setClassCode]=useState(''),[className,setClassName]=useState(''),[schoolYear,setSchoolYear]=useState('2026-2027');
  const [memberUser,setMemberUser]=useState(''),[memberClass,setMemberClass]=useState(''),[memberRole,setMemberRole]=useState<'student'|'teacher'>('student');

  const load=async()=>{setLoading(true);setError(null);try{const [u,s]=await Promise.all([fetch('/api/admin/users',{credentials:'include'}),fetch('/api/academic/snapshot',{credentials:'include'})]);const ud=await u.json(),sd=await s.json();if(!u.ok)throw new Error(ud.message||'Không thể tải tài khoản');if(!s.ok)throw new Error(sd.message||'Không thể tải dữ liệu học thuật');const nextUsers=ud.users||[],nextClasses=sd.snapshot?.classes||[];setUsers(nextUsers);setClasses(nextClasses);setLogs(sd.snapshot?.auditLogs||[]);if(!memberUser&&nextUsers[0])setMemberUser(nextUsers[0].id);if(!memberClass&&nextClasses[0])setMemberClass(nextClasses[0].code);}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  const totals=useMemo(()=>({total:users.length,students:users.filter(x=>x.role==='student').length,teachers:users.filter(x=>x.role==='teacher').length,locked:users.filter(x=>x.account_status==='locked').length,change:users.filter(x=>x.must_change_password).length}),[users]);
  const open=(u:AdminUser)=>{setSelected(u);setEditRole(u.role);setEditStatus(u.account_status||'active');setTempPassword('');setMessage(null);};
  const saveUser=async()=>{if(!selected)return;setLoading(true);try{await act({action:'update_user',userId:selected.id,role:editRole,accountStatus:editStatus});setMessage('Đã cập nhật tài khoản và ghi nhật ký kiểm toán.');setSelected(null);await load();}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  const resetPass=async()=>{if(!selected)return;setLoading(true);try{const d=await act({action:'reset_password',userId:selected.id});setTempPassword(d.temporaryPassword);setMessage('Đã tạo mật khẩu tạm; chỉ hiển thị trong hộp thoại hiện tại.');await load();}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  const createUser=async()=>{setLoading(true);setError(null);try{const d=await act({action:'create_user',name:newName,email:newEmail,role:newRole});setNewPassword(d.temporaryPassword);setMessage('Đã tạo tài khoản thành công. Sao chép mật khẩu tạm và bàn giao cho người dùng.');setNewName('');setNewEmail('');await load();}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  const createClass=async()=>{setLoading(true);try{await act({action:'create_class',code:classCode,name:className,schoolYear});setClassCode('');setClassName('');setMessage('Đã tạo/cập nhật lớp học.');await load();}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  const assignMember=async()=>{setLoading(true);try{await act({action:'assign_member',classCode:memberClass,userId:memberUser,memberRole});setMessage('Đã gán thành viên vào lớp học.');await load();}catch(e:any){setError(e.message);}finally{setLoading(false);}};

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <PageHeader
        title="Quản trị hệ thống"
        description="Quản lý tài khoản người dùng, phân quyền vai trò, thiết lập lớp học và nhật ký kiểm toán."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={()=>void load()} isLoading={loading} leftIcon={<ArrowPathIcon className="h-4 w-4"/>}>
              Tải lại
            </Button>
            <Button size="sm" variant="outline" onClick={()=>onNavigate('researcher-view')} leftIcon={<AcademicCapIcon className="h-4 w-4"/>}>
              Nghiên cứu
            </Button>
          </div>
        }
      />

      {error&&<Alert type="error" title="Lỗi">{error}</Alert>}
      {message&&<Alert type="success" title="Thông báo">{message}</Alert>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Tổng tài khoản', totals.total],
          ['Học sinh', totals.students],
          ['Giáo viên', totals.teachers],
          ['Đang khóa', totals.locked],
          ['Cần đổi mật khẩu', totals.change]
        ].map(([l,v])=>(
          <div key={String(l)} className="rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="text-xs font-medium text-slate-500">{l}</div>
            <div className="mt-1.5 text-xl font-bold text-slate-900">{loading?'—':v}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Tạo tài khoản mới</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mật khẩu tạm thời sẽ yêu cầu người dùng đổi trong lần đăng nhập đầu tiên.</p>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <Input label="Họ và tên" value={newName} onChange={e=>setNewName(e.target.value)}/>
            <Input label="Email" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/>
            <label className="text-xs font-semibold text-slate-700">Vai trò
              <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500" value={newRole} onChange={e=>setNewRole(e.target.value as UserRole)}>
                {roles.map(r=><option key={r} value={r}>{labels[r]}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <Button size="sm" variant="primary" onClick={createUser} disabled={!newName.trim()||!newEmail.includes('@')} isLoading={loading}>
                Tạo tài khoản
              </Button>
            </div>
          </div>
          {newPassword&&(
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5">
              <div className="text-xs font-semibold text-amber-900">Mật khẩu tạm (sao chép ngay):</div>
              <div className="mt-1 select-all rounded border border-amber-200 bg-white p-2 font-mono text-xs font-bold text-slate-900">{newPassword}</div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserGroupIcon className="h-4 w-4 text-slate-600"/>
            <span>Tạo lớp & phân công thành viên</span>
          </h2>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <Input label="Mã lớp" value={classCode} onChange={e=>setClassCode(e.target.value)} placeholder="11A2"/>
            <Input label="Năm học" value={schoolYear} onChange={e=>setSchoolYear(e.target.value)}/>
            <Input label="Tên lớp" value={className} onChange={e=>setClassName(e.target.value)} placeholder="Lớp 11A2"/>
            <div className="flex items-end">
              <Button size="sm" variant="outline" onClick={createClass} disabled={!classCode.trim()||!className.trim()}>
                Lưu lớp
              </Button>
            </div>
          </div>
          <div className="my-3 border-t border-slate-100"/>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">Người dùng
              <select value={memberUser} onChange={e=>setMemberUser(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
                {users.map(u=><option key={u.id} value={u.id}>{u.name} — {labels[u.role]}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">Lớp học
              <select value={memberClass} onChange={e=>setMemberClass(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
                {classes.map(c=><option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">Vai trò trong lớp
              <select value={memberRole} onChange={e=>setMemberRole(e.target.value as 'student'|'teacher')} className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500">
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button size="sm" variant="primary" onClick={assignMember} disabled={!memberUser||!memberClass}>
                Gán vào lớp
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Danh sách tài khoản người dùng</h2>
            <p className="text-xs text-slate-500 mt-0.5">Khóa/mở tài khoản, đổi vai trò và cấp lại mật khẩu tạm.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Người dùng</th>
                <th className="px-3 py-2.5 font-semibold">Vai trò</th>
                <th className="px-3 py-2.5 font-semibold">Trạng thái</th>
                <th className="px-3 py-2.5 font-semibold">Đăng nhập gần nhất</th>
                <th className="px-3 py-2.5 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u=>(
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <b className="text-slate-900">{u.name}</b>
                    <div className="text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-3 py-2.5"><Badge variant="indigo" size="sm">{labels[u.role]}</Badge></td>
                  <td className="px-3 py-2.5">
                    <Badge variant={u.account_status==='locked'?'rose':'emerald'} size="sm">
                      {u.account_status==='locked'?'Đã khóa':'Hoạt động'}
                    </Badge>
                    {u.must_change_password&&<div className="mt-0.5 text-[11px] text-amber-700 font-medium">Cần đổi MK</div>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{fmt(u.last_login)}</td>
                  <td className="px-3 py-2.5">
                    <Button size="sm" variant="outline" onClick={()=>open(u)}>Quản lý</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Nhật ký hệ thống (Audit log)</h2>
        <p className="mt-0.5 text-xs text-slate-500">200 sự kiện kiểm toán gần nhất được ghi nhận tự động từ máy chủ.</p>
        <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-100">
          {logs.slice(0,200).map(log=>(
            <div key={log.id} className="grid gap-1 py-2 text-xs sm:grid-cols-[160px_160px_1fr]">
              <span className="text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
              <span className="font-medium text-slate-700">{log.actorName} [{log.actorRole}]</span>
              <span><b className="text-slate-900">{log.action}</b> <span className="text-slate-500">{log.target}</span></span>
            </div>
          ))}
          {logs.length===0&&<p className="py-4 text-xs text-slate-500 text-center">Chưa có sự kiện nào.</p>}
        </div>
      </section>

      <Modal
        isOpen={Boolean(selected)}
        onClose={()=>setSelected(null)}
        title={selected?`Quản lý tài khoản — ${selected.name}`:'Quản lý tài khoản'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={()=>setSelected(null)}>Đóng</Button>
            <Button variant="primary" size="sm" onClick={saveUser} isLoading={loading}>Lưu thay đổi</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Vai trò người dùng
            <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500" value={editRole} onChange={e=>setEditRole(e.target.value as UserRole)}>
              {roles.map(r=><option key={r} value={r}>{labels[r]}</option>)}
            </select>
          </label>
          <label className="block font-semibold text-slate-700">Trạng thái tài khoản
            <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs outline-none focus:border-indigo-500" value={editStatus} onChange={e=>setEditStatus(e.target.value as 'active'|'locked')}>
              <option value="active">Hoạt động bình thường</option>
              <option value="locked">Khóa tài khoản</option>
            </select>
          </label>
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <LockClosedIcon className="h-4 w-4"/>
              <span>Cấp lại mật khẩu tạm</span>
            </div>
            <Button size="sm" variant="outline" className="mt-2.5" onClick={resetPass} isLoading={loading}>
              Tạo mật khẩu tạm
            </Button>
            {tempPassword&&(
              <div className="mt-2 select-all rounded border border-amber-200 bg-white p-2 font-mono text-xs font-bold text-slate-900">
                {tempPassword}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
