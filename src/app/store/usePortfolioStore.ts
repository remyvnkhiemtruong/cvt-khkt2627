import { create } from 'zustand';
import type { 
  StudentPortfolio, 
  PoeticAxisId, 
  PortfolioVersion, 
  EvidenceQuote 
} from '../../types';
import { mockDb } from '../../services/mockApi/mockDb';
import { POETIC_AXES } from '../../data/seedData';

interface PortfolioState {
  portfolios: Record<string, StudentPortfolio>;
  autosaveStatus: 'saved' | 'saving' | 'dirty';
  lastSavedTime: string;

  // Actions
  loadPortfolios: () => void;
  getPortfolio: (studentId: string, assignmentId: string, studentName?: string, className?: string) => StudentPortfolio;
  updateDraft: (studentId: string, assignmentId: string, axisId: PoeticAxisId, text: string, quotes?: EvidenceQuote[]) => void;
  manualSaveDraft: (studentId: string, assignmentId: string) => void;
  createSnapshot: (studentId: string, assignmentId: string, versionNumber: string, changeSummary: string, authorName: string) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: mockDb.getPortfolios(),
  autosaveStatus: 'saved',
  lastSavedTime: 'vừa xong',

  loadPortfolios: () => {
    set({ portfolios: mockDb.getPortfolios() });
  },

  getPortfolio: (studentId: string, assignmentId: string, studentName = 'Học sinh', className = '11A1') => {
    const key = `port-${studentId}-${assignmentId}`;
    const existing = get().portfolios[key];
    if (existing) return existing;

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
      studentName,
      className,
      lastAutosavedAt: new Date().toISOString(),
      currentActiveVersion: 'v1.0 (nháp)',
      status: 'drafting',
      currentDraft: initialDraft,
      versions: []
    };

    mockDb.savePortfolio(newPort);
    set((state) => ({
      portfolios: { ...state.portfolios, [key]: newPort }
    }));
    return newPort;
  },

  updateDraft: (studentId, assignmentId, axisId, text, quotes) => {
    set({ autosaveStatus: 'dirty' });
    const key = `port-${studentId}-${assignmentId}`;
    const port = get().getPortfolio(studentId, assignmentId);

    const updated: StudentPortfolio = {
      ...port,
      lastAutosavedAt: new Date().toISOString(),
      currentDraft: {
        ...port.currentDraft,
        [axisId]: {
          axisId,
          analysisText: text,
          evidenceQuotes: quotes || port.currentDraft[axisId]?.evidenceQuotes || []
        }
      }
    };

    mockDb.savePortfolio(updated);
    set((state) => ({
      portfolios: { ...state.portfolios, [key]: updated }
    }));

    // Simulate smooth autosave
    setTimeout(() => {
      set({
        autosaveStatus: 'saved',
        lastSavedTime: new Date().toLocaleTimeString('vi-VN')
      });
    }, 500);
  },

  manualSaveDraft: (studentId, assignmentId) => {
    set({ autosaveStatus: 'saving' });
    const port = get().getPortfolio(studentId, assignmentId);
    mockDb.savePortfolio(port);
    setTimeout(() => {
      set({
        autosaveStatus: 'saved',
        lastSavedTime: new Date().toLocaleTimeString('vi-VN')
      });
    }, 300);
  },

  createSnapshot: (studentId, assignmentId, versionNumber, changeSummary, authorName) => {
    const key = `port-${studentId}-${assignmentId}`;
    const port = get().getPortfolio(studentId, assignmentId);

    const frozen = JSON.parse(JSON.stringify(port.currentDraft));

    const newVer: PortfolioVersion = {
      id: 'ver-' + Date.now(),
      versionNumber: versionNumber.trim(),
      createdAt: new Date().toISOString(),
      createdBy: studentId,
      authorName,
      changeSummary: changeSummary.trim(),
      responses: frozen,
      isFrozen: true,
      isSubmitted: true
    };

    const updated: StudentPortfolio = {
      ...port,
      currentActiveVersion: newVer.versionNumber,
      status: versionNumber.startsWith('v1') ? 'v1_submitted' : 'v2_in_revision',
      versions: [...port.versions, newVer]
    };

    mockDb.savePortfolio(updated);
    set((state) => ({
      portfolios: { ...state.portfolios, [key]: updated }
    }));
  }
}));
