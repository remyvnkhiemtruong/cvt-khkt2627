import { body, login, send } from "./auth.js";
export default async function handler(req:any,res:any) {
  if (req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try { const {email,password}=body(req); if(!email||!password) return send(res,400,{code:"VALIDATION_ERROR",message:"Email và mật khẩu là bắt buộc."});
    const result=await login(String(email),String(password)); if(!result) return send(res,401,{code:"INVALID_CREDENTIALS",message:"Email hoặc mật khẩu không đúng."});
    return send(res,200,result,result.token);
  } catch(e:any) { return send(res,500,{code:"AUTH_CONFIG_ERROR",message:e?.message||"Auth unavailable"}); }
}
