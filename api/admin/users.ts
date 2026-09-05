import { authenticate, listUsers, send } from "../auth/auth.js";

export default async function handler(req:any,res:any) {
  if (req.method !== "GET") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    const actor = await authenticate(req);
    if (!actor) return send(res,401,{code:"UNAUTHENTICATED"});
    if (actor.role !== "admin") return send(res,403,{code:"FORBIDDEN"});
    const users = await listUsers();
    return send(res,200,{users});
  } catch(error:any) {
    console.error('[admin/users]', { code: String(error?.message || 'ADMIN_USERS_ERROR'), route: '/api/admin/users' });
    return send(res,500,{code:"ADMIN_USERS_ERROR",message:"Không thể tải danh sách người dùng."});
  }
}
