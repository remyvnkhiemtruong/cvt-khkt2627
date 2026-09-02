export type UserRole = 'student' | 'teacher' | 'peer' | 'admin' | 'researcher' | 'ai';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  className?: string;
  assignedPeerRevieweeId?: string;
  mustChangePassword?: boolean;
  accountStatus?: 'active' | 'locked';
  lastLogin?: string | null;
}

export type PoeticAxisId = 
  | 'plot_situation'
  | 'character_detail'
  | 'narrator_pov'
  | 'space_time'
  | 'language_tone_symbol'
  | 'form_argument';

export interface PoeticAxis {
  id: PoeticAxisId;
  order: number;
  title: string;
  shortName: string;
  description: string;
  guidingQuestions: string[];
  focusKeywords: string[];
  iconName: string;
}

export interface LiteratureText {
  id: string;
  title: string;
  author: string;
  year: string;
  genre: string;
  synopsis: string;
  excerpt: string;
  fullContent: string;
  historicalContext: string;
  tags: string[];
}

export interface EvidenceQuote {
  id: string;
  text: string;
  contextNote?: string;
  pageOrParagraph?: string;
}

export interface PoeticAxisResponse {
  axisId: PoeticAxisId;
  analysisText: string;
  evidenceQuotes: EvidenceQuote[];
  studentNotes?: string;
  conceptTags?: string[];
}

export interface PortfolioVersion {
  id: string;
  versionNumber: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  changeSummary: string;
  responses: Record<PoeticAxisId, PoeticAxisResponse>;
  isFrozen: boolean;
  isSubmitted: boolean;
}

export interface FeedbackItem {
  id: string;
  assignmentId: string;
  studentId: string;
  versionNumber: string;
  axisId: PoeticAxisId;
  selectedSnippet: string;
  comment: string;
  authorId: string;
  authorName: string;
  authorRole: 'teacher' | 'peer' | 'ai';
  createdAt: string;
  resolved: boolean;
}

export interface RubricLevel {
  level: 1 | 2 | 3 | 4;
  label: 'Chưa đạt' | 'Đạt' | 'Khá' | 'Xuất sắc';
  score: number;
  description: string;
  observableIndicators: string[];
}

export interface RubricCriterion {
  id: string;
  axisId: PoeticAxisId;
  title: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricMatrix {
  id: string;
  title: string;
  criteria: RubricCriterion[];
}

export interface RubricAssessmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  versionNumber: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'student' | 'peer' | 'teacher';
  criterionScores: Record<string, { level: number; score: number; note: string }>;
  overallFeedback: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  textId: string;
  classId: string;
  assignedDate: string;
  deadline: string;
  difficulty: 'Cơ bản' | 'Nâng cao' | 'Chuyên sâu';
  targetAxes: PoeticAxisId[];
  prompt: string;
  guidingSteps: string[];
  rubricId: string;
  starterTemplate?: Partial<Record<PoeticAxisId, string>>;
}

export interface StudentPortfolio {
  id: string;
  dbId?: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  className: string;
  currentDraft: Record<PoeticAxisId, PoeticAxisResponse>;
  lastAutosavedAt: string;
  versions: PortfolioVersion[];
  currentActiveVersion: string;
  status: 'drafting' | 'v1_submitted' | 'feedback_received' | 'v2_in_revision' | 'completed';
}

export interface AiReviewRequest {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  version_number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  prompt: string;
  response: string;
  teacher_review_status: 'pending' | 'approved' | 'revised' | 'rejected';
  teacher_note: string;
  created_at: string;
  completed_at?: string | null;
}

export interface AcademicClass {
  id: string;
  code: string;
  name: string;
  school_year: string;
  student_count?: number;
}

export interface AcademicSnapshot {
  assignments: Assignment[];
  literatureTexts: LiteratureText[];
  rubric: RubricMatrix;
  portfolios: Record<string, StudentPortfolio>;
  feedbacks: FeedbackItem[];
  rubricSubmissions: RubricAssessmentSubmission[];
  auditLogs: AuditLog[];
  classes?: AcademicClass[];
  users?: User[];
  aiReviews?: AiReviewRequest[];
}

export interface TaskRecommendation {
  nextAssignmentId: string;
  assignmentTitle: string;
  targetAxisId: PoeticAxisId;
  targetAxisTitle: string;
  rationale: string;
  expectedGain: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  ipAddress: string;
}
