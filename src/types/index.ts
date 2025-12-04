/**
 * 全局类型定义
 * 这里定义项目中通用的类型接口
 */

// ============ 游戏相关类型 ============

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  position?: Position;
}

export interface Token {
  id: string;
  type: string;
  position: Position;
  rotation?: number;
  scale?: number;
}

// ============ UI 状态类型 ============

export type ViewMode = 'board' | 'grimoire' | 'settings';

export interface UIState {
  viewMode: ViewMode;
  isMenuOpen: boolean;
  selectedTokenId?: string;
}

// ============ 设备类型 ============

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
