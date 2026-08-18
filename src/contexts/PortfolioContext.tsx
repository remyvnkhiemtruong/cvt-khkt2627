import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  StudentPortfolio,
  Assignment,
  LiteratureText,
  RubricMatrix,
  FeedbackItem,
  RubricAssessmentSubmission,
  AuditLog,
  PoeticAxisId,
  PortfolioVersion,
  EvidenceQuote
} from '../types';
import {
  MOCK_ASSIGNMENTS,
  LITERATURE_TEXTS,
  DEFAULT_RUBRIC,
  MOCK_STUDENT_PORTFOLIOS,
  MOCK_FEEDBACK_ITEMS,
  MOCK_RUBRIC_SUBMISSIONS,
  MOCK_AUDIT_LOGS,
  POETIC_AXES
} from '../data/seedData';
import { useAuth } from './AuthContext';

interface PortfolioContextType {
  portfolios: Record<string, StudentPortfolio>;
  assignments: Assignment[];
  literatureTexts: LiteratureText[];
  rubric: RubricMatrix;
  feedbacks: FeedbackItem[];
  rubricSubmissions: RubricAssessmentSubmission[];
  auditLogs: AuditLog[];
  autosaveStatus: 'saved' | 'saving' | 'dirty';
  lastSavedTime: string | null;

  // Actions
  updateDraftAxis: (assignmentId: string, axisId: PoeticAxisId, analysisText: string, evidenceQuotes?: EvidenceQuote[]) => void;
  saveDraftImmediately: (assignmentId: string) => void;
  createVersionSnapshot: (assignmentId: string, versionNumber: string, changeSummary: string) => boolean;
  addAnchoredFeedback: (feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => void;
  resolveFeedback: (feedbackId: string) => void;
  submitRubric: (evaluation: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => void;
  createAssignment: (newAssignment: Assignment) => void;
  getPortfolioForStudentAndAssignment: (studentId: string, assignmentId: string) => StudentPortfolio;
  resetAllData: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [portfolios, setPortfolios] = useState<Record<string, StudentPortfolio>>(() => {
    const saved = localStorage.getItem('poetic_portfolios');
    return saved ? JSON.parse(saved) : MOCK_STUDENT_PORTFOLIOS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('poetic_assignments');
    return saved ? JSON.parse(saved) : MOCK_ASSIGNMENTS;
  });

  const [literatureTexts] = useState<LiteratureText[]>(LITERATURE_TEXTS);
  const [rubric] = useState<RubricMatrix>(DEFAULT_RUBRIC);

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    const saved = localStorage.getItem('poetic_feedbacks');
    return saved ? JSON.parse(saved) : MOCK_FEEDBACK_ITEMS;
  });

  const [rubricSubmissions, setRubricSubmissions] = useState<RubricAssessmentSubmission[]>(() => {
    const saved = localStorage.getItem('poetic_rubric_subs');
    return saved ? JSON.parse(saved) : MOCK_RUBRIC_SUBMISSIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('poetic_audit_logs');
    return saved ? JSON.parse(saved) : MOCK_AUDIT_LOGS;
  });

  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>('vừa xong');

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('poetic_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  useEffect(() => {
    localStorage.setItem('poetic_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('poetic_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem('poetic_rubric_subs', JSON.stringify(rubricSubmissions));
  }, [rubricSubmissions]);

