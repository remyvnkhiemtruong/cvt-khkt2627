import { getUser, send } from "../_lib/auth.ts";
export default function handler(req:any,res:any) { const user=getUser(req); return user?send(res,200,{user}):send(res,401,{code:"UNAUTHENTICATED"}); }
