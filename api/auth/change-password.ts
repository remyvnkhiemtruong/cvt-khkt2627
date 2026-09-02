import { body, changePassword, getUser, send } from "./auth.js";
import { assertSameOrigin } from "../_lib/academic.js";

export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const user=getUser(req);
    if(!user) return send(res,401,{code:"UNAUTHENTICATED"});
    const {newPassword}=body(req);
    if(!newPassword || String(newPassword).length<10) return send(res,400,{code:"VALIDATION_ERROR",message:"Mật khẩu mới phải có ít nhất 10 ký tự."});
    const result=await changePassword(user.id,String(newPassword));
    if(!result) return send(res,404,{code:"USER_NOT_FOUND"});
    return send(res,200,{user:result.user},result.token);
  } catch(error:any) {
    return send(res,500,{code:"PASSWORD_CHANGE_ERROR",message:error?.message||"Không thể đổi mật khẩu"});
  }
}
