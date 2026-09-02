import { assertSameOrigin, body, checkRateLimit, login, requestIp, send } from "./auth.js";
export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const {email,password}=body(req);
    if(!email||!password) return send(res,400,{code:"VALIDATION_ERROR",message:"Email và mật khẩu là bắt buộc."});
    const key=`login:${requestIp(req)}:${String(email).toLowerCase()}`;
    if(!await checkRateLimit(key,8,900)) return send(res,429,{code:"RATE_LIMITED",message:"Đăng nhập quá nhiều lần. Vui lòng thử lại sau."});
    const result=await login(String(email),String(password));
    if(!result) return send(res,401,{code:"INVALID_CREDENTIALS",message:"Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa."});
    return send(res,200,{user:result.user},result.token);
  } catch(e:any) { return send(res,500,{code:"AUTH_CONFIG_ERROR",message:e?.message||"Auth unavailable"}); }
}
