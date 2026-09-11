import { randomBytes, scryptSync } from "node:crypto";
import { databaseUrl } from "../_lib/db.js";
import { assertSameOrigin, body, checkRateLimit, login, requestIp, send } from "./auth.js";

function scryptHash(password:string) {
  const salt=randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;
}

async function migrateTemporaryBcrypt(email:string,password:string) {
  const {Pool}=await import("pg");
  const pool=new Pool({connectionString:databaseUrl(),max:1,idleTimeoutMillis:5000,connectionTimeoutMillis:10000});
  try {
    const row=(await pool.query(
      "SELECT id,password_hash FROM app_users WHERE lower(email)=lower($1) AND account_status='active' AND password_hash LIKE '$2%' LIMIT 1",
      [email]
    )).rows[0];
    if(!row) return;
    const verified=(await pool.query("SELECT crypt($1,$2)=$2 AS ok",[password,row.password_hash])).rows[0]?.ok===true;
    if(!verified) return;
    await pool.query(
      "UPDATE app_users SET password_hash=$2,updated_at=now() WHERE id=$1 AND password_hash=$3",
      [row.id,scryptHash(password),row.password_hash]
    );
  } finally {
    await pool.end().catch(()=>undefined);
  }
}

export default async function handler(req:any,res:any) {
  if(req.method!=="POST") return send(res,405,{code:"METHOD_NOT_ALLOWED"});
  try {
    assertSameOrigin(req);
    const {email,password}=body(req);
    if(!email||!password) return send(res,400,{code:"VALIDATION_ERROR",message:"Email và mật khẩu là bắt buộc."});
    const cleanEmail=String(email).toLowerCase().slice(0,240);
    const cleanPassword=String(password);
    const key=`login:${requestIp(req)}:${cleanEmail}`;
    if(!await checkRateLimit(key,8,900)) return send(res,429,{code:"RATE_LIMITED",message:"Đăng nhập quá nhiều lần. Vui lòng thử lại sau."});
    await migrateTemporaryBcrypt(cleanEmail,cleanPassword);
    const result=await login(cleanEmail,cleanPassword);
    if(!result) return send(res,401,{code:"INVALID_CREDENTIALS",message:"Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa."});
    return send(res,200,{user:result.user},result.token);
  } catch(e:any) {
    const code=String(e?.message||'LOGIN_ERROR');
    if(code==='CSRF_ORIGIN_MISMATCH'||code==='INVALID_ORIGIN') return send(res,403,{code:'CSRF_ORIGIN_MISMATCH',message:'Yêu cầu không hợp lệ.'});
    return send(res,500,{code:'LOGIN_ERROR',message:'Dịch vụ đăng nhập tạm thời không khả dụng.'});
  }
}
