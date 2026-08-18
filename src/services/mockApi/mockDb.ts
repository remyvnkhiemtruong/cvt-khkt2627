import type {
  User,
  Assignment,
  LiteratureText,
  RubricMatrix,
  StudentPortfolio,
  FeedbackItem,
  RubricAssessmentSubmission,
  AuditLog
} from '../../types';
import {
  MOCK_USERS,
  MOCK_ASSIGNMENTS,
  LITERATURE_TEXTS,
  DEFAULT_RUBRIC,
  MOCK_STUDENT_PORTFOLIOS,
  MOCK_FEEDBACK_ITEMS,
  MOCK_RUBRIC_SUBMISSIONS,
  MOCK_AUDIT_LOGS
} from '../../data/seedData';

class MockDatabase {
  private usersKey = 'poetic_db_users';
  private assignmentsKey = 'poetic_db_assignments';
  private textsKey = 'poetic_db_texts';
  private rubricsKey = 'poetic_db_rubrics';
  private portfoliosKey = 'poetic_db_portfolios';
  private feedbacksKey = 'poetic_db_feedbacks';
  private rubricSubsKey = 'poetic_db_rubric_subs';
  private auditLogsKey = 'poetic_db_audit_logs';

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(this.assignmentsKey)) {
      localStorage.setItem(this.assignmentsKey, JSON.stringify(MOCK_ASSIGNMENTS));
    }
    if (!localStorage.getItem(this.textsKey)) {
      localStorage.setItem(this.textsKey, JSON.stringify(LITERATURE_TEXTS));
    }
    if (!localStorage.getItem(this.rubricsKey)) {
      localStorage.setItem(this.rubricsKey, JSON.stringify(DEFAULT_RUBRIC));
    }
    if (!localStorage.getItem(this.portfoliosKey)) {
      localStorage.setItem(this.portfoliosKey, JSON.stringify(MOCK_STUDENT_PORTFOLIOS));
    }
    if (!localStorage.getItem(this.feedbacksKey)) {
      localStorage.setItem(this.feedbacksKey, JSON.stringify(MOCK_FEEDBACK_ITEMS));
    }
    if (!localStorage.getItem(this.rubricSubsKey)) {
      localStorage.setItem(this.rubricSubsKey, JSON.stringify(MOCK_RUBRIC_SUBMISSIONS));
    }
    if (!localStorage.getItem(this.auditLogsKey)) {
      localStorage.setItem(this.auditLogsKey, JSON.stringify(MOCK_AUDIT_LOGS));
    }
  }

  public getUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
  }

  public getAssignments(): Assignment[] {
    return JSON.parse(localStorage.getItem(this.assignmentsKey) || '[]');
  }

  public saveAssignment(assignment: Assignment): void {
    const list = this.getAssignments();
    list.unshift(assignment);
    localStorage.setItem(this.assignmentsKey, JSON.stringify(list));
  }

  public getLiteratureTexts(): LiteratureText[] {
    return JSON.parse(localStorage.getItem(this.textsKey) || '[]');
  }

  public getRubric(): RubricMatrix {
    return JSON.parse(localStorage.getItem(this.rubricsKey) || JSON.stringify(DEFAULT_RUBRIC));
  }

  public getPortfolios(): Record<string, StudentPortfolio> {
    return JSON.parse(localStorage.getItem(this.portfoliosKey) || '{}');
  }

  public savePortfolio(portfolio: StudentPortfolio): void {
    const dict = this.getPortfolios();
    dict[portfolio.id] = portfolio;
    localStorage.setItem(this.portfoliosKey, JSON.stringify(dict));
  }

  public getFeedbacks(): FeedbackItem[] {
    return JSON.parse(localStorage.getItem(this.feedbacksKey) || '[]');
  }

  public saveFeedback(item: FeedbackItem): void {
    const list = this.getFeedbacks();
    list.unshift(item);
    localStorage.setItem(this.feedbacksKey, JSON.stringify(list));
  }

  public updateFeedback(item: FeedbackItem): void {
    const list = this.getFeedbacks().map(f => f.id === item.id ? item : f);
    localStorage.setItem(this.feedbacksKey, JSON.stringify(list));
  }

  public getRubricSubmissions(): RubricAssessmentSubmission[] {
    return JSON.parse(localStorage.getItem(this.rubricSubsKey) || '[]');
  }

  public saveRubricSubmission(sub: RubricAssessmentSubmission): void {
    const list = this.getRubricSubmissions();
    list.push(sub);
    localStorage.setItem(this.rubricSubsKey, JSON.stringify(list));
  }

  public getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(this.auditLogsKey) || '[]');
  }

  public saveAuditLog(log: AuditLog): void {
    const list = this.getAuditLogs();
    list.unshift(log);
    localStorage.setItem(this.auditLogsKey, JSON.stringify(list));
  }

  public reset(): void {
    localStorage.removeItem(this.usersKey);
    localStorage.removeItem(this.assignmentsKey);
    localStorage.removeItem(this.textsKey);
    localStorage.removeItem(this.rubricsKey);
    localStorage.removeItem(this.portfoliosKey);
    localStorage.removeItem(this.feedbacksKey);
    localStorage.removeItem(this.rubricSubsKey);
    localStorage.removeItem(this.auditLogsKey);
    this.init();
  }
}

export const mockDb = new MockDatabase();
