import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useNotificationStore } from '../../app/store/useNotificationStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface AppHeaderProps {
  onNavigate: (view: string, params?: any) => void;
  currentView: string;
  onOpenCommandPalette: () => void;
  onOpenMobileDrawer?: () => void;
  onLogout?: () => void;
}

type ProfileForm = {
  name:string; phone:string; dateOfBirth:string; school:string; schoolYear:string; grade:string;
  studentCode:string; staffCode:string; department:string; bio:string; learningGoal:string;
  favoriteGenres:string; favoriteAuthors:string; favoriteWorks:string;
};

const VIEW_TITLES:Record<string,string>={dashboard:'Bàn học cá nhân','student-dashboard':'Bàn học cá nhân','assignment-list':'Nhiệm vụ học tập','portfolio-list':'Hồ sơ của tôi',editor:'Không gian viết & phân tích','version-diff':'So sánh phiên bản','student-analytics':'Báo cáo tiến bộ năng lực','teacher-dashboard':'Bàn làm việc Giáo viên','teacher-review':'Chấm bài & Phản hồi','assignment-builder':'Tạo nhiệm vụ & Rubric','rubric-management':'Quản lý Rubric','literature-texts':'Ngữ liệu văn học','class-analytics':'Thống kê sư phạm toàn lớp','researcher-view':'Không gian Giám khảo & Nghiên cứu','admin-view':'Quản trị hệ thống & Audit','ai-workspace':'Hàng đợi phản hồi AI','ui-kit':'Design System & UI Kit'};
const ROLE_LABELS:Record<string,string>={student:'Học sinh',teacher:'Giáo viên',peer:'Phản biện',researcher:'Nghiên cứu viên',admin:'Quản trị viên',ai:'AI'};
const home=(role:string)=>role==='teacher'?'teacher-dashboard':role==='researcher'?'researcher-view':role==='admin'?'admin-view':role==='ai'?'ai-workspace':'dashboard';
const joinList=(value?:string[])=>Array.isArray(value)?value.join(', '):'';
const toForm=(user:any):ProfileForm=>({
  name:user.name||'',phone:user.profile?.phone||'',dateOfBirth:user.profile?.dateOfBirth||'',school:user.profile?.school||'',schoolYear:user.profile?.schoolYear||'',grade:user.profile?.grade||'',studentCode:user.profile?.studentCode||'',staffCode:user.profile?.staffCode||'',department:user.profile?.department||'',bio:user.profile?.bio||'',learningGoal:user.profile?.learningGoal||'',favoriteGenres:joinList(user.profile?.favoriteGenres),favoriteAuthors:joinList(user.profile?.favoriteAuthors),favoriteWorks:joinList(user.profile?.favoriteWorks)
});
const splitList=(value:string)=>value.split(',').map(item=>item.trim()).filter(Boolean);

