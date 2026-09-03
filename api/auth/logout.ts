import { assertSameOrigin, send } from "./auth.js";
export default function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try { assertSameOrigin(req); }
  catch(error:any) { return send(res,403,{code:String(error?.message||'CSRF_ORIGIN_MISMATCH')}); }
  res.setHeader("Set-Cookie","cvt_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return send(res,200,{ok:true});
}
