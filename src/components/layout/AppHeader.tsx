import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useNotificationStore } from '../../app/store/useNotificationStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { UserProfile } from '../../types';
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

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Bàn học cá nhân',
  'student-dashboard': 'Bàn học cá nhân',
  'assignment-list': 'Nhiệm vụ học tập',
  'portfolio-list': 'Hồ sơ của tôi',
  editor: 'Không gian viết & phân tích',
  'version-diff': 'So sánh phiên bản',
  'student-analytics': 'Báo cáo tiến bộ năng lực',
  'teacher-dashboard': 'Bàn làm việc Giáo viên',
  'teacher-review': 'Chấm bài & Phản hồi',
  'assignment-builder': 'Tạo nhiệm vụ & Rubric',
  'rubric-management': 'Quản lý Rubric',
  'literature-texts': 'Ngữ liệu văn học',
  'class-analytics': 'Thống kê sư phạm toàn lớp',
  'researcher-view': 'Không gian Giám khảo & Nghiên cứu',
  'admin-view': 'Quản trị hệ thống & Audit',
  'ai-workspace': 'Hàng đợi phản hồi AI',
  'ui-kit': 'Design System & UI Kit'
};

const ROLE_LABELS: Record<string,string> = {
  student:'Học sinh', teacher:'Giáo viên', peer:'Phản biện', researcher:'Nghiên cứu viên', admin:'Quản trị viên', ai:'AI'
};

const getHomeView = (role: string) => {
  if (role === 'teacher') return 'teacher-dashboard';
  if (role === 'researcher') return 'researcher-view';
  if (role === 'admin') return 'admin-view';
  if (role === 'ai') return 'ai-workspace';
  return 'dashboard';
};

const emptyProfile = (): UserProfile => ({
  phone:'', dateOfBirth:'', school:'', schoolYear:'', grade:'', studentCode:'', staffCode:'', department:'',
  bio:'', learningGoal:'', favoriteGenres:[], favoriteAuthors:[], favoriteWorks:[]
});

