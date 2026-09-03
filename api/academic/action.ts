import { authenticate, body, send } from "../auth/auth.js";
import { academicAction } from "../_lib/academic.js";

export default async function handler(req:any,res:any) {
  if (req.method !== "POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    const user=await authenticate(req);
    if(!user) return send(res,401,{code:"UNAUTHENTICATED"});
    const result=await academicAction(user,body(req),req);
    return send(res,200,result);
  } catch(error:any) {
    const code=String(error?.message||"ACADEMIC_ACTION_ERROR");
    const status=code==="FORBIDDEN"?403:code.includes("NOT_FOUND")?404:code.startsWith("INVALID")||code==="EMPTY_RESPONSE"?400:500;
    return send(res,status,{code,message:code});
  }
}
