import { create } from 'zustand';

type ToastKind = 'success' | 'info' | 'error';

type ToastState = {
  message: string | null;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  kind: 'success',
  show: (message, kind = 'success') => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, kind });
    hideTimer = setTimeout(() => set({ message: null }), 2600);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));
