import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { databaseUrl } from "../_lib/db.js";

let poolPromise;
let schemaPromise;

async function pool() {
  if (!poolPromise) poolPromise = import("pg").then(({ Pool }) => new Pool({
    connectionString: databaseUrl(), max: 3, idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  }));
  return poolPromise;
}

function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordVerify(password, stored) {
  const [salt, hex] = String(stored || "").split(":");
  if (!salt || !hex) return false;
  const actual = scryptSync(password, salt, 64), expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function b64(value) { return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url"); }
function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.DATABASE_URL) return createHash("sha256").update(`hoc-tot-ngu-van:jwt:${process.env.DATABASE_URL}`).digest("hex");
  throw new Error("AUTH_SECRET_MISSING");
}
function sign(payload) {
  const header=b64({alg:"HS256",typ:"JWT"}), body=b64(payload);
  return `${header}.${body}.${createHmac("sha256",jwtSecret()).update(`${header}.${body}`).digest("base64url")}`;
}
function verifyPayload(token) {
  try {
    const [header,payload,signature]=String(token||"").split("."); if(!header||!payload||!signature)return null;
    const expected=createHmac("sha256",jwtSecret()).update(`${header}.${payload}`).digest("base64url");
    const a=Buffer.from(signature),b=Buffer.from(expected); if(a.length!==b.length||!timingSafeEqual(a,b))return null;
    const data=JSON.parse(Buffer.from(payload,"base64url").toString());
    if(!data?.user||Number(data.exp)<Date.now()/1000)return null;
    return data;
  } catch { return null; }
}
function sessionForUser(user) { const now=Math.floor(Date.now()/1000); return {user,token:sign({user,iat:now,exp:now+28800})}; }
function cookieToken(req) { return String(req.headers?.cookie||"").match(/cvt_token=([^;]+)/)?.[1] || ""; }

const cleanText=(value,max=240)=>String(value||"").trim().slice(0,max);
const cleanList=(value,maxItems=12,maxLength=80)=>{
  const items=Array.isArray(value)?value:String(value||"").split(/[\n,]/);
  return [...new Set(items.map(item=>cleanText(item,maxLength)).filter(Boolean))].slice(0,maxItems);
};
function sanitizeProfile(input={}) {
  const dateOfBirth=cleanText(input.dateOfBirth,10);
  return {
    phone: cleanText(input.phone,30),
    dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? dateOfBirth : "",
    school: cleanText(input.school,160),
    schoolYear: cleanText(input.schoolYear,20),
    grade: cleanText(input.grade,30),
    studentCode: cleanText(input.studentCode,50),
    staffCode: cleanText(input.staffCode,50),
    department: cleanText(input.department,120),
    bio: cleanText(input.bio,600),
    learningGoal: cleanText(input.learningGoal,600),
    favoriteGenres: cleanList(input.favoriteGenres),
    favoriteAuthors: cleanList(input.favoriteAuthors),
    favoriteWorks: cleanList(input.favoriteWorks)
  };
}
function rowToUser(row) {
  return {
    id:row.id,email:row.email,name:row.name,role:row.role,
    mustChangePassword:Boolean(row.must_change_password),accountStatus:row.account_status,
    lastLogin:row.last_login||null,className:row.class_name||"",profile:row.profile_json||{}
  };
}
async function loadFullUser(db,userId) {
  const base=await db.query(`SELECT id,email,name,role,must_change_password,account_status,last_login,updated_at,profile_json FROM app_users WHERE id=$1`,[userId]);
  const row=base.rows[0]; if(!row)return null;
  try {
    const classResult=await db.query(`SELECT string_agg(DISTINCT c.code, ', ' ORDER BY c.code) class_name
      FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE cm.user_id=$1`,[userId]);
    row.class_name=classResult.rows[0]?.class_name||"";
  } catch { row.class_name=""; }
  return row;
}

