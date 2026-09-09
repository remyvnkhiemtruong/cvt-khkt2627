/// <reference types="node" />
import { randomBytes, scryptSync } from 'node:crypto';
import { academicHealth, emptyDraft } from './_lib/academic-v3.js';
import { getPool } from './_lib/db.js';

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

async function bootstrapExtraUsers(req: any, res: any) {
  if (process.env.VERCEL_ENV !== 'preview' || req.method !== 'GET' || String(req.query?.bootstrap || '') !== 'extra-users-20260910') return false;
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
    res.status(409).json({ code: 'EXTRA_USERS_ALREADY_EXIST', emails: existing.rows.map(row => row.email) });
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
      await client.query(`
        INSERT INTO app_users(email,name,role,password_hash,must_change_password,account_status,profile_json)
        VALUES($1,$2,$3,$4,true,'active',$5::jsonb)
      `, [item.email, item.name, item.role, item.passwordHash, JSON.stringify(item.profile)]);
    }
    const classRow = (await client.query("SELECT id FROM classes WHERE code='11A1-KHKT' LIMIT 1")).rows[0];
    if (!classRow) throw new Error('CLASS_NOT_FOUND');
    const teacherRows = await client.query("SELECT id FROM app_users WHERE email IN ('giaovien01@cvt.edu.vn','giaovien02@cvt.edu.vn')");
    for (const row of teacherRows.rows) {
      await client.query("INSERT INTO class_members(class_id,user_id,member_role) VALUES($1,$2,'teacher') ON CONFLICT(class_id,user_id) DO UPDATE SET member_role='teacher'", [classRow.id, row.id]);
    }
    const studentRows = await client.query("SELECT id FROM app_users WHERE email IN ('hocsinh03@cvt.edu.vn','hocsinh04@cvt.edu.vn')");
    for (const row of studentRows.rows) {
      await client.query("INSERT INTO class_members(class_id,user_id,member_role) VALUES($1,$2,'student') ON CONFLICT(class_id,user_id) DO UPDATE SET member_role='student'", [classRow.id, row.id]);
      await client.query(`
        INSERT INTO portfolios(assignment_id,student_id,status,active_version)
        SELECT id,$1,'drafting','Nháp' FROM assignments WHERE class_id=$2 AND status='published'
        ON CONFLICT(assignment_id,student_id) DO NOTHING
      `, [row.id, classRow.id]);
      await client.query(`
        INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by)
        SELECT p.id,$2::jsonb,$1 FROM portfolios p
        WHERE p.student_id=$1 AND p.assignment_id IN (SELECT id FROM assignments WHERE class_id=$3)
        ON CONFLICT(portfolio_id) DO NOTHING
      `, [row.id, JSON.stringify(emptyDraft()), classRow.id]);
    }
    await client.query('COMMIT');
    res.status(201).json({
      ok: true,
      credentials: credentials.map(({ passwordHash: _passwordHash, profile: _profile, ...item }) => item),
      classCode: '11A1-KHKT'
    });
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
    if (await bootstrapExtraUsers(req, res)) return;
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
