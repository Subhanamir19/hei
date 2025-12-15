import create from 'zustand';

export interface UIState {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
  modalMessage: string | null;
  setModalMessage: (msg: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  modalMessage: null,
  setLoading: (value: boolean) => set({ isLoading: value }),
  setModalMessage: (msg: string | null) => set({ modalMessage: msg }),
}));
