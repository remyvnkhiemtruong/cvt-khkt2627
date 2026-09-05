import { assertSameOrigin, body, checkRateLimit, register, requestIp, send } from "./auth.js";
export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const {email,name,password}=body(req);
    if(!email||!name||!password||String(password).length<10) return send(res,400,{code:"VALIDATION_ERROR",message:"Cần email, họ tên và mật khẩu tối thiểu 10 ký tự."});
    if(!await checkRateLimit(`register:${requestIp(req)}`,5,3600)) return send(res,429,{code:"RATE_LIMITED",message:"Đã tạo quá nhiều tài khoản từ kết nối này. Vui lòng thử lại sau."});
    const result=await register(String(email),String(name).trim().slice(0,120),String(password));
    return send(res,201,{user:result.user},result.token);
  } catch(e:any) {
    if(String(e?.code)==="23505") return send(res,409,{code:"EMAIL_EXISTS",message:"Email đã được đăng ký."});
    const code=String(e?.message||'REGISTER_ERROR');
    if(code==='CSRF_ORIGIN_MISMATCH'||code==='INVALID_ORIGIN') return send(res,403,{code:'CSRF_ORIGIN_MISMATCH',message:'Yêu cầu không hợp lệ.'});
    if(code==='VALIDATION_ERROR') return send(res,400,{code,message:'Thông tin đăng ký không hợp lệ.'});
    return send(res,500,{code:'REGISTER_ERROR',message:'Không thể tạo tài khoản lúc này.'});
  }
}
