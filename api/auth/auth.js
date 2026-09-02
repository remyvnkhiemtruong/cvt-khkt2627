import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

let poolPromise;

async function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!poolPromise) {
    poolPromise = import("pg").then(({ Pool }) => new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    }));
  }
  return poolPromise;
}

function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordVerify(password, stored) {
  const [salt, hex] = String(stored || "").split(":");
  if (!salt || !hex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function b64(value) {
  return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
}

function jwtSecret() {
  return process.env.JWT_SECRET || "change-this-secret-before-production";
}

function sign(payload) {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  const signature = createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verify(token) {
  try {
    const [header, payload, signature] = String(token || "").split(".");
    if (!header || !payload || !signature) return null;
    const expected = createHmac("sha256", jwtSecret()).update(`${header}.${payload}`).digest("base64url");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data?.user || Number(data.exp) < Date.now() / 1000) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function ensureSchema() {
  const db = await pool();
  await db.query(`CREATE TABLE IF NOT EXISTS app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin','teacher','student','researcher','ai')),
    password_hash text NOT NULL,
    must_change_password boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);

  // Older production databases were created before the AI role existed.
  // CREATE TABLE IF NOT EXISTS does not update an existing CHECK constraint,
  // so migrate that constraint once when required.
  const roleConstraint = await db.query(`
    SELECT pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'app_users'::regclass
      AND conname = 'app_users_role_check'
    LIMIT 1
  `);
  const definition = String(roleConstraint.rows[0]?.definition || "");
  if (!definition.includes("'ai'")) {
    await db.query("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check");
    await db.query("ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin','teacher','student','researcher','ai'))");
  }

  const seeds = [
    ["admin@cvt.edu.vn", "Quản trị hệ thống", "admin", "Admin@2026!"],
    ["giaovien@cvt.edu.vn", "Giáo viên CVT", "teacher", "Teacher@2026!"],
    ["hocsinh@cvt.edu.vn", "Học sinh CVT", "student", "Student@2026!"],
    ["ai@cvt.edu.vn", "AI", "ai", "AI@2026!"]
  ];

  for (const [email, name, role, password] of seeds) {
    await db.query(
      `INSERT INTO app_users(email,name,role,password_hash,must_change_password)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role`,
      [email, name, role, passwordHash(password), role !== "student"]
    );
  }
}

export async function login(email, password) {
  await ensureSchema();
  const db = await pool();
  const result = await db.query(
    "SELECT id,email,name,role,must_change_password,password_hash FROM app_users WHERE lower(email)=lower($1)",
    [email]
  );
  const row = result.rows[0];
  if (!row || !passwordVerify(password, row.password_hash)) return null;
  const user = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.must_change_password
  };
  const now = Math.floor(Date.now() / 1000);
  return { user, token: sign({ user, iat: now, exp: now + 28800 }) };
}

export async function register(email, name, password) {
  await ensureSchema();
  const db = await pool();
  const result = await db.query(
    `INSERT INTO app_users(email,name,role,password_hash,must_change_password)
     VALUES(lower($1),$2,'student',$3,false)
     RETURNING id,email,name,role,must_change_password`,
    [email, name, passwordHash(password)]
  );
  const row = result.rows[0];
  const user = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.must_change_password
  };
  const now = Math.floor(Date.now() / 1000);
  return { user, token: sign({ user, iat: now, exp: now + 28800 }) };
}

export function getUser(req) {
  const authorization = String(req.headers?.authorization || "");
  const cookieToken = String(req.headers?.cookie || "").match(/cvt_token=([^;]+)/)?.[1];
  return verify(authorization.startsWith("Bearer ") ? authorization.slice(7) : cookieToken || "");
}

export function send(res, status, data, token) {
  if (token) {
    res.setHeader("Set-Cookie", `cvt_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  }
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(data);
}

export function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return JSON.parse(req.body || "{}");
}
