/// <reference types="node" />
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { academicHealth } from './_lib/academic-v3.js';
import { databaseUrl } from './_lib/db.js';

const BOOTSTRAP_HASH = 'd5840ff7ebdad9edabfb9db38aee3321eaf627d1d05dd4afcec7f24c8ac173bf';
const TARGETS = [
  'admin@cvt.edu.vn',
  'admin2@cvt.edu.vn',
  'giaovien@cvt.edu.vn',
  'giaovien2@cvt.edu.vn',
  'ai-response@cvt.edu.vn',
  'ai-response2@cvt.edu.vn'
] as const;

function tokenMatches(value: unknown) {
  const token = String(value || '');
  if (!token) return false;
  const actual = createHash('sha256').update(token).digest();
  const expected = Buffer.from(BOOTSTRAP_HASH, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function makePassword() {
  return `HTNV-${randomBytes(10).toString('base64url')}!26`;
}

function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function provisionTemporaryPasswords() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl(),
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('cvt-khkt2627:one-time-temp-passwords:20260910'))`);
    const current = await client.query(`
      SELECT id,email,name,role,account_status,profile_json
      FROM app_users
      WHERE lower(email)=ANY($1::text[])
      ORDER BY email
      FOR UPDATE
    `, [TARGETS.map(email => email.toLowerCase())]);

    if (current.rows.length !== TARGETS.length) {
      throw new Error(`TARGET_ACCOUNT_COUNT_MISMATCH:${current.rows.length}`);
    }
    if (current.rows.some((row: any) => Boolean(row.profile_json?.temporaryPasswordIssued))) {
      throw new Error('TEMP_PASSWORDS_ALREADY_ISSUED');
    }

    const credentials: Array<{email:string;name:string;role:string;password:string}> = [];
    for (const row of current.rows) {
      const password = makePassword();
      await client.query(`
        UPDATE app_users
        SET password_hash=$2,
            account_status='active',
            must_change_password=true,
            updated_at=now(),
            profile_json=COALESCE(profile_json,'{}'::jsonb)
              || jsonb_build_object(
                   'temporaryPasswordIssued', true,
                   'temporaryPasswordIssuedAt', now(),
                   'authSource', 'legacy+neon_auth'
                 )
        WHERE id=$1
      `, [row.id, passwordHash(password)]);
      credentials.push({ email: row.email, name: row.name, role: row.role, password });
    }
    await client.query('COMMIT');
    return credentials;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && req.query?.bootstrap !== undefined) {
    if (!tokenMatches(req.query.bootstrap)) {
      return res.status(404).json({ ok: false });
    }
    try {
      const credentials = await provisionTemporaryPasswords();
      return res.status(201).json({
        ok: true,
        provisioned: credentials.length,
        mustChangePassword: true,
        credentials
      });
    } catch (error: any) {
      const code = String(error?.message || 'BOOTSTRAP_ERROR');
      const status = code === 'TEMP_PASSWORDS_ALREADY_ISSUED' ? 409 : 500;
      return res.status(status).json({ ok: false, code });
    }
  }

  try {
    const counts = await academicHealth();
    res.setHeader('Server-Timing', `db;dur=${counts.dbRoundTripMs || 0}, total;dur=${Date.now() - startedAt}`);
    return res.status(200).json({
      ok: true,
      service: 'hoc-tot-ngu-van-api',
      product: 'Học tốt Ngữ Văn',
      version: 'backend-v4-workflow',
      academicData: 'postgresql',
      aiFeedbackMode: 'manual-chatgpt-response-visible-to-student',
      region: process.env.VERCEL_REGION || 'unknown',
      counts: {
        assignments: counts.assignments,
        portfolios: counts.portfolios,
        versions: counts.versions,
        aiReviews: counts.ai_reviews
      },
      textVersioning: Boolean(counts.textVersioning),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[health]', {
      route: '/api/health',
      region: process.env.VERCEL_REGION || 'unknown',
      durationMs: Date.now() - startedAt,
      code: String(error?.message || 'BACKEND_UNAVAILABLE')
    });
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return res.status(500).json({
      ok: false,
      service: 'hoc-tot-ngu-van-api',
      product: 'Học tốt Ngữ Văn',
      version: 'backend-v4-workflow',
      message: 'Backend unavailable',
      timestamp: new Date().toISOString()
    });
  }
}
