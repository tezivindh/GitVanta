import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>, durationMs?: number) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast, durationMs) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-3), { ...toast, id }] });
    const ms = durationMs ?? (toast.kind === 'error' ? 7000 : 4000);
    window.setTimeout(() => get().dismiss(id), ms);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Call from anywhere, including outside React. */
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ kind: 'success', title, description }),
  error: (title: string, description?: string, action?: Toast['action']) =>
    useToastStore.getState().push({ kind: 'error', title, description, action }),
  info: (title: string, description?: string) => useToastStore.getState().push({ kind: 'info', title, description }),
};
