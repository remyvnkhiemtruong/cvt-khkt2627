import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

let poolPromise;

async function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!poolPromise) poolPromise = import("pg").then(({ Pool }) => new Pool({
    connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: false }
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
  if (process.env.DATABASE_URL) return createHash("sha256").update(`cvt-khkt2627:jwt:${process.env.DATABASE_URL}`).digest("hex");
  throw new Error("JWT_SECRET or DATABASE_URL is required");
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

export function requestIp(req) { return String(req.headers?.["x-forwarded-for"]||req.socket?.remoteAddress||"").split(",")[0].trim(); }
export function assertSameOrigin(req) {
  const origin=String(req.headers?.origin||""); if(!origin)return;
  const host=String(req.headers?.["x-forwarded-host"]||req.headers?.host||"");
  try { if(new URL(origin).host!==host) throw new Error("CSRF_ORIGIN_MISMATCH"); }
  catch(error){ if(String(error?.message)==="CSRF_ORIGIN_MISMATCH")throw error; throw new Error("INVALID_ORIGIN"); }
}

export async function ensureSchema() {
  const db=await pool();
  await db.query(`CREATE TABLE IF NOT EXISTS app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin','teacher','student','peer','researcher','ai')), password_hash text NOT NULL,
    must_change_password boolean NOT NULL DEFAULT true, account_status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), last_login timestamptz)`);
  await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login timestamptz");
  await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'");
  await db.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()");
  await db.query(`CREATE TABLE IF NOT EXISTS auth_rate_events (id bigserial PRIMARY KEY,event_key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);
  await db.query("CREATE INDEX IF NOT EXISTS idx_auth_rate_events_key_time ON auth_rate_events(event_key,created_at DESC)");

  const roleConstraint=await db.query(`SELECT pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='app_users'::regclass AND conname='app_users_role_check' LIMIT 1`);
  const roleDefinition=String(roleConstraint.rows[0]?.definition||"");
  if(!roleDefinition.includes("'peer'")){
    await db.query("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check");
    await db.query("ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin','teacher','student','peer','researcher','ai'))");
  }

  const classMembersExists=await db.query("SELECT to_regclass('public.class_members') AS table_name");
  if(classMembersExists.rows[0]?.table_name){
    await db.query(`CREATE OR REPLACE FUNCTION guard_seeded_class_membership() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE member_email text; target_class_code text;
      BEGIN
        IF current_setting('app.class_member_write', true) = 'admin' THEN RETURN NEW; END IF;
        IF NEW.member_role <> 'student' THEN RETURN NEW; END IF;
        SELECT lower(email) INTO member_email FROM app_users WHERE id=NEW.user_id;
        SELECT code INTO target_class_code FROM classes WHERE id=NEW.class_id;
        IF target_class_code='11A1' AND member_email <> 'hocsinh@cvt.edu.vn' THEN RETURN NULL; END IF;
        RETURN NEW;
      END $$`);
    await db.query("DROP TRIGGER IF EXISTS class_members_seed_guard ON class_members");
    await db.query("CREATE TRIGGER class_members_seed_guard BEFORE INSERT ON class_members FOR EACH ROW EXECUTE FUNCTION guard_seeded_class_membership()");
  }

  const seeds=[
    ["admin@cvt.edu.vn","Quản trị hệ thống","admin",process.env.BOOTSTRAP_ADMIN_PASSWORD],
    ["giaovien@cvt.edu.vn","Giáo viên CVT","teacher",process.env.BOOTSTRAP_TEACHER_PASSWORD],
    ["hocsinh@cvt.edu.vn","Học sinh CVT","student",process.env.BOOTSTRAP_STUDENT_PASSWORD],
    ["ai@cvt.edu.vn","AI","ai",process.env.BOOTSTRAP_AI_PASSWORD]
  ];
  for(const [email,name,role,password] of seeds){
    if(password) await db.query(`INSERT INTO app_users(email,name,role,password_hash,must_change_password) VALUES($1,$2,$3,$4,true)
      ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role`,[email,name,role,passwordHash(password)]);
    else await db.query("UPDATE app_users SET name=$2,role=$3 WHERE lower(email)=lower($1)",[email,name,role]);
  }
}

export async function checkRateLimit(key, limit=10, windowSeconds=900) {
  await ensureSchema(); const db=await pool();
  await db.query("DELETE FROM auth_rate_events WHERE created_at < now() - interval '1 day'");
  const result=await db.query("SELECT count(*)::int count FROM auth_rate_events WHERE event_key=$1 AND created_at > now()-($2::text||' seconds')::interval",[key,String(windowSeconds)]);
  if(Number(result.rows[0]?.count||0)>=limit)return false;
  await db.query("INSERT INTO auth_rate_events(event_key) VALUES($1)",[key]); return true;
}

export async function login(email,password) {
  await ensureSchema(); const db=await pool();
  const result=await db.query("SELECT id,email,name,role,must_change_password,password_hash,account_status FROM app_users WHERE lower(email)=lower($1)",[email]);
  const row=result.rows[0]; if(!row||row.account_status!=='active'||!passwordVerify(password,row.password_hash))return null;
  const updated=await db.query("UPDATE app_users SET last_login=now(),updated_at=now() WHERE id=$1 RETURNING id,email,name,role,must_change_password,account_status",[row.id]);
  const current=updated.rows[0];
  return sessionForUser({id:current.id,email:current.email,name:current.name,role:current.role,mustChangePassword:current.must_change_password,accountStatus:current.account_status});
}

export async function register(email,name,password) {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`INSERT INTO app_users(email,name,role,password_hash,must_change_password,last_login,account_status)
    VALUES(lower($1),$2,'student',$3,false,now(),'active') RETURNING id,email,name,role,must_change_password,account_status`,[email,name,passwordHash(password)]);
  const row=result.rows[0]; return sessionForUser({id:row.id,email:row.email,name:row.name,role:row.role,mustChangePassword:row.must_change_password,accountStatus:row.account_status});
}

export async function changePassword(userId,newPassword) {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`UPDATE app_users SET password_hash=$2,must_change_password=false,updated_at=now() WHERE id=$1
    RETURNING id,email,name,role,must_change_password,account_status`,[userId,passwordHash(newPassword)]);
  const row=result.rows[0]; if(!row)return null;
  return sessionForUser({id:row.id,email:row.email,name:row.name,role:row.role,mustChangePassword:row.must_change_password,accountStatus:row.account_status});
}

export async function setTemporaryPassword(userId,newPassword) {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`UPDATE app_users SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1 RETURNING id`,[userId,passwordHash(newPassword)]);
  return Boolean(result.rows[0]);
}

export async function listUsers() {
  await ensureSchema(); const db=await pool();
  const result=await db.query(`SELECT id,email,name,role,account_status,must_change_password,created_at,last_login FROM app_users ORDER BY created_at DESC,email ASC`);
  return result.rows;
}

export function getUser(req) {
  return verifyPayload(cookieToken(req))?.user || null;
}

export async function authenticate(req) {
  const payload=verifyPayload(cookieToken(req));
  if(!payload?.user?.id)return null;
  await ensureSchema(); const db=await pool();
  const result=await db.query(`SELECT id,email,name,role,must_change_password,account_status,updated_at FROM app_users WHERE id=$1`,[payload.user.id]);
  const row=result.rows[0];
  if(!row||row.account_status!=='active')return null;
  const tokenIssuedAt=Number(payload.iat||0)*1000;
  const accountUpdatedAt=new Date(row.updated_at).getTime();
  if(!Number.isFinite(tokenIssuedAt)||accountUpdatedAt>tokenIssuedAt+2000)return null;
  return {id:row.id,email:row.email,name:row.name,role:row.role,mustChangePassword:row.must_change_password,accountStatus:row.account_status};
}

export function send(res,status,data,token) {
  if(token)res.setHeader("Set-Cookie",`cvt_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  res.setHeader("Content-Type","application/json"); return res.status(status).json(data);
}
export function body(req) { if(req.body&&typeof req.body==="object")return req.body; return JSON.parse(req.body||"{}"); }
