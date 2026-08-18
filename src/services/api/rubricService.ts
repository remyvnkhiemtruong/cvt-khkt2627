import type { RubricMatrix, RubricAssessmentSubmission } from '../../types';
import { mockDb } from '../mockApi/mockDb';

export const rubricService = {
  async getRubric(): Promise<RubricMatrix> {
    await new Promise(r => setTimeout(r, 30));
    return mockDb.getRubric();
  },

  async getSubmissions(assignmentId?: string, studentId?: string): Promise<RubricAssessmentSubmission[]> {
    await new Promise(r => setTimeout(r, 40));
    let list = mockDb.getRubricSubmissions();
    if (assignmentId) list = list.filter(s => s.assignmentId === assignmentId);
    if (studentId) list = list.filter(s => s.studentId === studentId);
    return list;
  },

  async submitRubricEvaluation(sub: RubricAssessmentSubmission): Promise<void> {
    await new Promise(r => setTimeout(r, 70));
    mockDb.saveRubricSubmission(sub);
  }
};