  useEffect(() => {
    localStorage.setItem('poetic_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = useCallback((action: string, target: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      target,
      ipAddress: '127.0.0.1 (Local)'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Helper to ensure a portfolio exists for student & assignment
  const getPortfolioForStudentAndAssignment = useCallback((studentId: string, assignmentId: string): StudentPortfolio => {
    const key = `port-${studentId}-${assignmentId}`;
    if (portfolios[key]) {
      return portfolios[key];
    }

    // Default template draft
    const initialDraft: Record<PoeticAxisId, any> = {} as any;
    POETIC_AXES.forEach(axis => {
      initialDraft[axis.id] = {
        axisId: axis.id,
        analysisText: '',
        evidenceQuotes: []
      };
    });

    const newPort: StudentPortfolio = {
      id: key,
      assignmentId,
      studentId,
      studentName: currentUser.name,
      className: currentUser.className || '11A1',
      lastAutosavedAt: new Date().toISOString(),
      currentActiveVersion: 'v1.0 (nháp)',
      status: 'drafting',
      currentDraft: initialDraft,
      versions: []
    };

    return newPort;
  }, [portfolios, currentUser]);

  const updateDraftAxis = (
    assignmentId: string,
    axisId: PoeticAxisId,
    analysisText: string,
    evidenceQuotes?: EvidenceQuote[]
  ) => {
    setAutosaveStatus('dirty');
    const portKey = `port-${currentUser.id}-${assignmentId}`;
    const port = getPortfolioForStudentAndAssignment(currentUser.id, assignmentId);

    const updatedPort: StudentPortfolio = {
      ...port,
      lastAutosavedAt: new Date().toISOString(),
      currentDraft: {
        ...port.currentDraft,
        [axisId]: {
          axisId,
          analysisText,
          evidenceQuotes: evidenceQuotes || port.currentDraft[axisId]?.evidenceQuotes || []
        }
      }
    };

    setPortfolios(prev => ({
      ...prev,
      [portKey]: updatedPort
    }));

    // Trigger debounced autosave simulation
    setTimeout(() => {
      setAutosaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
    }, 600);
  };

  const saveDraftImmediately = (assignmentId: string) => {
    setAutosaveStatus('saving');
    setTimeout(() => {
      setAutosaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      addAuditLog('MANUAL_SAVE_DRAFT', `Lưu thủ công hồ sơ bài [${assignmentId}]`);
    }, 300);
  };

  const createVersionSnapshot = (
    assignmentId: string,
    versionNumber: string,
    changeSummary: string
  ): boolean => {
    const portKey = `port-${currentUser.id}-${assignmentId}`;
    const port = getPortfolioForStudentAndAssignment(currentUser.id, assignmentId);

    // Deep copy currentDraft to freeze as snapshot
    const frozenResponses = JSON.parse(JSON.stringify(port.currentDraft));

    const newVersion: PortfolioVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: versionNumber.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      authorName: currentUser.name,
      changeSummary: changeSummary.trim(),
      responses: frozenResponses,
      isFrozen: true,
      isSubmitted: true
    };

    const updatedVersions = [...port.versions, newVersion];

    const updatedPort: StudentPortfolio = {
      ...port,
      currentActiveVersion: newVersion.versionNumber,
      status: versionNumber.startsWith('v1') ? 'v1_submitted' : 'v2_in_revision',
      versions: updatedVersions
    };

    setPortfolios(prev => ({
      ...prev,
      [portKey]: updatedPort
    }));

    addAuditLog('CREATE_VERSION_SNAPSHOT', `Đóng băng phiên bản [${versionNumber}] cho bài [${assignmentId}]`);
    return true;
  };

  const addAnchoredFeedback = (feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => {
    const newFb: FeedbackItem = {
      ...feedbackData,
      id: 'fb-' + Date.now(),
      createdAt: new Date().toISOString(),
      resolved: false
    };

    setFeedbacks(prev => [newFb, ...prev]);
    addAuditLog('ADD_ANCHORED_FEEDBACK', `Neo nhận xét vào phiên bản [${feedbackData.versionNumber}] của học sinh [${feedbackData.studentId}]`);
  };

  const resolveFeedback = (feedbackId: string) => {
    setFeedbacks(prev =>
      prev.map(f => (f.id === feedbackId ? { ...f, resolved: true } : f))
    );
    addAuditLog('RESOLVE_FEEDBACK', `Đánh dấu đã tiếp thu nhận xét [${feedbackId}]`);
  };

  const submitRubric = (evalData: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => {
    const newSub: RubricAssessmentSubmission = {
      ...evalData,
      id: 'sub-' + Date.now(),
      submittedAt: new Date().toISOString()
    };

    setRubricSubmissions(prev => [newSub, ...prev]);
    addAuditLog('SUBMIT_RUBRIC_EVALUATION', `Chấm điểm Rubric cho học sinh [${evalData.studentId}] phiên bản [${evalData.versionNumber}] với tổng điểm ${evalData.totalScore}/${evalData.maxScore}`);
  };

  const createAssignment = (newAssignment: Assignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
    addAuditLog('CREATE_ASSIGNMENT', `Tạo mới nhiệm vụ đọc hiểu: [${newAssignment.title}]`);
  };

  const resetAllData = () => {
    localStorage.removeItem('poetic_portfolios');
    localStorage.removeItem('poetic_assignments');
    localStorage.removeItem('poetic_feedbacks');
    localStorage.removeItem('poetic_rubric_subs');
    localStorage.removeItem('poetic_audit_logs');
    setPortfolios(MOCK_STUDENT_PORTFOLIOS);
    setAssignments(MOCK_ASSIGNMENTS);
    setFeedbacks(MOCK_FEEDBACK_ITEMS);
    setRubricSubmissions(MOCK_RUBRIC_SUBMISSIONS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setAutosaveStatus('saved');
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        assignments,
        literatureTexts,
        rubric,
        feedbacks,
        rubricSubmissions,
        auditLogs,
        autosaveStatus,
        lastSavedTime,
        updateDraftAxis,
        saveDraftImmediately,
        createVersionSnapshot,
        addAnchoredFeedback,
        resolveFeedback,
        submitRubric,
        createAssignment,
        getPortfolioForStudentAndAssignment,
        resetAllData
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return context;
};
