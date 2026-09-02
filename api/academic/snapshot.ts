import { getUser, send } from "../auth/auth.js";
import { getAcademicSnapshot } from "../_lib/academic.js";

export default async function handler(req:any,res:any) {
  if (req.method !== "GET") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    const user=getUser(req);
    if(!user) return send(res,401,{code:"UNAUTHENTICATED"});
    const snapshot=await getAcademicSnapshot(user);
    return send(res,200,{snapshot});
  } catch(error:any) {
    return send(res,500,{code:"ACADEMIC_SNAPSHOT_ERROR",message:error?.message||"Không thể tải dữ liệu học tập"});
  }
}
