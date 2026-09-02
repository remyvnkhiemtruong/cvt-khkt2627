import { randomBytes } from 'node:crypto';
import { assertSameOrigin, body, getUser, send, setTemporaryPassword } from '../auth/auth.js';
import { ensureAcademicSchema } from '../_lib/academic.js';

let poolPromise:any;
async function db(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if(!poolPromise) poolPromise=import('pg').then(({Pool})=>new Pool({connectionString:process.env.DATABASE_URL,max:3,ssl:{rejectUnauthorized:false}}));
  return poolPromise;
}
const allowedRoles=['student','teacher','peer','researcher','admin','ai'];
const allowedStatus=['active','locked'];
async function audit(p:any,user:any,action:string,targetId:string,before:any,after:any,req:any){
  const ip=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();
  await p.query(`INSERT INTO audit_logs(actor_id,actor_role,action,target_type,target_id,before_json,after_json,ip_address)
    VALUES($1,$2,$3,'user',$4,$5,$6,$7)`,[user.id,user.role,action,targetId,before,after,ip]);
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST') return send(res,405,{code:'METHOD_NOT_ALLOWED'});
  try{
    assertSameOrigin(req);
    const user=getUser(req); if(!user) return send(res,401,{code:'UNAUTHENTICATED'});
    if(user.role!=='admin') return send(res,403,{code:'FORBIDDEN'});
    await ensureAcademicSchema(); const p=await db(); const input=body(req); const action=String(input.action||'');

    if(action==='update_user'){
      const targetId=String(input.userId||'');
      const beforeResult=await p.query(`SELECT id,email,name,role,account_status,must_change_password FROM app_users WHERE id=$1`,[targetId]);
      const before=beforeResult.rows[0]; if(!before) return send(res,404,{code:'USER_NOT_FOUND'});
      const role=String(input.role||before.role),status=String(input.accountStatus||before.account_status);
      if(!allowedRoles.includes(role)||!allowedStatus.includes(status)) return send(res,400,{code:'INVALID_USER_STATE'});
      if(targetId===user.id && (role!=='admin'||status!=='active')) return send(res,400,{code:'SELF_LOCKOUT_BLOCKED',message:'Không thể tự hạ quyền hoặc khóa tài khoản admin đang dùng.'});
      const result=await p.query(`UPDATE app_users SET role=$2,account_status=$3,updated_at=now() WHERE id=$1 RETURNING id,email,name,role,account_status,must_change_password,created_at,last_login`,[targetId,role,status]);
      await audit(p,user,'ADMIN_UPDATE_USER',targetId,before,result.rows[0],req);
      return send(res,200,{user:result.rows[0]});
    }

    if(action==='reset_password'){
      const targetId=String(input.userId||'');
      const beforeResult=await p.query(`SELECT id,email,name,role,account_status,must_change_password FROM app_users WHERE id=$1`,[targetId]);
      if(!beforeResult.rows[0]) return send(res,404,{code:'USER_NOT_FOUND'});
      const temp=`CVT-${randomBytes(8).toString('base64url')}!9`;
      if(!await setTemporaryPassword(targetId,temp)) return send(res,404,{code:'USER_NOT_FOUND'});
      await audit(p,user,'ADMIN_RESET_PASSWORD',targetId,beforeResult.rows[0],{must_change_password:true},req);
      return send(res,200,{temporaryPassword:temp,message:'Mật khẩu tạm chỉ hiển thị một lần. Người dùng phải đổi khi đăng nhập.'});
    }

    if(action==='create_class'){
      const code=String(input.code||'').trim().toUpperCase().slice(0,30),name=String(input.name||'').trim().slice(0,120),schoolYear=String(input.schoolYear||'2026-2027').trim().slice(0,20);
      if(!code||!name) return send(res,400,{code:'VALIDATION_ERROR'});
      const result=await p.query(`INSERT INTO classes(code,name,school_year,created_by) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,school_year=EXCLUDED.school_year,updated_at=now() RETURNING *`,[code,name,schoolYear,user.id]);
      return send(res,200,{class:result.rows[0]});
    }

    if(action==='assign_member'){
      const classCode=String(input.classCode||'').trim().toUpperCase(),targetId=String(input.userId||'');
      const memberRole=String(input.memberRole||'student'); if(!['student','teacher'].includes(memberRole)) return send(res,400,{code:'INVALID_MEMBER_ROLE'});
      const result=await p.query(`INSERT INTO class_members(class_id,user_id,member_role) SELECT c.id,$2,$3 FROM classes c WHERE c.code=$1 ON CONFLICT(class_id,user_id) DO UPDATE SET member_role=EXCLUDED.member_role RETURNING *`,[classCode,targetId,memberRole]);
      if(!result.rows[0]) return send(res,404,{code:'CLASS_NOT_FOUND'});
      return send(res,200,{ok:true});
    }

    return send(res,400,{code:'UNKNOWN_ACTION'});
  }catch(error:any){
    const code=String(error?.message||'ADMIN_ACTION_ERROR');
    return send(res,code==='CSRF_ORIGIN_MISMATCH'?403:500,{code,message:code});
  }
}
