/**
 * 游戏状态持久化工具
 * 使用 localStorage 保存和恢复游戏状态
 */

import type { GameState } from '../types/game';

const STORAGE_KEY = 'grimoire_aether_game_state';
const VERSION = '1.0';

/**
 * 保存的状态数据结构
 */
interface SavedState {
    version: string;
    timestamp: number;
    state: GameState;
}

/**
 * 保存游戏状态到 localStorage
 * @param state 游戏状态
 * @returns 是否保存成功
 */
export function saveGameState(state: GameState): boolean {
    try {
        const savedState: SavedState = {
            version: VERSION,
            timestamp: Date.now(),
            state
        };

        const serialized = JSON.stringify(savedState);
        localStorage.setItem(STORAGE_KEY, serialized);

        console.log('[StatePersistence] 游戏状态已保存', {
            sessionId: state.sessionId,
            phase: state.phase,
            day: state.currentDay,
            timestamp: new Date(savedState.timestamp).toISOString()
        });

        return true;
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.error('[StatePersistence] localStorage 配额已满，无法保存状态');
        } else {
            console.error('[StatePersistence] 保存游戏状态失败:', error);
        }
        return false;
    }
}

/**
 * 从 localStorage 加载游戏状态
 * @returns 游戏状态或 null（如果没有保存或数据无效）
 */
export function loadGameState(): GameState | null {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) {
            console.log('[StatePersistence] 没有找到保存的游戏状态');
            return null;
        }

        const savedState: SavedState = JSON.parse(serialized);

        // 验证数据版本
        if (savedState.version !== VERSION) {
            console.warn('[StatePersistence] 状态版本不匹配，忽略保存的数据', {
                saved: savedState.version,
                current: VERSION
            });
            return null;
        }

        // 验证数据完整性
        if (!validateGameState(savedState.state)) {
            console.error('[StatePersistence] 保存的状态数据无效，已清理');
            clearGameState();
            return null;
        }

        // 检查数据年龄（超过7天的数据可能过期）
        const ageInDays = (Date.now() - savedState.timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays > 7) {
            console.warn('[StatePersistence] 保存的状态已超过7天，可能已过期');
            // 不自动清除，让用户决定是否继续
        }

        console.log('[StatePersistence] 游戏状态已加载', {
            sessionId: savedState.state.sessionId,
            phase: savedState.state.phase,
            day: savedState.state.currentDay,
            savedAt: new Date(savedState.timestamp).toISOString()
        });

        return savedState.state;
    } catch (error) {
        console.error('[StatePersistence] 加载游戏状态失败:', error);
        // 如果数据损坏，清除它
        clearGameState();
        return null;
    }
}

/**
 * 清除保存的游戏状态
 */
export function clearGameState(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[StatePersistence] 游戏状态已清除');
    } catch (error) {
        console.error('[StatePersistence] 清除游戏状态失败:', error);
    }
}

/**
 * 检查是否有保存的游戏状态
 * @returns 是否存在保存的状态
 */
export function hasSavedState(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * 获取保存状态的信息（不加载完整状态）
 * @returns 保存状态的元信息
 */
export function getSavedStateInfo(): {
    exists: boolean;
    timestamp?: number;
    sessionId?: string;
    phase?: string;
    day?: number;
} | null {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) {
            return { exists: false };
        }

        const savedState: SavedState = JSON.parse(serialized);
        return {
            exists: true,
            timestamp: savedState.timestamp,
            sessionId: savedState.state.sessionId,
            phase: savedState.state.phase,
            day: savedState.state.currentDay
        };
    } catch (error) {
        console.error('[StatePersistence] 获取保存状态信息失败:', error);
        return null;
    }
}

/**
 * 验证游戏状态数据完整性
 * @param state 待验证的状态
 * @returns 是否有效
 */
function validateGameState(state: any): state is GameState {
    if (!state || typeof state !== 'object') {
        return false;
    }

    // 检查必需字段
    const requiredFields = [
        'sessionId',
        'phase',
        'currentDay',
        'currentNight',
        'players',
        'aliveCount'
    ];

    for (const field of requiredFields) {
        if (!(field in state)) {
            console.error(`[StatePersistence] 缺少必需字段: ${field}`);
            return false;
        }
    }

    // 检查 players 是否是数组
    if (!Array.isArray(state.players)) {
        console.error('[StatePersistence] players 不是数组');
        return false;
    }

    // 检查玩家数据
    for (const player of state.players) {
        if (!player.id || typeof player.name !== 'string') {
            console.error('[StatePersistence] 玩家数据无效', player);
            return false;
        }
    }

    return true;
}

/**
 * 导出游戏状态为 JSON 文件（用于备份或分享）
 * @param state 游戏状态
 * @param filename 文件名（可选）
 */
export function exportGameState(state: GameState, filename?: string): void {
    const savedState: SavedState = {
        version: VERSION,
        timestamp: Date.now(),
        state
    };

    const json = JSON.stringify(savedState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `grimoire-${state.sessionId}-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[StatePersistence] 游戏状态已导出', link.download);
}

/**
 * 从 JSON 文件导入游戏状态
 * @param file JSON 文件
 * @returns Promise<游戏状态 | null>
 */
export function importGameState(file: File): Promise<GameState | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const savedState: SavedState = JSON.parse(content);

                if (savedState.version !== VERSION) {
                    console.warn('[StatePersistence] 导入的状态版本不匹配');
                }

                if (!validateGameState(savedState.state)) {
                    console.error('[StatePersistence] 导入的状态数据无效');
                    resolve(null);
                    return;
                }

                console.log('[StatePersistence] 游戏状态已导入', {
                    sessionId: savedState.state.sessionId,
                    phase: savedState.state.phase
                });

                resolve(savedState.state);
            } catch (error) {
                console.error('[StatePersistence] 导入游戏状态失败:', error);
                resolve(null);
            }
        };

        reader.onerror = () => {
            console.error('[StatePersistence] 读取文件失败');
            resolve(null);
        };

        reader.readAsText(file);
    });
}
