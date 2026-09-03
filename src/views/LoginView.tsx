import React, { useState } from 'react';
import { Button, Input, Alert } from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import { BookOpenIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export const LoginView: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { setAuthenticatedUser } = useAuthStore();
  const [mode,setMode] = useState<'login'|'register'>('login');
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [mustChange,setMustChange]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const acceptUser=(user:any)=>setAuthenticatedUser({
    id:user.id,
    name:user.name,
    email:user.email,
    role:user.role,
    mustChangePassword:Boolean(user.mustChangePassword),
    accountStatus:user.accountStatus,
    lastLogin:user.lastLogin || null,
    className:user.className || '',
    profile:user.profile || {}
  });

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res=await fetch(mode==='login'?'/api/auth/login':'/api/auth/register',{
        method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',
        body:JSON.stringify(mode==='login'?{email,password}:{email,name,password})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||'Không thể xác thực tài khoản');
      acceptUser(data.user);
      if(data.user?.mustChangePassword){ setMustChange(true); return; }
      onLoginSuccess();
    } catch(err:any){ setError(err.message||'Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  const rotatePassword=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res=await fetch('/api/auth/change-password',{
        method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',
        body:JSON.stringify({newPassword})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||'Không thể đổi mật khẩu');
      acceptUser(data.user); onLoginSuccess();
    } catch(err:any){ setError(err.message||'Không thể đổi mật khẩu'); }
    finally { setLoading(false); }
  };

  return <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-center py-6 sm:py-12 px-4">
    <div className="mx-auto w-full max-w-md text-center space-y-3">
      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto"><BookOpenIcon className="w-6 h-6"/></div>
      <h1 className="text-xl font-bold text-slate-900">Học tốt Ngữ Văn</h1>
      <p className="text-sm text-slate-500">{mustChange?'Thiết lập mật khẩu riêng trước khi tiếp tục':'Đăng nhập để học, viết, nhận phản hồi và theo dõi tiến bộ môn Ngữ văn'}</p>
    </div>
    <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md"><div className="bg-white py-6 px-4 border border-slate-200 rounded-lg sm:py-8 sm:px-8 shadow-sm">
      {error&&<Alert type="error" title={mustChange?'Đổi mật khẩu không thành công':mode==='login'?'Đăng nhập không thành công':'Đăng ký không thành công'}>{error}</Alert>}
      {mustChange ? <form onSubmit={rotatePassword} className="space-y-4" autoComplete="off">
        {/* Anti-autofill trap for aggressive browser heuristics */}
        <input type="text" name="b_trap_username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
        <input type="password" name="b_trap_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
        <Alert type="info" title="Bảo mật tài khoản">Tài khoản cấp sẵn cần đổi mật khẩu trước lần sử dụng chính thức.</Alert>
        <Input label="Mật khẩu mới" type="password" required minLength={10} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Ít nhất 10 ký tự" leftIcon={<LockClosedIcon className="w-4 h-4 text-slate-400"/>} name="new_password" autoComplete="new-password" data-lpignore="true"/>
        <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full bg-slate-900 hover:bg-slate-800">Đổi mật khẩu & tiếp tục</Button>
      </form> : <>
        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          {/* Anti-autofill trap for aggressive browser heuristics */}
          <input type="text" name="b_trap_username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
          <input type="password" name="b_trap_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
          {mode==='register'&&<Input label="Họ và tên" required value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn An" leftIcon={<UserIcon className="w-4 h-4 text-slate-400"/>} name="student_name" autoComplete="one-time-code" data-lpignore="true" spellCheck={false}/>}
          <Input label="Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@thpt.edu.vn" leftIcon={<UserIcon className="w-4 h-4 text-slate-400"/>} name="user_email" autoComplete="one-time-code" data-lpignore="true" spellCheck={false}/>
          <Input label="Mật khẩu" type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" leftIcon={<LockClosedIcon className="w-4 h-4 text-slate-400"/>} name="user_password" autoComplete="new-password" data-lpignore="true"/>
          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full bg-slate-900 hover:bg-slate-800">{mode==='login'?'Đăng nhập':'Tạo tài khoản học sinh'}</Button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button type="button" className="font-semibold text-indigo-700 hover:underline" onClick={()=>{setMode(mode==='login'?'register':'login');setError(null)}}>{mode==='login'?'Đăng ký':'Đăng nhập'}</button></div>
      </>}
    </div><p className="text-center text-xs text-slate-400 mt-6">Học tốt Ngữ Văn • Hệ thống học tập và phát triển năng lực đọc hiểu</p></div>
  </div>;
};
