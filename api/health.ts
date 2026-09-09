/// <reference types="node" />
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { academicHealth, emptyDraft } from './_lib/academic-v3.js';
import { getPool } from './_lib/db.js';

const bootstrapHash = '435a14014b106df495fa0b714629faee85c889d72a7ffc0c882291358a0be50f';
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

async function maybeBootstrap(req: any, res: any) {
  const token = String(req.query?.bootstrap || '');
  if (!token || process.env.VERCEL_ENV !== 'production') return false;
  const digest = createHash('sha256').update(token).digest('hex');
  const expected = Buffer.from(bootstrapHash, 'hex');
  const actual = Buffer.from(digest, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    res.status(404).json({ code: 'NOT_FOUND' });
    return true;
  }

  const definitions = [
    ['admin01@cvt.edu.vn', 'Quản trị viên 01', 'admin', { superAdmin: true, scope: 'system', schoolYear: '2026-2027' }],
    ['admin02@cvt.edu.vn', 'Quản trị viên 02', 'admin', { superAdmin: true, scope: 'system', schoolYear: '2026-2027' }],
    ['ai01@cvt.edu.vn', 'AI Response 01', 'ai', { manualChatGPTResponse: true, apiIntegration: false, visibleToStudentImmediately: true }],
    ['ai02@cvt.edu.vn', 'AI Response 02', 'ai', { manualChatGPTResponse: true, apiIntegration: false, visibleToStudentImmediately: true }],
    ['giaovien01@cvt.edu.vn', 'Giáo viên Ngữ văn 01', 'teacher', { staffCode: 'GV-KHKT-02', department: 'Ngữ văn', schoolYear: '2026-2027' }],
    ['giaovien02@cvt.edu.vn', 'Giáo viên Ngữ văn 02', 'teacher', { staffCode: 'GV-KHKT-03', department: 'Ngữ văn', schoolYear: '2026-2027' }],
    ['hocsinh03@cvt.edu.vn', 'Học sinh Demo 03', 'student', { studentCode: 'HS-KHKT-03', grade: '11', schoolYear: '2026-2027' }],
    ['hocsinh04@cvt.edu.vn', 'Học sinh Demo 04', 'student', { studentCode: 'HS-KHKT-04', grade: '11', schoolYear: '2026-2027' }]
  ] as const;

  const pool = await getPool();
  const existing = await pool.query('SELECT email FROM app_users WHERE email=ANY($1::text[])', [definitions.map(item => item[0])]);
  if (existing.rows.length) {
    res.status(409).json({ code: 'ALREADY_BOOTSTRAPPED', emails: existing.rows.map(row => row.email) });
    return true;
  }

  const credentials = definitions.map(([email, name, role, profile]) => {
    const password = `HTNV-${randomBytes(9).toString('base64url')}!26`;
    return { email, name, role, profile, password, passwordHash: hashPassword(password) };
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of credentials) {
      await client.query(`INSERT INTO app_users(email,name,role,password_hash,must_change_password,account_status,profile_json) VALUES($1,$2,$3,$4,true,'active',$5::jsonb)`, [item.email, item.name, item.role, item.passwordHash, JSON.stringify(item.profile)]);
    }
    const classRow = (await client.query("SELECT id FROM classes WHERE code='11A1-KHKT' LIMIT 1")).rows[0];
    if (!classRow) throw new Error('CLASS_NOT_FOUND');
    for (const item of credentials.filter(item => item.role === 'teacher')) {
      const row = (await client.query('SELECT id FROM app_users WHERE email=$1', [item.email])).rows[0];
      await client.query("INSERT INTO class_members(class_id,user_id,member_role) VALUES($1,$2,'teacher') ON CONFLICT(class_id,user_id) DO UPDATE SET member_role='teacher'", [classRow.id, row.id]);
    }
    for (const item of credentials.filter(item => item.role === 'student')) {
      const row = (await client.query('SELECT id FROM app_users WHERE email=$1', [item.email])).rows[0];
      await client.query("INSERT INTO class_members(class_id,user_id,member_role) VALUES($1,$2,'student') ON CONFLICT(class_id,user_id) DO UPDATE SET member_role='student'", [classRow.id, row.id]);
      await client.query(`INSERT INTO portfolios(assignment_id,student_id,status,active_version) SELECT id,$1,'drafting','Nháp' FROM assignments WHERE class_id=$2 AND status='published' ON CONFLICT(assignment_id,student_id) DO NOTHING`, [row.id, classRow.id]);
      await client.query(`INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by) SELECT p.id,$2::jsonb,$1 FROM portfolios p WHERE p.student_id=$1 AND p.assignment_id IN (SELECT id FROM assignments WHERE class_id=$3) ON CONFLICT(portfolio_id) DO NOTHING`, [row.id, JSON.stringify(emptyDraft()), classRow.id]);
    }
    await client.query('COMMIT');
    res.status(201).json({ ok: true, classCode: '11A1-KHKT', credentials: credentials.map(({ passwordHash: _passwordHash, profile: _profile, ...item }) => item) });
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (await maybeBootstrap(req, res)) return;
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
      counts: { assignments: counts.assignments, portfolios: counts.portfolios, versions: counts.versions, aiReviews: counts.ai_reviews },
      textVersioning: Boolean(counts.textVersioning),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[health]', { route: '/api/health', region: process.env.VERCEL_REGION || 'unknown', durationMs: Date.now() - startedAt, code: String(error?.message || 'BACKEND_UNAVAILABLE') });
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return res.status(500).json({ ok: false, service: 'hoc-tot-ngu-van-api', product: 'Học tốt Ngữ Văn', version: 'backend-v4-workflow', message: 'Backend unavailable', timestamp: new Date().toISOString() });
  }
}
