import { assertSameOrigin, authenticate, body, send } from '../auth/auth.js';
import { ensureAcademicSchema } from '../_lib/academic.js';
import { getPool } from '../_lib/db.js';

const axes = ['plot_situation', 'character_detail', 'narrator_pov', 'space_time', 'language_tone_symbol', 'form_argument'];
const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || `text-${Date.now()}`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  try {
    assertSameOrigin(req);
    const user = await authenticate(req);
    if (!user) return send(res, 401, { code: 'UNAUTHENTICATED' });
    if (!['teacher', 'admin'].includes(user.role)) return send(res, 403, { code: 'FORBIDDEN' });

    await ensureAcademicSchema();
    const pool = await getPool();
    const input = body(req);
    const action = String(input.action || '');

    if (action === 'save_literature') {
      const title = String(input.title || '').trim().slice(0, 240);
      const author = String(input.author || '').trim().slice(0, 160);
      if (!title || !author) return send(res, 400, { code: 'VALIDATION_ERROR' });
      const publicId = String(input.id || slug(title));
      const result = await pool.query(`
        INSERT INTO literature_texts(public_id, title, author, year_text, genre, synopsis, excerpt, full_content, historical_context, tags, created_by)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT(public_id)
        DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author, year_text = EXCLUDED.year_text,
                      genre = EXCLUDED.genre, synopsis = EXCLUDED.synopsis, excerpt = EXCLUDED.excerpt,
                      full_content = EXCLUDED.full_content, historical_context = EXCLUDED.historical_context,
                      tags = EXCLUDED.tags, updated_at = now()
        RETURNING public_id
      `, [
        publicId, title, author, String(input.year || ''), String(input.genre || ''),
        String(input.synopsis || ''), String(input.excerpt || ''),
        String(input.fullContent || input.excerpt || ''), String(input.historicalContext || ''),
        Array.isArray(input.tags) ? input.tags : [], user.id
      ]);
      await pool.query(`
        INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, after_json)
        VALUES($1, $2, 'SAVE_LITERATURE', 'literature', $3, $4)
      `, [user.id, user.role, publicId, { title, author }]);
      return send(res, 200, { id: result.rows[0].public_id });
    }

    if (action === 'create_rubric_version') {
      const title = String(input.title || '').trim().slice(0, 240);
      const criteria = Array.isArray(input.criteria) ? input.criteria : [];
      if (!title || criteria.length === 0) return send(res, 400, { code: 'VALIDATION_ERROR' });

      // Validate ALL criteria before starting transaction
      for (const c of criteria) {
        const axis = String(c.axisId || c.id || '');
        if (!axes.includes(axis)) {
          return send(res, 400, { code: 'INVALID_AXIS_CRITERIA', message: `Trục thi pháp '${axis}' không hợp lệ.` });
        }
      }

      const publicId = `rubric-${Date.now()}`;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE rubrics SET is_active = false, updated_at = now() WHERE is_active = true');
        const r = await client.query(`
          INSERT INTO rubrics(public_id, title, description, created_by, is_active)
          VALUES($1, $2, $3, $4, true)
          RETURNING id
        `, [publicId, title, String(input.description || ''), user.id]);
        const rubricId = r.rows[0].id;

        for (let i = 0; i < criteria.length; i++) {
          const c = criteria[i];
          const axis = String(c.axisId || c.id || '');
          const levels = Array.isArray(c.levels) ? c.levels : [1, 2, 3, 4].map(level => ({
            level,
            label: ['', 'Chưa đạt', 'Đạt', 'Khá', 'Xuất sắc'][level],
            score: level,
            description: String(c.descriptors?.[level] || ''),
            observableIndicators: []
          }));
          await client.query(`
            INSERT INTO rubric_criteria(rubric_id, public_id, axis_id, title, weight, levels_json, sort_order)
            VALUES($1, $2, $3, $4, $5, $6, $7)
          `, [rubricId, String(c.publicId || `criterion-${axis}`), axis, String(c.title || axis), Number(c.weight || 1), JSON.stringify(levels), i + 1]);
        }

        await client.query(`
          INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, after_json)
          VALUES($1, $2, 'CREATE_RUBRIC_VERSION', 'rubric', $3, $4)
        `, [user.id, user.role, publicId, { title }]);

        await client.query('COMMIT');
        return send(res, 200, { id: publicId });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    return send(res, 400, { code: 'UNKNOWN_ACTION' });
  } catch (error: any) {
    const code = String(error?.message || 'CATALOG_ERROR');
    return send(res, code === 'CSRF_ORIGIN_MISMATCH' ? 403 : 500, { code, message: code });
  }
}
