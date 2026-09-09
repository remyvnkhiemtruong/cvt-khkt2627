import { createHmac } from 'node:crypto';
import { databaseUrl, getPool } from './db.js';

const cleanText = (value, max = 240) => String(value || '').trim().slice(0, max);
const b64 = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

function jwtSecret() {
  const value = String(process.env.JWT_SECRET || '');
  if (value.length >= 32) return value;
  return createHmac('sha256', 'hoc-tot-ngu-van:jwt-fallback:v1').update(databaseUrl()).digest('hex');
}

function sign(payload) {
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const encoded = b64(payload);
  const signature = createHmac('sha256', jwtSecret()).update(`${header}.${encoded}`).digest('base64url');
  return `${header}.${encoded}.${signature}`;
}

function rowToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    accountStatus: row.account_status,
    lastLogin: row.last_login || null,
    className: row.class_name || '',
    profile: row.profile_json || {}
  };
}

export async function loginBcrypt(email, password) {
  const pool = await getPool();
  const cleanEmail = cleanText(email, 240).toLowerCase();
  const result = await pool.query(`
    SELECT u.id,u.email,u.name,u.role,u.must_change_password,u.account_status,u.last_login,u.profile_json,
           COALESCE((SELECT string_agg(DISTINCT c.code, ', ' ORDER BY c.code)
                     FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE cm.user_id=u.id),'') class_name
    FROM app_users u
    WHERE lower(u.email)=$1 AND u.account_status='active'
      AND u.password_hash LIKE '$2%'
      AND crypt($2,u.password_hash)=u.password_hash
    LIMIT 1
  `, [cleanEmail, String(password)]);
  const row = result.rows[0];
  if (!row) return null;
  await pool.query('UPDATE app_users SET last_login=now(),updated_at=now() WHERE id=$1', [row.id]);
  row.last_login = new Date().toISOString();
  const user = rowToUser(row);
  const now = Math.floor(Date.now() / 1000);
  return { user, token: sign({ user: { id: user.id }, iat: now, exp: now + 28800 }) };
}
