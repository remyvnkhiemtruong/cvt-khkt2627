import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AcademicSnapshot,
  StudentPortfolio,
  Assignment,
  LiteratureText,
  RubricMatrix,
  FeedbackItem,
  RubricAssessmentSubmission,
  AuditLog,
  PoeticAxisId,
  EvidenceQuote,
  AiReviewRequest
} from '../types';
import { useAuth } from './AuthContext';
import { usePortfolioStore, type CreateSnapshotOptions } from '../app/store/usePortfolioStore';
import { mockDb } from '../services/mockApi/mockDb';

interface PortfolioContextType {
  portfolios: Record<string, StudentPortfolio>;
  assignments: Assignment[];
  literatureTexts: LiteratureText[];
  rubric: RubricMatrix;
  rubrics: Record<string, RubricMatrix>;
  feedbacks: FeedbackItem[];
  rubricSubmissions: RubricAssessmentSubmission[];
  auditLogs: AuditLog[];
  aiReviews: AiReviewRequest[];
  autosaveStatus: 'saved' | 'saving' | 'dirty';
  lastSavedTime: string | null;
  isLoading: boolean;
  dataError: string | null;
  refreshAcademicData: () => Promise<void>;
  updateDraftAxis: (assignmentId: string, axisId: PoeticAxisId, analysisText: string, evidenceQuotes?: EvidenceQuote[]) => void;
  saveDraftImmediately: (assignmentId: string) => void;
  createVersionSnapshot: (assignmentId: string, versionNumber: string, changeSummary: string, options?: CreateSnapshotOptions) => Promise<boolean>;
  addAnchoredFeedback: (feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => Promise<{ ok: boolean; id?: string }>;
  resolveFeedback: (feedbackId: string) => Promise<void>;
  submitRubric: (evaluation: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => Promise<{ ok: boolean; id?: string; totalScore?: number; maxScore?: number }>;
  createAssignment: (newAssignment: Assignment) => Promise<void>;
  getPortfolioForStudentAndAssignment: (studentId: string, assignmentId: string) => StudentPortfolio;
  resetAllData: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);
const emptyRubric: RubricMatrix = { id: 'rubric-poetics-std', title: 'Rubric', criteria: [] };

async function postAction(payload: unknown) {
  const response = await fetch('/api/academic/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || 'Không thể cập nhật dữ liệu');
  return data;
}

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const portfolios = usePortfolioStore(state => state.portfolios);
  const autosaveStatus = usePortfolioStore(state => state.autosaveStatus);
  const lastSavedTime = usePortfolioStore(state => state.lastSavedTime);
  const hydratePortfolios = usePortfolioStore(state => state.hydratePortfolios);
  const updateDraft = usePortfolioStore(state => state.updateDraft);
  const manualSaveDraft = usePortfolioStore(state => state.manualSaveDraft);
  const createSnapshot = usePortfolioStore(state => state.createSnapshot);
  const getPortfolio = usePortfolioStore(state => state.getPortfolio);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [literatureTexts, setLiteratureTexts] = useState<LiteratureText[]>([]);
  const [rubric, setRubric] = useState<RubricMatrix>(emptyRubric);
  const [rubrics, setRubrics] = useState<Record<string, RubricMatrix>>({});
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [rubricSubmissions, setRubricSubmissions] = useState<RubricAssessmentSubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiReviews, setAiReviews] = useState<AiReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: AcademicSnapshot) => {
    mockDb.hydrate(snapshot);
    hydratePortfolios(snapshot.portfolios || {});
    setAssignments(snapshot.assignments || []);
    setLiteratureTexts(snapshot.literatureTexts || []);
    const primaryRubric = snapshot.rubric || emptyRubric;
    setRubric(primaryRubric);
    setRubrics(snapshot.rubrics || (primaryRubric.id ? { [primaryRubric.id]: primaryRubric } : {}));
    setFeedbacks(snapshot.feedbacks || []);
    setRubricSubmissions(snapshot.rubricSubmissions || []);
    setAuditLogs(snapshot.auditLogs || []);
    setAiReviews(snapshot.aiReviews || []);
  }, [hydratePortfolios]);

  const refreshAcademicData = useCallback(async () => {
    if (!currentUser.id) return;
    setIsLoading(true);
    setDataError(null);
    try {
      const response = await fetch('/api/academic/snapshot', { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data?.snapshot) throw new Error(data?.message || 'Không thể tải dữ liệu học tập');
      applySnapshot(data.snapshot);
    } catch (error: unknown) {
      setDataError(error instanceof Error ? error.message : 'Không thể tải dữ liệu học tập');
    } finally {
      setIsLoading(false);
    }
  }, [applySnapshot, currentUser.id]);

  useEffect(() => {
    if (currentUser.id) void refreshAcademicData();
    else mockDb.reset();
  }, [currentUser.id, refreshAcademicData]);

  const getPortfolioForStudentAndAssignment = useCallback(
    (studentId: string, assignmentId: string) => getPortfolio(
      studentId,
      assignmentId,
      studentId === currentUser.id ? currentUser.name : 'Học sinh',
      currentUser.className || ''
    ),
    [currentUser, getPortfolio]
  );

  const updateDraftAxis = (assignmentId: string, axisId: PoeticAxisId, analysisText: string, evidenceQuotes?: EvidenceQuote[]) =>
    updateDraft(currentUser.id, assignmentId, axisId, analysisText, evidenceQuotes);

  const saveDraftImmediately = (assignmentId: string) => {
    void manualSaveDraft(currentUser.id, assignmentId);
  };

  const createVersionSnapshot = async (
    assignmentId: string,
    versionNumber: string,
    changeSummary: string,
    options?: CreateSnapshotOptions
  ) => {
    const ok = await createSnapshot(currentUser.id, assignmentId, versionNumber, changeSummary, currentUser.name, options);
    if (ok) void refreshAcademicData();
    return ok;
  };

  const addAnchoredFeedback = async (feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => {
    const optimistic: FeedbackItem = {
      ...feedbackData,
      id: `pending-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false
    };
    setFeedbacks(previous => [optimistic, ...previous]);
    try {
      const res = await postAction({ action: 'add_feedback', ...feedbackData });
      await refreshAcademicData();
      return { ok: true, id: res.id };
    } catch (error) {
      setFeedbacks(previous => previous.filter(item => item.id !== optimistic.id));
      throw error;
    }
  };

  const resolveFeedback = async (feedbackId: string) => {
    setFeedbacks(previous => previous.map(item => item.id === feedbackId ? { ...item, resolved: true } : item));
    try {
      await postAction({ action: 'resolve_feedback', feedbackId });
      await refreshAcademicData();
    } catch (error) {
      await refreshAcademicData();
      throw error;
    }
  };

  const submitRubric = async (evaluation: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => {
    const res = await postAction({ action: 'submit_rubric', ...evaluation });
    await refreshAcademicData();
    return { ok: true, id: res.id, totalScore: res.totalScore, maxScore: res.maxScore };
  };

  const createAssignment = async (newAssignment: Assignment) => {
    setAssignments(previous => [newAssignment, ...previous.filter(item => item.id !== newAssignment.id)]);
    try {
      await postAction({ action: 'create_assignment', ...newAssignment });
      await refreshAcademicData();
    } catch (error) {
      await refreshAcademicData();
      throw error;
    }
  };

  const resetAllData = () => {
    void refreshAcademicData();
  };

  return <PortfolioContext.Provider value={{
    portfolios,
    assignments,
    literatureTexts,
    rubric,
    rubrics,
    feedbacks,
    rubricSubmissions,
    auditLogs,
    aiReviews,
    autosaveStatus,
    lastSavedTime: lastSavedTime || null,
    isLoading,
    dataError,
    refreshAcademicData,
    updateDraftAxis,
    saveDraftImmediately,
    createVersionSnapshot,
    addAnchoredFeedback,
    resolveFeedback,
    submitRubric,
    createAssignment,
    getPortfolioForStudentAndAssignment,
    resetAllData
  }}>{children}</PortfolioContext.Provider>;
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return context;
};
