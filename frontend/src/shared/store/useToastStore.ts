import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, title) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const durationMs = type === 'error' ? 6000 : 4000;

    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, type, title, message }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, durationMs);
  },
  success: (message, title) =>
    useToastStore.getState().addToast('success', message, title ?? 'Éxito'),
  error: (message, title) =>
    useToastStore.getState().addToast('error', message, title ?? 'Ocurrió un error'),
  info: (message, title) =>
    useToastStore.getState().addToast('info', message, title ?? 'Información'),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