export function requestIp(req) { return String(req.headers?.["x-forwarded-for"]||req.socket?.remoteAddress||"").split(",")[0].trim(); }
export function assertSameOrigin(req) {
  const origin=String(req.headers?.origin||""); if(!origin)return;
  const host=String(req.headers?.["x-forwarded-host"]||req.headers?.host||"");
  try { if(new URL(origin).host!==host) throw new Error("CSRF_ORIGIN_MISMATCH"); }
  catch(error){ if(String(error?.message)==="CSRF_ORIGIN_MISMATCH")throw error; throw new Error("INVALID_ORIGIN"); }
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db=await pool();
      await db.query(`CREATE TABLE IF NOT EXISTS app_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, name text NOT NULL,
        role text NOT NULL CHECK (role IN ('admin','teacher','student','peer','researcher','ai')), password_hash text NOT NULL,
        must_change_password boolean NOT NULL DEFAULT true, account_status text NOT NULL DEFAULT 'active', profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), last_login timestamptz)`);
      await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login timestamptz");
      await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'");
      await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()");
      await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile_json jsonb NOT NULL DEFAULT '{}'::jsonb");
      await db.query(`CREATE TABLE IF NOT EXISTS auth_rate_events (id bigserial PRIMARY KEY,event_key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);
      await db.query("CREATE INDEX IF NOT EXISTS idx_auth_rate_events_key_time ON auth_rate_events(event_key,created_at DESC)");

      const roleConstraint=await db.query(`SELECT pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='app_users'::regclass AND conname='app_users_role_check' LIMIT 1`);
      const roleDefinition=String(roleConstraint.rows[0]?.definition||"");
      if(!roleDefinition.includes("'peer'")){
        await db.query("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check");
        await db.query("ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin','teacher','student','peer','researcher','ai'))");
      }

      // Optional one-time bootstrap for a new empty environment. Existing accounts are never
      // renamed or re-roled during ordinary requests.
      const seeds=[
        ["admin@cvt.edu.vn","Quản trị hệ thống","admin",process.env.BOOTSTRAP_ADMIN_PASSWORD],
        ["giaovien@cvt.edu.vn","Giáo viên Ngữ văn","teacher",process.env.BOOTSTRAP_TEACHER_PASSWORD],
        ["hocsinh@cvt.edu.vn","Học sinh","student",process.env.BOOTSTRAP_STUDENT_PASSWORD],
        ["ai@cvt.edu.vn","AI","ai",process.env.BOOTSTRAP_AI_PASSWORD]
      ];
      for(const [email,name,role,password] of seeds){
        if(password) await db.query(`INSERT INTO app_users(email,name,role,password_hash,must_change_password)
          VALUES($1,$2,$3,$4,true) ON CONFLICT(email) DO NOTHING`,[email,name,role,passwordHash(password)]);
      }
    })().catch(error => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

export async function checkRateLimit(key, limit=10, windowSeconds=900) {
  await ensureSchema(); const db=await pool(); const client=await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[key]);
    await client.query("DELETE FROM auth_rate_events WHERE created_at < now() - interval '1 day'");
    const result=await client.query("SELECT count(*)::int count FROM auth_rate_events WHERE event_key=$1 AND created_at > now()-($2::text||' seconds')::interval",[key,String(windowSeconds)]);
    if(Number(result.rows[0]?.count||0)>=limit){ await client.query("ROLLBACK"); return false; }
    await client.query("INSERT INTO auth_rate_events(event_key) VALUES($1)",[key]);
    await client.query("COMMIT"); return true;
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  } finally { client.release(); }
}

export async function login(email,password) {
  await ensureSchema(); const db=await pool();
  const result=await db.query("SELECT id,password_hash,account_status FROM app_users WHERE lower(email)=lower($1)",[cleanText(email,240)]);
  const row=result.rows[0]; if(!row||row.account_status!=='active'||!passwordVerify(password,row.password_hash))return null;
  await db.query("UPDATE app_users SET last_login=now(),updated_at=now() WHERE id=$1",[row.id]);
  const current=await loadFullUser(db,row.id); if(!current)return null;
  return sessionForUser(rowToUser(current));
}

export async function register(email,name,password) {
  await ensureSchema(); const db=await pool();
  const cleanEmail=cleanText(email,240).toLowerCase();
  const cleanName=cleanText(name,120);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)||cleanName.length<2||String(password).length<10) throw new Error("VALIDATION_ERROR");
  const result=await db.query(`INSERT INTO app_users(email,name,role,password_hash,must_change_password,last_login,account_status,profile_json)
    VALUES($1,$2,'student',$3,false,now(),'active','{}'::jsonb) RETURNING id`,[cleanEmail,cleanName,passwordHash(password)]);
  const row=await loadFullUser(db,result.rows[0].id); return sessionForUser(rowToUser(row));
}

export async function changePassword(userId,newPassword,currentPassword="") {
  await ensureSchema(); const db=await pool();
  const current=await db.query("SELECT password_hash,must_change_password,account_status FROM app_users WHERE id=$1",[userId]);
  const row=current.rows[0];
  if(!row||row.account_status!=="active")return null;
  if(!row.must_change_password && !passwordVerify(currentPassword,row.password_hash)) throw new Error("INVALID_CURRENT_PASSWORD");
  const result=await db.query(`UPDATE app_users SET password_hash=$2,must_change_password=false,updated_at=now() WHERE id=$1 RETURNING id`,[userId,passwordHash(newPassword)]);
  if(!result.rows[0])return null;
  const updated=await loadFullUser(db,userId); return sessionForUser(rowToUser(updated));
}

export async function updateProfile(userId,input) {
  await ensureSchema(); const db=await pool();
  const name=cleanText(input?.name,120); if(name.length<2)throw new Error("INVALID_NAME");
  const profile=sanitizeProfile(input?.profile||{});
  const result=await db.query(`UPDATE app_users SET name=$2,profile_json=$3::jsonb,updated_at=now() WHERE id=$1 AND account_status='active' RETURNING id`,[userId,name,JSON.stringify(profile)]);
  if(!result.rows[0])return null;
  const row=await loadFullUser(db,userId); return sessionForUser(rowToUser(row));
}

export async function setTemporaryPassword(userId,newPassword) {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`UPDATE app_users SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1 RETURNING id`,[userId,passwordHash(newPassword)]);
  return Boolean(result.rows[0]);
}

export async function listUsers() {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`SELECT id,email,name,role,account_status,must_change_password,created_at,last_login,profile_json FROM app_users ORDER BY created_at DESC,email ASC`);
  return result.rows;
}

export function getUser(req) {
  return verifyPayload(cookieToken(req))?.user || null;
}

export async function authenticate(req) {
  const payload=verifyPayload(cookieToken(req));
  if(!payload?.user?.id)return null;
  await ensureSchema(); const db=await pool();
  const row=await loadFullUser(db,payload.user.id);
  if(!row||row.account_status!=='active')return null;
  const tokenIssuedAt=Number(payload.iat||0)*1000;
  const accountUpdatedAt=new Date(row.updated_at).getTime();
  if(!Number.isFinite(tokenIssuedAt)||accountUpdatedAt>tokenIssuedAt+2000)return null;
  return rowToUser(row);
}

export function send(res,status,data,token) {
  if(token)res.setHeader("Set-Cookie",`cvt_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  res.setHeader("Cache-Control","private, no-store");
  res.setHeader("Content-Type","application/json"); return res.status(status).json(data);
}
export function body(req) { if(req.body&&typeof req.body==="object")return req.body; return JSON.parse(req.body||"{}"); }
