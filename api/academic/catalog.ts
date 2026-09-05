/// <reference types="node" />
import { randomUUID } from 'node:crypto';
import { assertSameOrigin, authenticate, body, send } from '../auth/auth.js';
import { createRubricVersion, saveLiteratureRevision } from '../_lib/academic-v3.js';

const safeMessage = (code: string) => {
  if (code === 'CSRF_ORIGIN_MISMATCH') return 'Yêu cầu không hợp lệ.';
  if (code === 'SCHEMA_MIGRATION_REQUIRED') return 'Hệ thống đang nâng cấp version ngữ liệu. Vui lòng thử lại sau.';
  if (code === 'LITERATURE_TEXT_NOT_FOUND') return 'Không tìm thấy tác phẩm cần chỉnh sửa.';
  if (code.startsWith('INVALID_') || code === 'VALIDATION_ERROR') return 'Dữ liệu danh mục không hợp lệ.';
  return 'Không thể lưu danh mục.';
};

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  const requestId = String(req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || randomUUID());
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Request-Id', requestId);
  if (req.method !== 'POST') return send(res, 405, { code: 'METHOD_NOT_ALLOWED' });

  try {
    assertSameOrigin(req);
    const user = await authenticate(req);
    if (!user) return send(res, 401, { code: 'UNAUTHENTICATED' });
    if (!['teacher', 'admin'].includes(user.role)) return send(res, 403, { code: 'FORBIDDEN' });
    const input = body(req);
    const action = String(input.action || '');
    const result = action === 'save_literature'
      ? await saveLiteratureRevision(user, input, req)
      : action === 'create_rubric_version'
        ? await createRubricVersion(user, input, req)
        : null;
    if (!result) return send(res, 400, { code: 'UNKNOWN_ACTION', message: 'Thao tác không hợp lệ.' });
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return send(res, 200, result);
  } catch (error: any) {
    const code = String(error?.message || 'CATALOG_ERROR');
    const status = code === 'CSRF_ORIGIN_MISMATCH' || code === 'FORBIDDEN' ? 403
      : code.includes('NOT_FOUND') ? 404
      : code.startsWith('INVALID_') || code === 'VALIDATION_ERROR' || code === 'SCHEMA_MIGRATION_REQUIRED' ? 400
      : 500;
    console.error('[academic/catalog]', { requestId, code, status, route: '/api/academic/catalog', durationMs: Date.now() - startedAt });
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return send(res, status, { code, message: safeMessage(code), requestId });
  }
}
