import { create } from 'zustand';
import type { StudentPortfolio, PoeticAxisId, PortfolioVersion, EvidenceQuote } from '../../types';
import { mockDb } from '../../services/mockApi/mockDb';
import { POETIC_AXES } from '../../data/seedData';

export interface CreateSnapshotOptions {
  submissionKey?: string;
  stage?: 'prediction' | 'initial' | 'revision';
  confidence?: number | null;
  changeSource?: string;
  revisionReason?: string;
  linkedFeedbackIds?: string[];
}

interface PortfolioState {
  portfolios: Record<string, StudentPortfolio>;
  autosaveStatus: 'saved' | 'saving' | 'dirty';
  lastSavedTime: string;
  hydratePortfolios: (portfolios: Record<string, StudentPortfolio>) => void;
  loadPortfolios: () => void;
  getPortfolio: (studentId: string, assignmentId: string, studentName?: string, className?: string) => StudentPortfolio;
  updateDraft: (studentId: string, assignmentId: string, axisId: PoeticAxisId, text: string, quotes?: EvidenceQuote[]) => void;
  manualSaveDraft: (studentId: string, assignmentId: string) => Promise<void>;
  createSnapshot: (studentId: string, assignmentId: string, versionNumber: string, changeSummary: string, authorName: string, options?: CreateSnapshotOptions) => Promise<boolean>;
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

const postAction = async (payload: unknown) => {
  const response = await fetch('/api/academic/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || 'Không thể lưu dữ liệu');
  return data;
};

const blankPortfolio = (studentId: string, assignmentId: string, studentName: string, className: string): StudentPortfolio => {
  const initialDraft: Record<PoeticAxisId, any> = {} as any;
  POETIC_AXES.forEach(axis => { initialDraft[axis.id] = { axisId: axis.id, analysisText: '', evidenceQuotes: [] }; });
  return { id:`port-${studentId}-${assignmentId}`, assignmentId, studentId, studentName, className,
    lastAutosavedAt:new Date().toISOString(), currentActiveVersion:'v1.0 (nháp)', status:'drafting', currentDraft:initialDraft, versions:[] };
};

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: {}, autosaveStatus: 'saved', lastSavedTime: '',

  hydratePortfolios: (portfolios) => {
    Object.values(portfolios).forEach(portfolio => mockDb.savePortfolio(portfolio));
    set({ portfolios, autosaveStatus: 'saved' });
  },

  loadPortfolios: () => set({ portfolios: mockDb.getPortfolios() }),

  getPortfolio: (studentId, assignmentId, studentName = 'Học sinh', className = '') => {
    const key = `port-${studentId}-${assignmentId}`;
    return get().portfolios[key] || blankPortfolio(studentId, assignmentId, studentName, className);
  },

  updateDraft: (studentId, assignmentId, axisId, text, quotes) => {
    const key = `port-${studentId}-${assignmentId}`;
    const port = get().getPortfolio(studentId, assignmentId);
    const updated: StudentPortfolio = { ...port, lastAutosavedAt:new Date().toISOString(), currentDraft:{ ...port.currentDraft,
      [axisId]:{ axisId, analysisText:text, evidenceQuotes:quotes || port.currentDraft[axisId]?.evidenceQuotes || [] } } };
    mockDb.savePortfolio(updated);
    set(state => ({ portfolios:{...state.portfolios,[key]:updated}, autosaveStatus:'dirty' }));
    const existing = saveTimers.get(key); if(existing) clearTimeout(existing);
    saveTimers.set(key,setTimeout(async()=>{
      set({ autosaveStatus:'saving' });
      try {
        await postAction({action:'save_draft',assignmentId,content:get().portfolios[key]?.currentDraft||updated.currentDraft});
        set({autosaveStatus:'saved',lastSavedTime:new Date().toLocaleTimeString('vi-VN')});
      } catch { set({autosaveStatus:'dirty'}); }
    },800));
  },

  manualSaveDraft: async (studentId, assignmentId) => {
    const key=`port-${studentId}-${assignmentId}`; const port=get().getPortfolio(studentId,assignmentId);
    const pending=saveTimers.get(key); if(pending){clearTimeout(pending);saveTimers.delete(key);}
    set({autosaveStatus:'saving'});
    try { await postAction({action:'save_draft',assignmentId,content:port.currentDraft}); set({autosaveStatus:'saved',lastSavedTime:new Date().toLocaleTimeString('vi-VN')}); }
    catch(error){set({autosaveStatus:'dirty'});throw error;}
  },

  createSnapshot: async (studentId, assignmentId, versionNumber, changeSummary, authorName, options = {}) => {
    const key=`port-${studentId}-${assignmentId}`; const port=get().getPortfolio(studentId,assignmentId);
    try {
      const payload = {
        action: 'create_version',
        assignmentId,
        versionNumber,
        changeSummary,
        content: port.currentDraft,
        submissionKey: options.submissionKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined),
        stage: options.stage,
        confidence: options.confidence,
        changeSource: options.changeSource,
        revisionReason: options.revisionReason,
        linkedFeedbackIds: options.linkedFeedbackIds
      };
      const result = await postAction(payload);
      const serverVer = result.version;
      const vNum = serverVer?.versionNumber || versionNumber.trim();
      const newVer: PortfolioVersion = {
        id: serverVer?.id || `ver-${Date.now()}`,
        versionNumber: vNum,
        sequenceNo: serverVer?.sequenceNo,
        stage: serverVer?.stage || options.stage || 'initial',
        confidence: options.confidence,
        changeSource: options.changeSource,
        revisionReason: options.revisionReason,
        createdAt: serverVer?.createdAt || new Date().toISOString(),
        createdBy: studentId,
        authorName,
        changeSummary: changeSummary.trim(),
        responses: JSON.parse(JSON.stringify(port.currentDraft)),
        isFrozen: true,
        isSubmitted: true
      };
      const newStatus = result.portfolioStatus || 'submitted_waiting_ai';
      const updated: StudentPortfolio = {
        ...port,
        currentActiveVersion: newVer.versionNumber,
        status: newStatus,
        versions: [...port.versions, newVer]
      };
      mockDb.savePortfolio(updated);
      set(state => ({ portfolios: { ...state.portfolios, [key]: updated }, autosaveStatus: 'saved' }));
      return true;
    } catch {
      return false;
    }
  }
}));
