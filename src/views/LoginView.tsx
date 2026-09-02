import React, { useState } from 'react';
import { Button, Input, Alert } from '../components/ui';
import { useAuthStore } from '../app/store/useAuthStore';
import { BookOpenIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export const LoginView: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { setAuthenticatedUser } = useAuthStore();
  const [mode,setMode] = useState<'login'|'register'>('login');
  const [email,setEmail]=useState(''); const [name,setName]=useState(''); const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); setLoading(true); setError(null);
    try { const res=await fetch(mode==='login'?'/api/auth/login':'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(mode==='login'?{email,password}:{email,name,password})});
      const data=await res.json(); if(!res.ok) throw new Error(data.message||'Không thể xác thực tài khoản');
      localStorage.setItem('cvt_auth_token',data.token); setAuthenticatedUser({id:data.user.id,name:data.user.name,email:data.user.email,role:data.user.role}); onLoginSuccess();
    } catch(err:any){ setError(err.message||'Lỗi kết nối máy chủ'); } finally { setLoading(false); }
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4">
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3"><div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto"><BookOpenIcon className="w-7 h-7"/></div><h1 className="text-2xl font-bold text-slate-900">Hồ Sơ Đọc Số THPT</h1><p className="text-sm text-slate-500">Đăng nhập để tiếp tục vào không gian học tập</p></div>
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"><div className="bg-white py-8 px-6 shadow-card border border-slate-200 rounded-3xl sm:px-10">
      {error&&<Alert type="error" title={mode==='login'?'Đăng nhập không thành công':'Đăng ký không thành công'}>{error}</Alert>}
      <form onSubmit={submit} className="space-y-4">{mode==='register'&&<Input label="Họ và tên" required value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn An" leftIcon={<UserIcon className="w-4 h-4 text-slate-400"/>}/>}
        <Input label="Email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@thpt.edu.vn" leftIcon={<UserIcon className="w-4 h-4 text-slate-400"/>}/>
        <Input label="Mật khẩu" type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" leftIcon={<LockClosedIcon className="w-4 h-4 text-slate-400"/>}/>
        <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full bg-slate-900 hover:bg-slate-800">{mode==='login'?'Đăng nhập':'Tạo tài khoản học sinh'}</Button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-500">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button type="button" className="font-semibold text-indigo-700 hover:underline" onClick={()=>{setMode(mode==='login'?'register':'login');setError(null)}}>{mode==='login'?'Đăng ký':'Đăng nhập'}</button></div>
    </div><p className="text-center text-xs text-slate-400 mt-6">Tài khoản giáo viên và quản trị viên được cấp bởi nhà trường.</p></div>
  </div>;
};
