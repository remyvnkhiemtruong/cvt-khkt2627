import { send } from "./auth.js";
export default function handler(req:any,res:any) { res.setHeader("Set-Cookie","cvt_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"); return send(res,200,{ok:true}); }
