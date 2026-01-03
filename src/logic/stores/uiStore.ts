/**
 * UI 状态存储 - 使用 Zustand
 * 
 * 管理临时 UI 状态，不持久化
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PlayerId } from '../../types/game';

// ============================================================
// UI 状态接口
// ============================================================

export interface UIState {
  // 侧边栏
  isSidebarOpen: boolean;
  sidebarTab: 'players' | 'history' | 'settings';

  // 音量控制
  volume: number;
  isMuted: boolean;

  // 玩家选择
  selectedPlayerId: PlayerId | null;
  hoveredPlayerId: PlayerId | null;

  // 视图模式
  viewMode: 'grimoire' | 'table' | 'list';
  showDeadPlayers: boolean;
  showRoles: boolean; // 说书人视图

  // 模态框
  activeModal: ModalType | null;
  modalData: Record<string, unknown>;

  // 通知
  notifications: Notification[];

  // 拖拽状态
  draggedPlayerId: PlayerId | null;

  // 缩放和平移
  zoom: number;
  panOffset: { x: number; y: number };

  // 夜晚行动追踪
  currentNightActorIndex: number;
  nightActorsOrder: PlayerId[];

  // 角色分配模式
  assignmentMode: boolean; // 是否处于角色分配模式
  draggedCharacterId: string | null; // 拖拽的角色 ID

  // 夜晚行动进度
  nightActionInProgress: boolean; // 是否正在执行夜晚行动

  // 投票追踪
  votesCollected: Record<PlayerId, boolean>; // 记录已收集的投票
  showVoteResults: boolean; // 是否显示投票结果
}

export type ModalType =
  | 'player-info'
  | 'role-select'
  | 'vote'
  | 'nomination'
  | 'game-settings'
  | 'role-info'
  | 'night-order'
  | 'confirm'
  | 'game-over';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number; // ms, 0 = 不自动消失
  timestamp: number;
}

// ============================================================
// UI Actions 接口
// ============================================================

export interface UIActions {
  // 侧边栏
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;

  // 音量
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // 玩家选择
  selectPlayer: (playerId: PlayerId | null) => void;
  hoverPlayer: (playerId: PlayerId | null) => void;

  // 视图
  setViewMode: (mode: UIState['viewMode']) => void;
  toggleDeadPlayers: () => void;
  toggleShowRoles: () => void;

  // 模态框
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // 通知
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 拖拽
  setDraggedPlayer: (playerId: PlayerId | null) => void;

  // 缩放平移
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetView: () => void;

  // 夜晚行动
  setNightActorsOrder: (order: PlayerId[]) => void;
  nextNightActor: () => void;
  prevNightActor: () => void;
  resetNightActors: () => void;

  // 角色分配
  setAssignmentMode: (active: boolean) => void;
  setDraggedCharacter: (characterId: string | null) => void;

  // 夜晚行动进度
  setNightActionInProgress: (inProgress: boolean) => void;

  // 投票
  setVote: (playerId: PlayerId, voted: boolean) => void;
  clearVotes: () => void;
  setShowVoteResults: (show: boolean) => void;

  // 重置
  reset: () => void;
}

// ============================================================
// 初始状态
// ============================================================

const initialState: UIState = {
  isSidebarOpen: false,
  sidebarTab: 'players',
  volume: 80,
  isMuted: false,
  selectedPlayerId: null,
  hoveredPlayerId: null,
  viewMode: 'grimoire',
  showDeadPlayers: true,
  showRoles: false,
  activeModal: null,
  modalData: {},
  notifications: [],
  draggedPlayerId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  currentNightActorIndex: 0,
  nightActorsOrder: [],
  assignmentMode: false,
  draggedCharacterId: null,
  nightActionInProgress: false,
  votesCollected: {},
  showVoteResults: false
};

// ============================================================
// 创建 Store
// ============================================================

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 侧边栏
      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      // 音量
      setVolume: (volume) => set({
        volume: Math.max(0, Math.min(100, volume)),
        isMuted: volume === 0
      }),
      toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

      // 玩家选择
      selectPlayer: (playerId) => set({ selectedPlayerId: playerId }),
      hoverPlayer: (playerId) => set({ hoveredPlayerId: playerId }),

      // 视图
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleDeadPlayers: () => set(state => ({ showDeadPlayers: !state.showDeadPlayers })),
      toggleShowRoles: () => set(state => ({ showRoles: !state.showRoles })),

      // 模态框
      openModal: (type, data = {}) => set({
        activeModal: type,
        modalData: data
      }),
      closeModal: () => set({
        activeModal: null,
        modalData: {}
      }),

      // 通知
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now()
        };

        set(state => ({
          notifications: [...state.notifications, newNotification]
        }));

        // 自动移除
        if (notification.duration !== 0) {
          const duration = notification.duration ?? 5000;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearNotifications: () => set({ notifications: [] }),

      // 拖拽
      setDraggedPlayer: (playerId) => set({ draggedPlayerId: playerId }),

      // 缩放平移
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
      setPanOffset: (offset) => set({ panOffset: offset }),
      resetView: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),

      // 夜晚行动
      setNightActorsOrder: (order) => set({
        nightActorsOrder: order,
        currentNightActorIndex: 0
      }),
      nextNightActor: () => set(state => ({
        currentNightActorIndex: Math.min(
          state.currentNightActorIndex + 1,
          state.nightActorsOrder.length - 1
        )
      })),
      prevNightActor: () => set(state => ({
        currentNightActorIndex: Math.max(
          state.currentNightActorIndex - 1,
          0
        )
      })),
      resetNightActors: () => set({
        currentNightActorIndex: 0,
        nightActorsOrder: []
      }),

      // 角色分配
      setAssignmentMode: (active) => set({ assignmentMode: active }),
      setDraggedCharacter: (characterId) => set({ draggedCharacterId: characterId }),

      // 夜晚行动进度
      setNightActionInProgress: (inProgress) => set({ nightActionInProgress: inProgress }),

      // 投票
      setVote: (playerId, voted) => set(state => ({
        votesCollected: { ...state.votesCollected, [playerId]: voted }
      })),
      clearVotes: () => set({ votesCollected: {}, showVoteResults: false }),
      setShowVoteResults: (show) => set({ showVoteResults: show }),

      // 重置
      reset: () => set(initialState)
    }),
    { name: 'ui-store' }
  )
);

// ============================================================
// 选择器 Hooks
// ============================================================

/** 获取当前夜晚行动者 */
export const useCurrentNightActor = () => {
  const { nightActorsOrder, currentNightActorIndex } = useUIStore();
  return nightActorsOrder[currentNightActorIndex] ?? null;
};

/** 获取有效音量 */
export const useEffectiveVolume = () => {
  const { volume, isMuted } = useUIStore();
  return isMuted ? 0 : volume;
};

/** 获取是否正在查看玩家 */
export const useIsViewingPlayer = (playerId: PlayerId) => {
  const { selectedPlayerId, hoveredPlayerId } = useUIStore();
  return selectedPlayerId === playerId || hoveredPlayerId === playerId;
};
