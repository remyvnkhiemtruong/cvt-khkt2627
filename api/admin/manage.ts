/// <reference types="node" />
import { randomBytes, scryptSync } from 'node:crypto';
import { assertSameOrigin, authenticate, body, send } from '../auth/auth.js';
import { emptyDraft } from '../_lib/academic-v3.js';
import { getPool } from '../_lib/db.js';

const allowedRoles = ['student', 'teacher', 'peer', 'researcher', 'admin', 'ai'];
const allowedStatus = ['active', 'locked'];
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hash = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

async function audit(p: any, user: any, action: string, targetType: string, targetId: string, before: any, after: any, req: any) {
  const ip = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim().slice(0, 100);
  await p.query(`
    INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, before_json, after_json, ip_address)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
  `, [user.id, user.role, action, targetType, targetId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, ip]);
}

const safeError = (code: string) => {
  if (code === 'CSRF_ORIGIN_MISMATCH') return 'Yêu cầu không hợp lệ.';
  if (code === 'SELF_LOCKOUT_BLOCKED') return 'Không thể tự hạ quyền hoặc khóa tài khoản admin đang dùng.';
  if (code === 'ROLE_MISMATCH') return 'Vai trò tài khoản không khớp vai trò thành viên lớp.';
  if (code.includes('NOT_FOUND')) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (code.startsWith('INVALID') || code === 'VALIDATION_ERROR') return 'Dữ liệu quản trị không hợp lệ.';
  return 'Không thể hoàn tất thao tác quản trị.';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  try {
    assertSameOrigin(req);
    const user = await authenticate(req);
    if (!user) return send(res, 401, { code: 'UNAUTHENTICATED' });
    if (user.role !== 'admin') return send(res, 403, { code: 'FORBIDDEN' });

    const pool = await getPool();
    const input = body(req);
    const action = String(input.action || '');

    if (action === 'create_user') {
      const email = String(input.email || '').trim().toLowerCase().slice(0, 240);
      const name = String(input.name || '').trim().slice(0, 160);
      const role = String(input.role || 'student');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || !allowedRoles.includes(role)) {
        return send(res, 400, { code: 'VALIDATION_ERROR', message: safeError('VALIDATION_ERROR') });
      }
      const temp = `HTNV-${randomBytes(9).toString('base64url')}!9`;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(`
          INSERT INTO app_users(email,name,role,password_hash,must_change_password,account_status)
          VALUES($1,$2,$3,$4,true,'active')
          RETURNING id,email,name,role,account_status,must_change_password,created_at,last_login
        `, [email, name, role, hash(temp)]);
        await audit(client, user, 'ADMIN_CREATE_USER', 'user', result.rows[0].id, null, { role, accountStatus: 'active', mustChangePassword: true }, req);
        await client.query('COMMIT');
        return send(res, 201, { user: result.rows[0], temporaryPassword: temp });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    if (action === 'update_user') {
      const targetId = String(input.userId || '');
      if (!uuidRe.test(targetId)) return send(res, 400, { code: 'VALIDATION_ERROR', message: safeError('VALIDATION_ERROR') });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const beforeResult = await client.query(`
          SELECT id,role,account_status,must_change_password FROM app_users WHERE id=$1 FOR UPDATE
        `, [targetId]);
        const before = beforeResult.rows[0];
        if (!before) {
          await client.query('ROLLBACK');
          return send(res, 404, { code: 'USER_NOT_FOUND', message: safeError('USER_NOT_FOUND') });
        }
        const role = String(input.role || before.role);
        const status = String(input.accountStatus || before.account_status);
        if (!allowedRoles.includes(role) || !allowedStatus.includes(status)) {
          await client.query('ROLLBACK');
          return send(res, 400, { code: 'INVALID_USER_STATE', message: safeError('INVALID_USER_STATE') });
        }
        if (targetId === user.id && (role !== 'admin' || status !== 'active')) {
          await client.query('ROLLBACK');
          return send(res, 400, { code: 'SELF_LOCKOUT_BLOCKED', message: safeError('SELF_LOCKOUT_BLOCKED') });
        }
        const result = await client.query(`
          UPDATE app_users SET role=$2,account_status=$3,updated_at=now() WHERE id=$1
          RETURNING id,email,name,role,account_status,must_change_password,created_at,last_login
        `, [targetId, role, status]);
        if (role !== before.role) {
          if (role === 'student' || role === 'teacher') {
            await client.query('UPDATE class_members SET member_role=$2 WHERE user_id=$1', [targetId, role]);
          } else {
            await client.query('DELETE FROM class_members WHERE user_id=$1', [targetId]);
          }
        }
        await audit(client, user, 'ADMIN_UPDATE_USER', 'user', targetId,
          { role: before.role, accountStatus: before.account_status, mustChangePassword: before.must_change_password },
          { role, accountStatus: status, mustChangePassword: result.rows[0].must_change_password }, req);
        await client.query('COMMIT');
        return send(res, 200, { user: result.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    if (action === 'reset_password') {
      const targetId = String(input.userId || '');
      if (!uuidRe.test(targetId)) return send(res, 400, { code: 'VALIDATION_ERROR', message: safeError('VALIDATION_ERROR') });
      const temp = `HTNV-${randomBytes(9).toString('base64url')}!9`;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const beforeResult = await client.query('SELECT id,role,account_status,must_change_password FROM app_users WHERE id=$1 FOR UPDATE', [targetId]);
        if (!beforeResult.rows[0]) {
          await client.query('ROLLBACK');
          return send(res, 404, { code: 'USER_NOT_FOUND', message: safeError('USER_NOT_FOUND') });
        }
        await client.query(`
          UPDATE app_users SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1
        `, [targetId, hash(temp)]);
        await audit(client, user, 'ADMIN_RESET_PASSWORD', 'user', targetId,
          { mustChangePassword: beforeResult.rows[0].must_change_password }, { mustChangePassword: true }, req);
        await client.query('COMMIT');
        return send(res, 200, { temporaryPassword: temp, message: 'Mật khẩu tạm chỉ hiển thị một lần.' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    if (action === 'create_class') {
      const code = String(input.code || '').trim().toUpperCase().slice(0, 30);
      const name = String(input.name || '').trim().slice(0, 120);
      const schoolYear = String(input.schoolYear || '2026-2027').trim().slice(0, 20);
      if (!/^[A-Z0-9_-]{1,30}$/.test(code) || !name) return send(res, 400, { code: 'VALIDATION_ERROR', message: safeError('VALIDATION_ERROR') });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const before = (await client.query('SELECT id,code,school_year FROM classes WHERE code=$1 FOR UPDATE', [code])).rows[0] || null;
        const result = await client.query(`
          INSERT INTO classes(code,name,school_year,created_by)
          VALUES($1,$2,$3,$4)
          ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,school_year=EXCLUDED.school_year,updated_at=now()
          RETURNING *
        `, [code, name, schoolYear, user.id]);
        await audit(client, user, 'ADMIN_SAVE_CLASS', 'class', result.rows[0].id,
          before ? { code: before.code, schoolYear: before.school_year } : null,
          { code, schoolYear }, req);
        await client.query('COMMIT');
        return send(res, 200, { class: result.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    if (action === 'assign_member') {
      const classCode = String(input.classCode || '').trim().toUpperCase().slice(0, 30);
      const targetId = String(input.userId || '');
      const memberRole = String(input.memberRole || 'student');
      if (!uuidRe.test(targetId) || !['student', 'teacher'].includes(memberRole)) {
        return send(res, 400, { code: 'INVALID_MEMBER_ROLE', message: safeError('INVALID_MEMBER_ROLE') });
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const targetUser = (await client.query('SELECT id,role,account_status FROM app_users WHERE id=$1 FOR UPDATE', [targetId])).rows[0];
        if (!targetUser) {
          await client.query('ROLLBACK');
          return send(res, 404, { code: 'USER_NOT_FOUND', message: safeError('USER_NOT_FOUND') });
        }
        if (targetUser.account_status !== 'active' || targetUser.role !== memberRole) {
          await client.query('ROLLBACK');
          return send(res, 400, { code: 'ROLE_MISMATCH', message: safeError('ROLE_MISMATCH') });
        }
        const classRow = (await client.query('SELECT id FROM classes WHERE code=$1 FOR UPDATE', [classCode])).rows[0];
        if (!classRow) {
          await client.query('ROLLBACK');
          return send(res, 404, { code: 'CLASS_NOT_FOUND', message: safeError('CLASS_NOT_FOUND') });
        }
        await client.query(`
          INSERT INTO class_members(class_id,user_id,member_role)
          VALUES($1,$2,$3)
          ON CONFLICT(class_id,user_id) DO UPDATE SET member_role=EXCLUDED.member_role
        `, [classRow.id, targetId, memberRole]);

        if (memberRole === 'student') {
          await client.query(`
            INSERT INTO portfolios(assignment_id,student_id)
            SELECT a.id,$1 FROM assignments a WHERE a.class_id=$2 AND a.status='published'
            ON CONFLICT(assignment_id,student_id) DO NOTHING
          `, [targetId, classRow.id]);
          await client.query(`
            INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by)
            SELECT p.id,$3::jsonb,$1 FROM portfolios p
            WHERE p.student_id=$1 AND p.assignment_id IN (SELECT id FROM assignments WHERE class_id=$2)
            ON CONFLICT(portfolio_id) DO NOTHING
          `, [targetId, classRow.id, JSON.stringify(emptyDraft())]);
        }

        await audit(client, user, 'ADMIN_ASSIGN_CLASS', 'class_member', `${classCode}:${targetId}`, null,
          { classCode, userId: targetId, memberRole }, req);
        await client.query('COMMIT');
        return send(res, 200, { ok: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }

    return send(res, 400, { code: 'UNKNOWN_ACTION', message: 'Thao tác không hợp lệ.' });
  } catch (error: any) {
    const code = String(error?.message || 'ADMIN_ACTION_ERROR');
    if (String(error?.code) === '23505') return send(res, 409, { code: 'DUPLICATE', message: 'Dữ liệu đã tồn tại.' });
    const status = code === 'CSRF_ORIGIN_MISMATCH' || code === 'FORBIDDEN' ? 403 : code.includes('NOT_FOUND') ? 404 : 500;
    console.error('[admin/manage]', { code, status, route: '/api/admin/manage' });
    return send(res, status, { code: status === 500 ? 'ADMIN_ACTION_ERROR' : code, message: safeError(code) });
  }
}
