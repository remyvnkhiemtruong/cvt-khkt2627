import { randomBytes, scryptSync } from 'node:crypto';
import { assertSameOrigin, authenticate, body, send, setTemporaryPassword } from '../auth/auth.js';
import { emptyDraft, ensureAcademicSchema } from '../_lib/academic.js';
import { getPool } from '../_lib/db.js';

const allowedRoles = ['student', 'teacher', 'peer', 'researcher', 'admin', 'ai'];
const allowedStatus = ['active', 'locked'];

const hash = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

async function audit(p: any, user: any, action: string, targetType: string, targetId: string, before: any, after: any, req: any) {
  const ip = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  await p.query(`
    INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, before_json, after_json, ip_address)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
  `, [user.id, user.role, action, targetType, targetId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, ip]);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  try {
    assertSameOrigin(req);
    const user = await authenticate(req);
    if (!user) return send(res, 401, { code: 'UNAUTHENTICATED' });
    if (user.role !== 'admin') return send(res, 403, { code: 'FORBIDDEN' });

    await ensureAcademicSchema();
    const pool = await getPool();
    const input = body(req);
    const action = String(input.action || '');

    if (action === 'create_user') {
      const email = String(input.email || '').trim().toLowerCase().slice(0, 240);
      const name = String(input.name || '').trim().slice(0, 160);
      const role = String(input.role || 'student');
      if (!email.includes('@') || !name || !allowedRoles.includes(role)) return send(res, 400, { code: 'VALIDATION_ERROR' });
      const temp = `CVT-${randomBytes(8).toString('base64url')}!9`;
      const result = await pool.query(`
        INSERT INTO app_users(email, name, role, password_hash, must_change_password, account_status)
        VALUES($1, $2, $3, $4, true, 'active')
        RETURNING id, email, name, role, account_status, must_change_password, created_at, last_login
      `, [email, name, role, hash(temp)]);
      await audit(pool, user, 'ADMIN_CREATE_USER', 'user', result.rows[0].id, null, { email, name, role }, req);
      return send(res, 201, { user: result.rows[0], temporaryPassword: temp });
    }

    if (action === 'update_user') {
      const targetId = String(input.userId || '');
      const beforeResult = await pool.query(`
        SELECT id, email, name, role, account_status, must_change_password
        FROM app_users WHERE id = $1
      `, [targetId]);
      const before = beforeResult.rows[0];
      if (!before) return send(res, 404, { code: 'USER_NOT_FOUND' });

      const role = String(input.role || before.role);
      const status = String(input.accountStatus || before.account_status);
      if (!allowedRoles.includes(role) || !allowedStatus.includes(status)) return send(res, 400, { code: 'INVALID_USER_STATE' });
      if (targetId === user.id && (role !== 'admin' || status !== 'active')) {
        return send(res, 400, { code: 'SELF_LOCKOUT_BLOCKED', message: 'Không thể tự hạ quyền hoặc khóa tài khoản admin đang dùng.' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Update user
        const result = await client.query(`
          UPDATE app_users SET role = $2, account_status = $3, updated_at = now()
          WHERE id = $1
          RETURNING id, email, name, role, account_status, must_change_password, created_at, last_login
        `, [targetId, role, status]);

        // If role changed between student and teacher, reconcile class_members
        if (role !== before.role) {
          if (role === 'student' || role === 'teacher') {
            await client.query(`
              UPDATE class_members SET member_role = $2 WHERE user_id = $1
            `, [targetId, role]);
          } else {
            await client.query(`
              DELETE FROM class_members WHERE user_id = $1
            `, [targetId]);
          }
        }

        await audit(client, user, 'ADMIN_UPDATE_USER', 'user', targetId, before, result.rows[0], req);
        await client.query('COMMIT');
        return send(res, 200, { user: result.rows[0] });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (action === 'reset_password') {
      const targetId = String(input.userId || '');
      const beforeResult = await pool.query(`
        SELECT id, email, name, role, account_status, must_change_password
        FROM app_users WHERE id = $1
      `, [targetId]);
      if (!beforeResult.rows[0]) return send(res, 404, { code: 'USER_NOT_FOUND' });
      const temp = `CVT-${randomBytes(8).toString('base64url')}!9`;
      if (!await setTemporaryPassword(targetId, temp)) return send(res, 404, { code: 'USER_NOT_FOUND' });
      await audit(pool, user, 'ADMIN_RESET_PASSWORD', 'user', targetId, beforeResult.rows[0], { must_change_password: true }, req);
      return send(res, 200, { temporaryPassword: temp, message: 'Mật khẩu tạm chỉ hiển thị một lần.' });
    }

    if (action === 'create_class') {
      const code = String(input.code || '').trim().toUpperCase().slice(0, 30);
      const name = String(input.name || '').trim().slice(0, 120);
      const schoolYear = String(input.schoolYear || '2026-2027').trim().slice(0, 20);
      if (!code || !name) return send(res, 400, { code: 'VALIDATION_ERROR' });
      const result = await pool.query(`
        INSERT INTO classes(code, name, school_year, created_by)
        VALUES($1, $2, $3, $4)
        ON CONFLICT(code)
        DO UPDATE SET name = EXCLUDED.name, school_year = EXCLUDED.school_year, updated_at = now()
        RETURNING *
      `, [code, name, schoolYear, user.id]);
      await audit(pool, user, 'ADMIN_SAVE_CLASS', 'class', result.rows[0].id, null, { code, name, schoolYear }, req);
      return send(res, 200, { class: result.rows[0] });
    }

    if (action === 'assign_member') {
      const classCode = String(input.classCode || '').trim().toUpperCase();
      const targetId = String(input.userId || '');
      const memberRole = String(input.memberRole || 'student');
      if (!['student', 'teacher'].includes(memberRole)) return send(res, 400, { code: 'INVALID_MEMBER_ROLE' });

      // Verify target user exists and role matches memberRole
      const targetUserRes = await pool.query('SELECT id, role, account_status FROM app_users WHERE id = $1', [targetId]);
      const targetUser = targetUserRes.rows[0];
      if (!targetUser) return send(res, 404, { code: 'USER_NOT_FOUND' });
      if (targetUser.role !== memberRole) {
        return send(res, 400, {
          code: 'ROLE_MISMATCH',
          message: `Vai trò của người dùng là '${targetUser.role}', không khớp với vai trò gán vào lớp '${memberRole}'.`
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const classRes = await client.query('SELECT id FROM classes WHERE code = $1', [classCode]);
        if (!classRes.rows[0]) {
          await client.query('ROLLBACK');
          return send(res, 404, { code: 'CLASS_NOT_FOUND' });
        }
        const classId = classRes.rows[0].id;

        // Insert / update class member
        await client.query(`
          INSERT INTO class_members(class_id, user_id, member_role)
          VALUES($1, $2, $3)
          ON CONFLICT(class_id, user_id)
          DO UPDATE SET member_role = EXCLUDED.member_role
        `, [classId, targetId, memberRole]);

        // If student, create portfolios AND drafts in the same transaction
        if (memberRole === 'student') {
          await client.query(`
            INSERT INTO portfolios(assignment_id, student_id)
            SELECT a.id, $1 FROM assignments a WHERE a.class_id = $2 AND a.status = 'published'
            ON CONFLICT (assignment_id, student_id) DO NOTHING
          `, [targetId, classId]);

          await client.query(`
            INSERT INTO portfolio_drafts(portfolio_id, content_json, updated_by)
            SELECT p.id, $3::jsonb, $1
            FROM portfolios p
            WHERE p.student_id = $1 AND p.assignment_id IN (SELECT id FROM assignments WHERE class_id = $2)
            ON CONFLICT (portfolio_id) DO NOTHING
          `, [targetId, classId, JSON.stringify(emptyDraft())]);
        }

        await audit(client, user, 'ADMIN_ASSIGN_CLASS', 'class_member', `${classCode}:${targetId}`, null, { classCode, userId: targetId, memberRole }, req);
        await client.query('COMMIT');
        return send(res, 200, { ok: true });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    return send(res, 400, { code: 'UNKNOWN_ACTION' });
  } catch (error: any) {
    const code = String(error?.message || 'ADMIN_ACTION_ERROR');
    if (String(error?.code) === '23505') return send(res, 409, { code: 'DUPLICATE', message: 'Email hoặc dữ liệu đã tồn tại.' });
    return send(res, code === 'CSRF_ORIGIN_MISMATCH' ? 403 : 500, { code, message: code });
  }
}