const Field:React.FC<{label:string;value:string;onChange:(value:string)=>void;type?:string;placeholder?:string;readOnly?:boolean}>=({label,value,onChange,type='text',placeholder,readOnly})=><label className="block space-y-1"><span className="text-[11px] font-semibold text-slate-600">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} autoComplete="one-time-code" data-lpignore="true" data-1p-ignore="true" data-form-type="other" autoCorrect="off" autoCapitalize="off" spellCheck={false} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${readOnly?'border-slate-200 bg-slate-50 text-slate-500':'border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}/></label>;

export const AppHeader:React.FC<AppHeaderProps>=({onNavigate,currentView,onOpenCommandPalette,onOpenMobileDrawer,onLogout})=>{
  const currentUser=useAuthStore(state=>state.currentUser);
  const setAuthenticatedUser=useAuthStore(state=>state.setAuthenticatedUser);
  const {addToast}=useNotificationStore();
  const [helpOpen,setHelpOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState<ProfileForm>(()=>toForm(currentUser));
  const change=(key:keyof ProfileForm,value:string)=>setForm(previous=>({...previous,[key]:value}));
  const openProfile=()=>{setForm(toForm(currentUser));setProfileOpen(true);};
  const save=async()=>{
    setSaving(true);
    try{
      const response=await fetch('/api/auth/me',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name:form.name,profile:{phone:form.phone,dateOfBirth:form.dateOfBirth,school:form.school,schoolYear:form.schoolYear,grade:form.grade,studentCode:form.studentCode,staffCode:form.staffCode,department:form.department,bio:form.bio,learningGoal:form.learningGoal,favoriteGenres:splitList(form.favoriteGenres),favoriteAuthors:splitList(form.favoriteAuthors),favoriteWorks:splitList(form.favoriteWorks)}})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.user)throw new Error(data.message||'Không thể lưu hồ sơ');
      setAuthenticatedUser(data.user); setProfileOpen(false);
      addToast({type:'success',title:'Đã cập nhật hồ sơ',message:'Thông tin cá nhân đã được lưu vào PostgreSQL.'});
    }catch(error:any){addToast({type:'error',title:'Không thể cập nhật hồ sơ',message:error?.message||'Vui lòng thử lại.'});}
    finally{setSaving(false);}
  };
  const lastLogin=currentUser.lastLogin?new Date(currentUser.lastLogin).toLocaleString('vi-VN'):'Chưa ghi nhận';

  return <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white shadow-xs">
    <div className="mx-auto h-full max-w-7xl px-3 sm:px-6 lg:px-8"><div className="flex h-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={onOpenMobileDrawer} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Mở menu"><Bars3Icon className="h-5 w-5"/></button><button type="button" onClick={()=>onNavigate(home(currentUser.role))} className="flex shrink-0 items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white"><BookOpenIcon className="h-4 w-4"/></span><span className="hidden text-sm font-bold text-slate-900 sm:inline">Học tốt Ngữ Văn</span></button><span className="hidden text-slate-300 sm:inline">/</span><span className="max-w-[150px] truncate text-xs font-semibold text-slate-700 sm:max-w-xs">{VIEW_TITLES[currentView]||'Học tốt Ngữ Văn'}</span></div>
      <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={onOpenCommandPalette} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"><MagnifyingGlassIcon className="h-3.5 w-3.5"/><span className="hidden md:inline">Tìm nhanh...</span></button><button type="button" onClick={()=>addToast({type:'info',title:'Thông báo',message:'Hiện chưa có thông báo mới.'})} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><BellIcon className="h-4 w-4"/></button><button type="button" onClick={()=>setHelpOpen(true)} className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 sm:block"><QuestionMarkCircleIcon className="h-4 w-4"/></button><Dropdown trigger={<div className="cursor-pointer"><Avatar name={currentUser.name||'Người dùng'} size="sm"/></div>} items={[{key:'profile',label:'Thông tin cá nhân',icon:<UserCircleIcon className="h-4 w-4"/>,onClick:openProfile},{key:'logout',label:'Đăng xuất',icon:<ArrowRightOnRectangleIcon className="h-4 w-4"/>,danger:true,onClick:onLogout}]}/></div>
    </div></div>

    <Modal isOpen={helpOpen} onClose={()=>setHelpOpen(false)} title="Hướng dẫn Học tốt Ngữ Văn" description="Quy trình học tập và phản hồi theo phiên bản" footer={<Button variant="primary" onClick={()=>setHelpOpen(false)}>Đã hiểu</Button>}><div className="space-y-3 text-xs leading-6 text-slate-700"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">1. Nhận nhiệm vụ → 2. Viết theo 6 trục → 3. Nộp V1 → 4. Nhận phản hồi AI/giáo viên → 5. Chỉnh sửa V2 → 6. So sánh phiên bản và theo dõi tiến bộ.</div><div className="rounded-xl bg-slate-50 p-3"><strong>Ctrl + K</strong> mở tìm nhanh; <strong>Esc</strong> đóng cửa sổ.</div></div></Modal>

    <Modal isOpen={profileOpen} onClose={()=>setProfileOpen(false)} title="Thông tin cá nhân" description="Các trường không bắt buộc giúp cá nhân hóa trải nghiệm học Ngữ văn" footer={<div className="flex gap-2"><Button variant="outline" onClick={()=>setProfileOpen(false)}>Hủy</Button><Button variant="primary" isLoading={saving} onClick={save}>Lưu thay đổi</Button></div>}>
      <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1 text-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><Avatar name={currentUser.name||'Người dùng'} size="lg"/><div className="min-w-0"><div className="truncate text-base font-bold text-slate-900">{currentUser.name}</div><div className="truncate text-slate-500">{currentUser.email}</div><div className="mt-1 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{ROLE_LABELS[currentUser.role]||currentUser.role}</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700"><CheckCircleIcon className="h-3.5 w-3.5"/>Hoạt động</span></div></div></div>
        <section className="space-y-3"><h3 className="font-bold text-slate-900">Thông tin cơ bản</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Field label="Họ và tên" value={form.name} onChange={v=>change('name',v)}/><Field label="Email đăng nhập" value={currentUser.email} onChange={()=>{}} readOnly/><Field label="Số điện thoại (không bắt buộc)" value={form.phone} onChange={v=>change('phone',v)} placeholder="09xxxxxxxx"/><Field label="Ngày sinh (không bắt buộc)" type="date" value={form.dateOfBirth} onChange={v=>change('dateOfBirth',v)}/><Field label="Trường / đơn vị" value={form.school} onChange={v=>change('school',v)} placeholder="Tên trường"/><Field label="Năm học" value={form.schoolYear} onChange={v=>change('schoolYear',v)} placeholder="2026-2027"/><Field label="Lớp được hệ thống gán" value={currentUser.className||'Chưa gán lớp'} onChange={()=>{}} readOnly/><Field label="Khối / cấp học" value={form.grade} onChange={v=>change('grade',v)} placeholder="Khối 11"/>{currentUser.role==='student'?<Field label="Mã học sinh" value={form.studentCode} onChange={v=>change('studentCode',v)}/>:<Field label="Mã cán bộ / giáo viên" value={form.staffCode} onChange={v=>change('staffCode',v)}/>}<Field label="Tổ / bộ môn / đơn vị" value={form.department} onChange={v=>change('department',v)} placeholder="Tổ Ngữ văn"/></div></section>
        <section className="space-y-3"><h3 className="font-bold text-slate-900">Hồ sơ học tập</h3><label className="block space-y-1"><span className="font-semibold text-slate-600">Mục tiêu với môn Ngữ văn</span><textarea rows={3} value={form.learningGoal} onChange={e=>change('learningGoal',e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500" placeholder="Ví dụ: cải thiện phân tích dẫn chứng, lập luận..."/></label><label className="block space-y-1"><span className="font-semibold text-slate-600">Giới thiệu ngắn</span><textarea rows={3} value={form.bio} onChange={e=>change('bio',e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500" placeholder="Cách bạn thích học và những điều muốn giáo viên biết..."/></label><Field label="Thể loại yêu thích (ngăn cách bằng dấu phẩy)" value={form.favoriteGenres} onChange={v=>change('favoriteGenres',v)} placeholder="Truyện ngắn, thơ, nghị luận"/><Field label="Tác giả yêu thích" value={form.favoriteAuthors} onChange={v=>change('favoriteAuthors',v)} placeholder="Nam Cao, Kim Lân..."/><Field label="Tác phẩm yêu thích" value={form.favoriteWorks} onChange={v=>change('favoriteWorks',v)} placeholder="Vợ nhặt, Chí Phèo..."/></section>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600"><div><strong>Mã định danh:</strong> {currentUser.id}</div><div><strong>Lần đăng nhập gần nhất:</strong> {lastLogin}</div><div><strong>Trạng thái:</strong> {currentUser.accountStatus==='locked'?'Đã khóa':'Hoạt động'}</div><p className="mt-2 text-[11px] text-slate-400">Vai trò và lớp là dữ liệu quản trị; người dùng không thể tự thay đổi.</p></section>
      </div>
    </Modal>
  </header>;
};
