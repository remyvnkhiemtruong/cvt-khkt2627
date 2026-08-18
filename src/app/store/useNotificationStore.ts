import { create } from 'zustand';
import type { ToastMessage } from '../../components/ui/Toast';

interface NotificationState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  addToast: (toastData) => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).slice(2, 6);
    const newToast: ToastMessage = { ...toastData, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  }
}));
