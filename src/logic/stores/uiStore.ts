import { create } from 'zustand';
import type { UIState, ViewMode } from '../../types';

interface UIStore extends UIState {
  // Actions
  setViewMode: (mode: ViewMode) => void;
  toggleMenu: () => void;
  selectToken: (tokenId: string | undefined) => void;
}

/**
 * UI 状态管理 Store
 * 使用 Zustand 管理全局 UI 状态
 */
export const useUIStore = create<UIStore>((set) => ({
  // Initial State
  viewMode: 'board',
  isMenuOpen: false,
  selectedTokenId: undefined,

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  selectToken: (tokenId) => set({ selectedTokenId: tokenId }),
}));
