import { authenticate, send } from "./auth.js";
export default async function handler(req:any,res:any) {
  if(req.method!=="GET") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  const user=await authenticate(req);
  return user?send(res,200,{user}):send(res,401,{code:"UNAUTHENTICATED"});
}
