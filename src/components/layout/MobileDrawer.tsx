import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { AcademicCapIcon, ArrowRightOnRectangleIcon, BookOpenIcon, ChartBarIcon, ClipboardDocumentCheckIcon, FolderIcon, HomeIcon, PlusCircleIcon, ShieldCheckIcon, SparklesIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';

interface MobileDrawerProps { isOpen:boolean;onClose:()=>void;currentView:string;onNavigate:(view:string,params?:any)=>void;onLogout?:()=>void; }
type Nav={id:string;label:string;icon:React.ElementType;params?:any};

export const MobileDrawer:React.FC<MobileDrawerProps>=({isOpen,onClose,currentView,onNavigate,onLogout})=>{
  const user=useAuthStore(s=>s.currentUser);if(!isOpen)return null;
  const items:Nav[]=user.role==='student'?[{id:'dashboard',label:'Trang chủ',icon:HomeIcon},{id:'assignment-list',label:'Nhiệm vụ',icon:BookOpenIcon},{id:'portfolio-list',label:'Hồ sơ học tập',icon:FolderIcon}]:
  user.role==='teacher'?[{id:'teacher-dashboard',label:'Tổng quan',icon:HomeIcon},{id:'class-analytics',label:'Lớp & Heatmap',icon:UserGroupIcon},{id:'portfolio-list',label:'Hồ sơ học sinh',icon:FolderIcon},{id:'teacher-review',label:'Chấm bài',icon:ClipboardDocumentCheckIcon},{id:'ai-workspace',label:'Duyệt AI',icon:SparklesIcon},{id:'assignment-builder',label:'Tạo nhiệm vụ',icon:PlusCircleIcon},{id:'rubric-management',label:'Rubric',icon:AcademicCapIcon},{id:'literature-texts',label:'Kho tác phẩm',icon:BookOpenIcon}]:
  user.role==='admin'?[{id:'admin-view',label:'Quản trị',icon:ShieldCheckIcon},{id:'teacher-dashboard',label:'Giảng dạy',icon:HomeIcon},{id:'ai-workspace',label:'AI Review Queue',icon:SparklesIcon},{id:'class-analytics',label:'Analytics',icon:ChartBarIcon},{id:'researcher-view',label:'Nghiên cứu',icon:AcademicCapIcon}]:
  user.role==='ai'?[{id:'ai-workspace',label:'AI Review Queue',icon:SparklesIcon}]:
  user.role==='researcher'?[{id:'researcher-view',label:'Nghiên cứu',icon:AcademicCapIcon},{id:'portfolio-list',label:'Hồ sơ',icon:FolderIcon},{id:'class-analytics',label:'Analytics',icon:ChartBarIcon}]:[{id:'portfolio-list',label:'Hồ sơ phản biện',icon:FolderIcon},{id:'teacher-review',label:'Đánh giá',icon:SparklesIcon}];
  const go=(item:Nav)=>{onNavigate(item.id,item.params);onClose();};
  return <div className="fixed inset-0 z-50 overflow-hidden md:hidden"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose}/><div className="fixed inset-y-0 left-0 flex max-w-full"><div className="flex w-72 flex-col justify-between bg-white p-4 shadow-xl"><div><div className="mb-4 flex items-center justify-between border-b pb-3"><div className="flex min-w-0 items-center gap-2"><Avatar name={user.name} size="md"/><div className="min-w-0"><div className="truncate text-xs font-bold">{user.name}</div><div className="text-[10px] font-semibold uppercase text-slate-500">{user.role}</div></div></div><button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><XMarkIcon className="h-5 w-5"/></button></div><nav className="space-y-1">{items.map(item=>{const Icon=item.icon;return <button key={`${item.id}-${item.label}`} onClick={()=>go(item)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold',currentView===item.id?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-100')}><Icon className="h-4 w-4"/><span>{item.label}</span></button>;})}</nav></div>{onLogout&&<button onClick={()=>{onClose();onLogout();}} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><ArrowRightOnRectangleIcon className="h-4 w-4"/>Đăng xuất</button>}</div></div></div>;
};
