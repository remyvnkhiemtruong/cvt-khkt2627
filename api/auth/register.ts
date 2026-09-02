import { body, register, send } from "../_lib/auth.ts";
export default async function handler(req:any,res:any) {
  if (req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try { const {email,name,password}=body(req); if(!email||!name||!password||String(password).length<8) return send(res,400,{code:"VALIDATION_ERROR",message:"Cần email, họ tên và mật khẩu tối thiểu 8 ký tự."});
    const result=await register(String(email),String(name),String(password)); return send(res,201,result,result.token);
  } catch(e:any) { if(String(e?.code)==="23505") return send(res,409,{code:"EMAIL_EXISTS",message:"Email đã được đăng ký."}); return send(res,500,{code:"AUTH_CONFIG_ERROR",message:e?.message||"Auth unavailable"}); }
}
