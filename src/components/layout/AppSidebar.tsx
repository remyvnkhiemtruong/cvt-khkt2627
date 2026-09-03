import React from 'react';
import { useAuthStore } from '../../app/store/useAuthStore';
import { AcademicCapIcon, BookOpenIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentCheckIcon, FolderIcon, HomeIcon, PlusCircleIcon, ShieldCheckIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Tooltip } from '../ui/Tooltip';

interface AppSidebarProps { currentView:string;onNavigate:(view:string,params?:any)=>void;isCollapsed?:boolean;onToggleCollapse?:()=>void;className?:string; }
type NavItem={id:string;label:string;icon:React.ElementType;params?:any};

export const AppSidebar:React.FC<AppSidebarProps>=({currentView,onNavigate,isCollapsed=false,onToggleCollapse,className})=>{
  const user=useAuthStore(s=>s.currentUser);
  const items:NavItem[]=user.role==='student'?
    [{id:'dashboard',label:'Tổng quan',icon:HomeIcon},{id:'assignment-list',label:'Nhiệm vụ',icon:BookOpenIcon},{id:'portfolio-list',label:'Hồ sơ học tập',icon:FolderIcon}]:
  user.role==='teacher'?
    [{id:'teacher-dashboard',label:'Tổng quan giáo viên',icon:HomeIcon},{id:'class-analytics',label:'Lớp & Heatmap',icon:UserGroupIcon},{id:'portfolio-list',label:'Hồ sơ học sinh',icon:FolderIcon},{id:'teacher-review',label:'Chấm & nhận xét',icon:ClipboardDocumentCheckIcon},{id:'ai-workspace',label:'Duyệt phản hồi AI',icon:SparklesIcon},{id:'assignment-builder',label:'Tạo nhiệm vụ',icon:PlusCircleIcon},{id:'rubric-management',label:'Rubric',icon:AcademicCapIcon},{id:'literature-texts',label:'Kho tác phẩm',icon:BookOpenIcon}]:
  user.role==='admin'?
    [{id:'admin-view',label:'Quản trị',icon:ShieldCheckIcon},{id:'teacher-dashboard',label:'Dữ liệu giảng dạy',icon:HomeIcon},{id:'ai-workspace',label:'AI Review Queue',icon:SparklesIcon},{id:'class-analytics',label:'Analytics',icon:ChartBarIcon},{id:'researcher-view',label:'Nghiên cứu',icon:AcademicCapIcon}]:
  user.role==='researcher'?
    [{id:'researcher-view',label:'Nghiên cứu',icon:AcademicCapIcon},{id:'portfolio-list',label:'Hồ sơ',icon:FolderIcon},{id:'class-analytics',label:'Analytics',icon:ChartBarIcon}]:
  user.role==='ai'?[{id:'ai-workspace',label:'AI Review Queue',icon:SparklesIcon}]:
  [{id:'portfolio-list',label:'Hồ sơ phản biện',icon:FolderIcon},{id:'teacher-review',label:'Đánh giá bạn học',icon:SparklesIcon}];

  return <aside className={cn('hidden min-h-[calc(100vh-3.5rem)] shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-3 transition-all md:flex',isCollapsed?'w-16':'w-64',className)}>
    <div><div className="mb-4 flex items-center justify-between border-b px-2 pb-2">{!isCollapsed&&<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{user.role}</span>}{onToggleCollapse&&<button onClick={onToggleCollapse} className="mx-auto rounded-md p-1 text-slate-400 hover:bg-slate-100">{isCollapsed?<ChevronRightIcon className="h-4 w-4"/>:<ChevronLeftIcon className="h-4 w-4"/>}</button>}</div><nav className="space-y-1">{items.map(item=>{const active=currentView===item.id,Icon=item.icon;const button=<button type="button" onClick={()=>onNavigate(item.id,item.params)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition',active?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100',isCollapsed&&'justify-center px-2')}><Icon className="h-4 w-4 shrink-0"/>{!isCollapsed&&<span className="truncate">{item.label}</span>}</button>;return isCollapsed?<Tooltip key={item.id} content={item.label} position="right">{button}</Tooltip>:<React.Fragment key={item.id}>{button}</React.Fragment>;})}</nav></div>
    {!isCollapsed&&<div className="rounded-xl border bg-slate-50 p-3 text-[10px] leading-5 text-slate-500"><b className="block text-xs text-slate-800">Học tốt Ngữ Văn</b>Dữ liệu học tập từ PostgreSQL • Version bất biến • AI review có giáo viên duyệt.</div>}
  </aside>;
};