const Field: React.FC<{label:string;value:string;onChange:(value:string)=>void;type?:string;placeholder?:string;readOnly?:boolean}> = ({label,value,onChange,type='text',placeholder,readOnly}) => (
  <label className="block space-y-1">
    <span className="text-[11px] font-semibold text-slate-600">{label}</span>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${readOnly?'border-slate-200 bg-slate-50 text-slate-500':'border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}/>
  </label>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNavigate,
  currentView,
  onOpenCommandPalette,
  onOpenMobileDrawer,
  onLogout
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const { addToast } = useNotificationStore();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileSaving,setProfileSaving]=useState(false);
  const [profileName,setProfileName]=useState(currentUser.name || '');
  const [profileDraft,setProfileDraft]=useState<UserProfile>({...emptyProfile(),...(currentUser.profile||{})});

  const openProfile=()=>{
    setProfileName(currentUser.name || '');
    setProfileDraft({...emptyProfile(),...(currentUser.profile||{})});
    setIsProfileModalOpen(true);
  };
  const setProfile=(key:keyof UserProfile,value:any)=>setProfileDraft(previous=>({...previous,[key]:value}));
  const csv=(value?:string[])=>Array.isArray(value)?value.join(', '):'';

  const saveProfile=async()=>{
    setProfileSaving(true);
    try{
      const response=await fetch('/api/auth/me',{
        method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',
        body:JSON.stringify({name:profileName,profile:{
          ...profileDraft,
          favoriteGenres:String(profileDraft.favoriteGenres||'').split(',').map(v=>v.trim()).filter(Boolean),
          favoriteAuthors:String(profileDraft.favoriteAuthors||'').split(',').map(v=>v.trim()).filter(Boolean),
          favoriteWorks:String(profileDraft.favoriteWorks||'').split(',').map(v=>v.trim()).filter(Boolean)
        }})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data?.user)throw new Error(data?.message||'Không thể lưu hồ sơ');
      setAuthenticatedUser(data.user);
      setIsProfileModalOpen(false);
      addToast({type:'success',title:'Đã cập nhật hồ sơ',message:'Thông tin cá nhân đã được lưu vào tài khoản của bạn.'});
    }catch(error:any){
      addToast({type:'error',title:'Không thể cập nhật hồ sơ',message:error?.message||'Vui lòng thử lại.'});
    }finally{setProfileSaving(false);}
  };

  const lastLogin=currentUser.lastLogin?new Date(currentUser.lastLogin).toLocaleString('vi-VN'):'Chưa ghi nhận';

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto h-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onOpenMobileDrawer} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden" aria-label="Mở menu">
              <Bars3Icon className="h-5 w-5" />
            </button>
            <button type="button" className="flex shrink-0 items-center gap-2 text-left" onClick={() => onNavigate(getHomeView(currentUser.role))}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs"><BookOpenIcon className="h-4 w-4" /></span>
              <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:inline">Học tốt Ngữ Văn</span>
            </button>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="max-w-[140px] truncate text-xs font-semibold text-slate-700 sm:max-w-xs">{VIEW_TITLES[currentView] || 'Học tốt Ngữ Văn'}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onOpenCommandPalette} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100" title="Tìm kiếm & phím tắt nhanh (Ctrl+K)">
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" /><span className="hidden md:inline">Tìm nhanh...</span><kbd className="hidden rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400 md:inline">Ctrl K</kbd>
            </button>
            <button type="button" onClick={() => addToast({ type: 'info', title: 'Thông báo', message: 'Hiện chưa có thông báo mới.' })} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Thông báo"><BellIcon className="h-4 w-4" /></button>
            <button type="button" onClick={() => setIsHelpModalOpen(true)} className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:block" title="Trợ giúp & hướng dẫn sử dụng"><QuestionMarkCircleIcon className="h-4 w-4" /></button>
            <Dropdown trigger={<div className="flex cursor-pointer items-center gap-2 pl-1"><Avatar name={currentUser.name || 'Người dùng'} size="sm" /></div>}
              items={[{key:'profile',label:'Thông tin cá nhân',icon:<UserCircleIcon className="h-4 w-4" />,onClick:openProfile},{key:'logout',label:'Đăng xuất',icon:<ArrowRightOnRectangleIcon className="h-4 w-4" />,danger:true,onClick:onLogout}]}/>
          </div>
        </div>
      </div>

      <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Hướng Dẫn Sử Dụng & Phím Tắt" description="Quy trình học Ngữ văn theo 6 trục thi pháp" footer={<Button variant="primary" onClick={() => setIsHelpModalOpen(false)}>Đã hiểu</Button>}>
        <div className="space-y-4 text-xs text-slate-700">
          <div className="space-y-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3"><span className="block font-bold text-indigo-950">Quy trình:</span><p className="leading-relaxed">1. Nhận nhiệm vụ ➔ 2. Viết theo 6 trục ➔ 3. Nộp V1 ➔ 4. Nhận phản hồi AI/giáo viên ➔ 5. Chỉnh sửa V2 ➔ 6. So sánh phiên bản & theo dõi tiến bộ.</p></div>
          <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2"><div className="rounded border border-slate-200 bg-slate-50 p-2"><kbd className="font-mono font-bold">Ctrl + K</kbd>: Mở tìm nhanh</div><div className="rounded border border-slate-200 bg-slate-50 p-2"><kbd className="font-mono font-bold">ESC</kbd>: Đóng cửa sổ</div></div>
        </div>
      </Modal>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Thông tin cá nhân" description="Thông tin học tập và sở thích giúp Học tốt Ngữ Văn cá nhân hóa trải nghiệm"
        footer={<div className="flex gap-2"><Button variant="outline" onClick={()=>setIsProfileModalOpen(false)}>Hủy</Button><Button variant="primary" isLoading={profileSaving} onClick={saveProfile}>Lưu thay đổi</Button></div>}>
        <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1 text-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Avatar name={currentUser.name || 'Người dùng'} size="lg" />
            <div className="min-w-0"><div className="truncate text-base font-bold text-slate-900">{currentUser.name}</div><div className="truncate text-slate-500">{currentUser.email}</div><div className="mt-1 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{ROLE_LABELS[currentUser.role]||currentUser.role}</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700"><CheckCircleIcon className="h-3.5 w-3.5"/> Hoạt động</span></div></div>
          </div>

          <section className="space-y-3"><h3 className="font-bold text-slate-900">Thông tin cơ bản</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Họ và tên" value={profileName} onChange={setProfileName} placeholder="Họ và tên đầy đủ"/>
            <Field label="Email đăng nhập" value={currentUser.email} onChange={()=>{}} readOnly/>
            <Field label="Số điện thoại (không bắt buộc)" value={profileDraft.phone||''} onChange={v=>setProfile('phone',v)} placeholder="09xxxxxxxx"/>
            <Field label="Ngày sinh (không bắt buộc)" type="date" value={profileDraft.dateOfBirth||''} onChange={v=>setProfile('dateOfBirth',v)}/>
            <Field label="Trường / đơn vị" value={profileDraft.school||''} onChange={v=>setProfile('school',v)} placeholder="Tên trường"/>
            <Field label="Năm học" value={profileDraft.schoolYear||''} onChange={v=>setProfile('schoolYear',v)} placeholder="2026-2027"/>
            <Field label="Lớp được hệ thống gán" value={currentUser.className||'Chưa gán lớp'} onChange={()=>{}} readOnly/>
            <Field label="Khối / cấp học" value={profileDraft.grade||''} onChange={v=>setProfile('grade',v)} placeholder="Khối 11"/>
            {currentUser.role==='student'?<Field label="Mã học sinh" value={profileDraft.studentCode||''} onChange={v=>setProfile('studentCode',v)} placeholder="Mã học sinh"/>:<Field label="Mã cán bộ / giáo viên" value={profileDraft.staffCode||''} onChange={v=>setProfile('staffCode',v)} placeholder="Mã cán bộ"/>}
            <Field label="Tổ / bộ môn / đơn vị" value={profileDraft.department||''} onChange={v=>setProfile('department',v)} placeholder="Tổ Ngữ văn"/>
          </div></section>

          <section className="space-y-3"><h3 className="font-bold text-slate-900">Mục tiêu học tập</h3>
            <label className="block space-y-1"><span className="text-[11px] font-semibold text-slate-600">Mục tiêu với môn Ngữ văn</span><textarea rows={3} value={profileDraft.learningGoal||''} onChange={e=>setProfile('learningGoal',e.target.value)} placeholder="Ví dụ: cải thiện kỹ năng phân tích dẫn chứng và lập luận..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label>
            <label className="block space-y-1"><span className="text-[11px] font-semibold text-slate-600">Giới thiệu ngắn</span><textarea rows={3} value={profileDraft.bio||''} onChange={e=>setProfile('bio',e.target.value)} placeholder="Một vài điều về bản thân và cách bạn thích học..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label>
          </section>

          <section className="space-y-3"><h3 className="font-bold text-slate-900">Sở thích đọc</h3><div className="grid grid-cols-1 gap-3">
            <Field label="Thể loại yêu thích" value={csv(profileDraft.favoriteGenres)} onChange={v=>setProfile('favoriteGenres',v as any)} placeholder="Truyện ngắn, thơ, nghị luận..."/>
            <Field label="Tác giả yêu thích" value={csv(profileDraft.favoriteAuthors)} onChange={v=>setProfile('favoriteAuthors',v as any)} placeholder="Nam Cao, Nguyễn Minh Châu..."/>
            <Field label="Tác phẩm yêu thích" value={csv(profileDraft.favoriteWorks)} onChange={v=>setProfile('favoriteWorks',v as any)} placeholder="Vợ nhặt, Chí Phèo..."/>
          </div><p className="text-[11px] text-slate-400">Có thể nhập nhiều mục, ngăn cách bằng dấu phẩy.</p></section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600"><div><strong>Mã định danh:</strong> {currentUser.id}</div><div><strong>Lần đăng nhập gần nhất:</strong> {lastLogin}</div><div><strong>Trạng thái tài khoản:</strong> {currentUser.accountStatus==='locked'?'Đã khóa':'Hoạt động'}</div></section>
        </div>
      </Modal>
    </header>
  );
};
