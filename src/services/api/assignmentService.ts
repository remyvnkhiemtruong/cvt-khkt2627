import type { Assignment, LiteratureText } from '../../types';
import { mockDb } from '../mockApi/mockDb';

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    // Simulated network latency
    await new Promise(r => setTimeout(r, 60));
    return mockDb.getAssignments();
  },

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    await new Promise(r => setTimeout(r, 40));
    return mockDb.getAssignments().find(a => a.id === id);
  },

  async createAssignment(assignment: Assignment): Promise<Assignment> {
    await new Promise(r => setTimeout(r, 100));
    mockDb.saveAssignment(assignment);
    return assignment;
  },

  async getLiteratureTexts(): Promise<LiteratureText[]> {
    await new Promise(r => setTimeout(r, 40));
    return mockDb.getLiteratureTexts();
  },

  async getTextById(id: string): Promise<LiteratureText | undefined> {
    await new Promise(r => setTimeout(r, 30));
    return mockDb.getLiteratureTexts().find(t => t.id === id);
  }
};
