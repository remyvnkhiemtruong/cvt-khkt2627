import { assertSameOrigin, body, checkRateLimit, register, requestIp, send } from "./auth.js";
export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const {email,name,password}=body(req);
    if(!email||!name||!password||String(password).length<8) return send(res,400,{code:"VALIDATION_ERROR",message:"Cần email, họ tên và mật khẩu tối thiểu 8 ký tự."});
    if(!await checkRateLimit(`register:${requestIp(req)}`,5,3600)) return send(res,429,{code:"RATE_LIMITED",message:"Đã tạo quá nhiều tài khoản từ kết nối này. Vui lòng thử lại sau."});
    const result=await register(String(email),String(name).trim().slice(0,120),String(password));
    return send(res,201,{user:result.user},result.token);
  } catch(e:any) {
    if(String(e?.code)==="23505") return send(res,409,{code:"EMAIL_EXISTS",message:"Email đã được đăng ký."});
    return send(res,500,{code:"AUTH_CONFIG_ERROR",message:e?.message||"Auth unavailable"});
  }
}
