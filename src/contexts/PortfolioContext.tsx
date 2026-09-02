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
  EvidenceQuote
} from '../types';
import { useAuth } from './AuthContext';
import { usePortfolioStore } from '../app/store/usePortfolioStore';
import { mockDb } from '../services/mockApi/mockDb';

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
  isLoading: boolean;
  dataError: string | null;
  refreshAcademicData: () => Promise<void>;
  updateDraftAxis: (assignmentId: string, axisId: PoeticAxisId, analysisText: string, evidenceQuotes?: EvidenceQuote[]) => void;
  saveDraftImmediately: (assignmentId: string) => void;
  createVersionSnapshot: (assignmentId: string, versionNumber: string, changeSummary: string) => Promise<boolean>;
  addAnchoredFeedback: (feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => void;
  resolveFeedback: (feedbackId: string) => void;
  submitRubric: (evaluation: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => void;
  createAssignment: (newAssignment: Assignment) => void;
  getPortfolioForStudentAndAssignment: (studentId: string, assignmentId: string) => StudentPortfolio;
  resetAllData: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);
const emptyRubric: RubricMatrix = { id: 'rubric-poetics-std', title: 'Rubric', criteria: [] };

async function postAction(payload: unknown) {
  const response = await fetch('/api/academic/action', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
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
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [rubricSubmissions, setRubricSubmissions] = useState<RubricAssessmentSubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: AcademicSnapshot) => {
    mockDb.hydrate(snapshot);
    hydratePortfolios(snapshot.portfolios || {});
    setAssignments(snapshot.assignments || []);
    setLiteratureTexts(snapshot.literatureTexts || []);
    setRubric(snapshot.rubric || emptyRubric);
    setFeedbacks(snapshot.feedbacks || []);
    setRubricSubmissions(snapshot.rubricSubmissions || []);
    setAuditLogs(snapshot.auditLogs || []);
  }, [hydratePortfolios]);

  const refreshAcademicData = useCallback(async () => {
    if (!currentUser.id) return;
    setIsLoading(true); setDataError(null);
    try {
      const response = await fetch('/api/academic/snapshot', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data?.snapshot) throw new Error(data?.message || 'Không thể tải dữ liệu học tập');
      applySnapshot(data.snapshot);
    } catch (error: any) {
      setDataError(error?.message || 'Không thể tải dữ liệu học tập');
    } finally { setIsLoading(false); }
  }, [applySnapshot, currentUser.id]);

  useEffect(() => { if (currentUser.id) void refreshAcademicData(); else mockDb.reset(); }, [currentUser.id, refreshAcademicData]);

  const getPortfolioForStudentAndAssignment = useCallback((studentId: string, assignmentId: string) =>
    getPortfolio(studentId, assignmentId, studentId === currentUser.id ? currentUser.name : 'Học sinh', currentUser.className || ''),
    [currentUser, getPortfolio]);

  const updateDraftAxis = (assignmentId: string, axisId: PoeticAxisId, analysisText: string, evidenceQuotes?: EvidenceQuote[]) =>
    updateDraft(currentUser.id, assignmentId, axisId, analysisText, evidenceQuotes);

  const saveDraftImmediately = (assignmentId: string) => { void manualSaveDraft(currentUser.id, assignmentId); };

  const createVersionSnapshot = async (assignmentId: string, versionNumber: string, changeSummary: string) => {
    const ok = await createSnapshot(currentUser.id, assignmentId, versionNumber, changeSummary, currentUser.name);
    if (ok) void refreshAcademicData();
    return ok;
  };

  const addAnchoredFeedback = (feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'resolved'>) => {
    const optimistic: FeedbackItem = { ...feedbackData, id:`pending-${Date.now()}`, createdAt:new Date().toISOString(), resolved:false };
    setFeedbacks(previous => [optimistic, ...previous]);
    void postAction({ action:'add_feedback', ...feedbackData }).then(() => refreshAcademicData()).catch(() => setFeedbacks(previous => previous.filter(item => item.id !== optimistic.id)));
  };

  const resolveFeedback = (feedbackId: string) => {
    setFeedbacks(previous => previous.map(item => item.id === feedbackId ? { ...item, resolved:true } : item));
    void postAction({ action:'resolve_feedback', feedbackId }).then(() => refreshAcademicData()).catch(() => refreshAcademicData());
  };

  const submitRubric = (evaluation: Omit<RubricAssessmentSubmission, 'id' | 'submittedAt'>) => {
    void postAction({ action:'submit_rubric', ...evaluation }).then(() => refreshAcademicData()).catch(() => refreshAcademicData());
  };

  const createAssignment = (newAssignment: Assignment) => {
    setAssignments(previous => [newAssignment, ...previous.filter(item => item.id !== newAssignment.id)]);
    void postAction({ action:'create_assignment', ...newAssignment }).then(() => refreshAcademicData()).catch(() => refreshAcademicData());
  };

  const resetAllData = () => { void refreshAcademicData(); };

  return <PortfolioContext.Provider value={{
    portfolios, assignments, literatureTexts, rubric, feedbacks, rubricSubmissions, auditLogs,
    autosaveStatus, lastSavedTime:lastSavedTime || null, isLoading, dataError, refreshAcademicData,
    updateDraftAxis, saveDraftImmediately, createVersionSnapshot, addAnchoredFeedback, resolveFeedback,
    submitRubric, createAssignment, getPortfolioForStudentAndAssignment, resetAllData
  }}>{children}</PortfolioContext.Provider>;
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return context;
};
