import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

type Role = "admin" | "teacher" | "student" | "researcher";
type User = { id:string; email:string; name:string; role:Role; mustChangePassword:boolean };

let poolPromise: Promise<any> | undefined;
async function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!poolPromise) poolPromise = import("pg").then(({Pool}) => new Pool({connectionString:process.env.DATABASE_URL, max:3, ssl:{rejectUnauthorized:false}}));
  return poolPromise;
}
function passwordHash(password:string, salt=randomBytes(16).toString("hex")) {
  return salt+":"+scryptSync(password,salt,64).toString("hex");
}
function passwordVerify(password:string, stored:string) {
  const [salt,hex] = stored.split(":"); if (!salt || !hex) return false;
  const actual=scryptSync(password,salt,64); const expected=Buffer.from(hex,"hex");
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
function b64(value:string|object) { return Buffer.from(typeof value==="string"?value:JSON.stringify(value)).toString("base64url"); }
function sign(payload:object) {
  const head=b64({alg:"HS256",typ:"JWT"}), body=b64(payload);
  const secret=process.env.JWT_SECRET || "change-this-secret-before-production";
  return head+"."+body+"."+createHmac("sha256",secret).update(head+"."+body).digest("base64url");
}
function verify(token:string): User|null {
  try {
    const [h,p,s]=token.split("."); const secret=process.env.JWT_SECRET || "change-this-secret-before-production";
    const expected=createHmac("sha256",secret).update(h+"."+p).digest("base64url");
    if (!s || !timingSafeEqual(Buffer.from(s),Buffer.from(expected))) return null;
    const data=JSON.parse(Buffer.from(p,"base64url").toString()); if (data.exp<Date.now()/1000) return null;
    return data.user;
  } catch { return null; }
}
export async function ensureSchema() {
  const p=await pool();
  await p.query(`CREATE TABLE IF NOT EXISTS app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL,
    name text NOT NULL, role text NOT NULL CHECK (role IN ('admin','teacher','student','researcher')),
    password_hash text NOT NULL, must_change_password boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  const seeds=[["admin@cvt.edu.vn","Quản trị hệ thống","admin","Admin@2026!"],["giaovien@cvt.edu.vn","Giáo viên CVT","teacher","Teacher@2026!"],["hocsinh@cvt.edu.vn","Học sinh CVT","student","Student@2026!"]];
  for (const [email,name,role,password] of seeds) await p.query("INSERT INTO app_users(email,name,role,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING",[email,name,role,passwordHash(password)]);
}
export async function login(email:string,password:string) {
  await ensureSchema(); const p=await pool(); const r=await p.query("SELECT id,email,name,role,must_change_password,password_hash FROM app_users WHERE lower(email)=lower($1)",[email]);
  const row=r.rows[0]; if (!row || !passwordVerify(password,row.password_hash)) return null;
  const user={id:row.id,email:row.email,name:row.name,role:row.role,mustChangePassword:row.must_change_password} as User;
  return { user, token:sign({user,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60*60*8}) };
}
export async function register(email:string,name:string,password:string) {
  await ensureSchema(); const p=await pool();
  const r=await p.query("INSERT INTO app_users(email,name,role,password_hash,must_change_password) VALUES(lower($1),$2,'student',$3,false) RETURNING id,email,name,role,must_change_password",[email,name,passwordHash(password)]);
  const row=r.rows[0]; const user={id:row.id,email:row.email,name:row.name,role:row.role,mustChangePassword:row.must_change_password} as User;
  return {user,token:sign({user,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60*60*8})};
}
export function getUser(req:any) {
  const auth=String(req.headers?.authorization||""); const cookie=String(req.headers?.cookie||"").match(/cvt_token=([^;]+)/)?.[1];
  return verify(auth.startsWith("Bearer ")?auth.slice(7):cookie||"");
}
export function send(res:any,status:number,data:any,token?:string) {
  if (token) res.setHeader("Set-Cookie",`cvt_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  res.setHeader("Content-Type","application/json"); res.status(status).json(data);
}
export function body(req:any) { return typeof req.body==="object"?req.body:JSON.parse(req.body||"{}"); }
