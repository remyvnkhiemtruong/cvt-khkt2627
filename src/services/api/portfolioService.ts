import type { StudentPortfolio, FeedbackItem } from '../../types';
import { mockDb } from '../mockApi/mockDb';

export const portfolioService = {
  async getPortfolios(): Promise<Record<string, StudentPortfolio>> {
    await new Promise(r => setTimeout(r, 50));
    return mockDb.getPortfolios();
  },

  async getPortfolio(studentId: string, assignmentId: string): Promise<StudentPortfolio | undefined> {
    await new Promise(r => setTimeout(r, 40));
    const key = `port-${studentId}-${assignmentId}`;
    return mockDb.getPortfolios()[key];
  },

  async savePortfolio(portfolio: StudentPortfolio): Promise<void> {
    await new Promise(r => setTimeout(r, 60));
    mockDb.savePortfolio(portfolio);
  },

  async getFeedbacks(assignmentId?: string, studentId?: string): Promise<FeedbackItem[]> {
    await new Promise(r => setTimeout(r, 40));
    let list = mockDb.getFeedbacks();
    if (assignmentId) list = list.filter(f => f.assignmentId === assignmentId);
    if (studentId) list = list.filter(f => f.studentId === studentId);
    return list;
  },

  async addFeedback(item: FeedbackItem): Promise<void> {
    await new Promise(r => setTimeout(r, 50));
    mockDb.saveFeedback(item);
  },

  async resolveFeedback(feedbackId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 40));
    const all = mockDb.getFeedbacks();
    const found = all.find(f => f.id === feedbackId);
    if (found) {
      found.resolved = true;
      mockDb.updateFeedback(found);
    }
  }
};
