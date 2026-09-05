import { assertSameOrigin, authenticate, body, changePassword, send } from "./auth.js";

export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const user=await authenticate(req);
    if(!user) return send(res,401,{code:"UNAUTHENTICATED"});
    const {newPassword,currentPassword}=body(req);
    if(!newPassword || String(newPassword).length<10) return send(res,400,{code:"VALIDATION_ERROR",message:"Mật khẩu mới phải có ít nhất 10 ký tự."});
    const result=await changePassword(user.id,String(newPassword),String(currentPassword||""));
    if(!result) return send(res,404,{code:"USER_NOT_FOUND"});
    return send(res,200,{user:result.user},result.token);
  } catch(error:any) {
    const code=String(error?.message||'PASSWORD_CHANGE_ERROR');
    if(code==='CSRF_ORIGIN_MISMATCH'||code==='INVALID_ORIGIN') return send(res,403,{code:'CSRF_ORIGIN_MISMATCH',message:'Yêu cầu không hợp lệ.'});
    if(code==='INVALID_CURRENT_PASSWORD') return send(res,400,{code,message:'Mật khẩu hiện tại không đúng.'});
    return send(res,500,{code:'PASSWORD_CHANGE_ERROR',message:'Không thể đổi mật khẩu lúc này.'});
  }
}
