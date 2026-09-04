/// <reference types="node" />
import { academicHealth } from './_lib/academic-v2.js';

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  res.setHeader('Cache-Control', 'no-store');
  try {
    const counts = await academicHealth();
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return res.status(200).json({
      ok: true,
      service: 'hoc-tot-ngu-van-api',
      product: 'Học tốt Ngữ Văn',
      version: 'backend-v3',
      academicData: 'postgresql',
      aiFeedbackMode: 'manual-review-queue',
      region: process.env.VERCEL_REGION || 'unknown',
      counts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[health]', {
      route: '/api/health',
      region: process.env.VERCEL_REGION || 'unknown',
      durationMs: Date.now() - startedAt,
      message: error?.message || 'Backend unavailable'
    });
    res.setHeader('Server-Timing', `total;dur=${Date.now() - startedAt}`);
    return res.status(500).json({
      ok: false,
      service: 'hoc-tot-ngu-van-api',
      product: 'Học tốt Ngữ Văn',
      version: 'backend-v3',
      message: error?.message || 'Backend unavailable',
      timestamp: new Date().toISOString()
    });
  }
}
