import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, BookOpenIcon, ChatBubbleLeftRightIcon, ChartBarIcon, HomeIcon, DocumentTextIcon, SparklesIcon, XMarkIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../app/store/useAuthStore';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface CommandPaletteProps { isOpen:boolean;onClose:()=>void;onNavigate:(view:string,params?:any)=>void; }
interface CommandItem { id:string;category:string;title:string;subtitle?:string;icon:React.ElementType;action:()=>void;roles?:string[]; }

export const CommandPalette:React.FC<CommandPaletteProps>=({isOpen,onClose,onNavigate})=>{
  const currentUser=useAuthStore(state=>state.currentUser);
  const {assignments,literatureTexts}=usePortfolio();
  const [query,setQuery]=useState('');
  const [selectedIndex,setSelectedIndex]=useState(0);

  const homeView=currentUser.role==='teacher'?'teacher-dashboard':currentUser.role==='admin'?'admin-view':currentUser.role==='researcher'?'researcher-view':currentUser.role==='ai'?'ai-workspace':'dashboard';

  const commands=useMemo<CommandItem[]>(()=>{
    const base:CommandItem[]=[
      {id:'cmd-home',category:'Điều hướng',title:'Đi đến trang tổng quan',subtitle:'Mở không gian chính theo vai trò',icon:HomeIcon,action:()=>onNavigate(homeView)},
      {id:'cmd-assignments',category:'Học tập',title:'Xem danh sách nhiệm vụ',subtitle:'Chọn một nhiệm vụ đang được phân công',icon:BookOpenIcon,action:()=>onNavigate('assignment-list'),roles:['student','teacher','peer','researcher','admin']},
      {id:'cmd-portfolios',category:'Hồ sơ',title:'Mở danh sách hồ sơ học tập',subtitle:'Xem các hồ sơ và phiên bản thực tế',icon:FolderIcon,action:()=>onNavigate('portfolio-list'),roles:['student','teacher','peer','researcher','admin']},
      {id:'cmd-feedback',category:'Phản hồi',title:currentUser.role==='student'?'Xem phản hồi cần xử lý':'Mở hàng đợi chấm và phản hồi',subtitle:'Đi đến luồng feedback phù hợp với vai trò',icon:ChatBubbleLeftRightIcon,action:()=>onNavigate(currentUser.role==='student'?'assignment-list':'teacher-review'),roles:['student','teacher','peer','admin']},
      {id:'cmd-analytics',category:'Phân tích',title:'Xem phân tích năng lực',subtitle:'Dữ liệu rubric và tiến bộ thực tế',icon:ChartBarIcon,action:()=>onNavigate(currentUser.role==='teacher'||currentUser.role==='researcher'||currentUser.role==='admin'?'class-analytics':'dashboard'),roles:['student','teacher','researcher','admin']},
      {id:'cmd-ai',category:'AI',title:'Mở hàng đợi phản hồi AI',subtitle:'Nhập hoặc duyệt phản hồi AI theo phiên bản',icon:SparklesIcon,action:()=>onNavigate('ai-workspace'),roles:['ai','teacher','admin']}
    ];

    if(currentUser.role==='student'){
      assignments.forEach(assignment=>{
        const text=literatureTexts.find(item=>item.id===assignment.textId);
        base.push({id:`assignment-${assignment.id}`,category:'Nhiệm vụ của tôi',title:`Viết: ${assignment.title}`,subtitle:text?`${text.title} — ${text.author}`:'Mở không gian viết',icon:DocumentTextIcon,action:()=>onNavigate('editor',{assignmentId:assignment.id}),roles:['student']});
      });
    }
    literatureTexts.forEach(text=>base.push({id:`text-${text.id}`,category:'Kho tác phẩm',title:`${text.title} — ${text.author}`,subtitle:`${text.year||'Không rõ năm'} • ${text.genre||'Văn học'}`,icon:BookOpenIcon,action:()=>onNavigate('literature-texts'),roles:['student','teacher','researcher','admin']}));
    return base;
  },[assignments,literatureTexts,currentUser.role,homeView,onNavigate]);

  const filteredCommands=useMemo(()=>commands.filter(command=>{
    if(command.roles&&!command.roles.includes(currentUser.role))return false;
    if(!query.trim())return true;
    const q=query.toLowerCase().trim();
    return command.title.toLowerCase().includes(q)||command.category.toLowerCase().includes(q)||Boolean(command.subtitle?.toLowerCase().includes(q));
  }),[commands,currentUser.role,query]);

  useEffect(()=>{if(selectedIndex>=filteredCommands.length)setSelectedIndex(0);},[filteredCommands.length,selectedIndex]);
  useEffect(()=>{
    const handleKeyDown=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(isOpen)onClose();return;}
      if(!isOpen)return;
      if(event.key==='Escape'){event.preventDefault();onClose();return;}
      if(event.key==='ArrowDown'){event.preventDefault();setSelectedIndex(index=>filteredCommands.length?(index+1)%filteredCommands.length:0);return;}
      if(event.key==='ArrowUp'){event.preventDefault();setSelectedIndex(index=>filteredCommands.length?(index-1+filteredCommands.length)%filteredCommands.length:0);return;}
      if(event.key==='Enter'&&filteredCommands[selectedIndex]){event.preventDefault();filteredCommands[selectedIndex].action();onClose();setQuery('');}
    };
    window.addEventListener('keydown',handleKeyDown);return()=>window.removeEventListener('keydown',handleKeyDown);
  },[isOpen,onClose,filteredCommands,selectedIndex]);

  const select=(command:CommandItem)=>{command.action();onClose();setQuery('');setSelectedIndex(0);};
  if(!isOpen)return null;

  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-4 pt-20 backdrop-blur-xs">
    <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-modal">
      <div className="relative flex items-center border-b border-slate-100 px-4 py-3.5"><MagnifyingGlassIcon className="mr-3 h-5 w-5 shrink-0 text-slate-400"/><input autoFocus value={query} onChange={event=>{setQuery(event.target.value);setSelectedIndex(0);}} placeholder="Tìm nhiệm vụ, tác phẩm, phân hệ..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true" data-form-type="other" className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-sm"/><button onClick={onClose} className="ml-2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-4 w-4"/></button></div>
      <div className="max-h-80 space-y-1 overflow-y-auto p-2">{filteredCommands.length===0?<div className="py-8 text-center text-xs text-slate-400">Không tìm thấy kết quả phù hợp với “{query}”.</div>:filteredCommands.map((command,index)=>{const Icon=command.icon,isSelected=index===selectedIndex;return <button type="button" key={command.id} onClick={()=>select(command)} onMouseEnter={()=>setSelectedIndex(index)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${isSelected?'bg-indigo-50 font-semibold text-indigo-950':'text-slate-700 hover:bg-slate-50'}`}><div className="flex min-w-0 items-center gap-3"><div className={`shrink-0 rounded-lg p-1.5 ${isSelected?'bg-indigo-600 text-white':'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4"/></div><div className="min-w-0"><div className="truncate">{command.title}</div>{command.subtitle&&<p className="truncate text-[11px] font-normal text-slate-400">{command.subtitle}</p>}</div></div><span className="ml-2 shrink-0 text-[10px] uppercase tracking-wider text-slate-400">{command.category}</span></button>;})}</div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400"><span>↑ ↓ chọn • Enter mở</span><span>Esc đóng</span></div>
    </div>
  </div>;
};
