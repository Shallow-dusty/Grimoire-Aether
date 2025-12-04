/**
 * 类型定义导出索引
 */

// ============ 游戏核心类型 ============
export * from './game';

// ============ 通用类型 ============

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Token {
  id: string;
  type: string;
  position: Position;
  rotation?: number;
  scale?: number;
}

// ============ 设备类型 ============

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
