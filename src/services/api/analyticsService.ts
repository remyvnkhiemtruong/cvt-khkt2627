import type { AuditLog } from '../../types';
import { mockDb } from '../mockApi/mockDb';

export const analyticsService = {
  async getAuditLogs(): Promise<AuditLog[]> {
    await new Promise(r => setTimeout(r, 40));
    return mockDb.getAuditLogs();
  },

  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const fullLog: AuditLog = {
      ...log,
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    mockDb.saveAuditLog(fullLog);
  }
};
