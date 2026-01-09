/**
 * 游戏功能配置测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    DEFAULT_GAME_CONFIG,
    DEV_GAME_CONFIG,
    PROD_GAME_CONFIG,
    getGameConfig,
    saveGameConfig,
    resetGameConfig,
    FEATURE_DESCRIPTIONS,
    FEATURE_LABELS,
    type GameFeatureConfig
} from './gameConfig';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Mock import.meta.env
vi.mock('import.meta', () => ({
    env: {
        DEV: true
    }
}));

describe('Game Config', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('DEFAULT_GAME_CONFIG', () => {
        it('应该有正确的默认值', () => {
            expect(DEFAULT_GAME_CONFIG.clockwiseVoting).toBe(false);
            expect(DEFAULT_GAME_CONFIG.aiAssistant).toBe(false);
            expect(DEFAULT_GAME_CONFIG.debugMode).toBe(false);
            expect(DEFAULT_GAME_CONFIG.quickFirstNight).toBe(true);
            expect(DEFAULT_GAME_CONFIG.autoSave).toBe(true);
            expect(DEFAULT_GAME_CONFIG.soundEffects).toBe(true);
            expect(DEFAULT_GAME_CONFIG.animations).toBe(true);
            expect(DEFAULT_GAME_CONFIG.ghostsCanSeeRoles).toBe(false);
            expect(DEFAULT_GAME_CONFIG.verboseHistory).toBe(false);
            expect(DEFAULT_GAME_CONFIG.realtimeSync).toBe(false);
        });
    });

    describe('DEV_GAME_CONFIG', () => {
        it('应该继承默认配置并启用调试功能', () => {
            expect(DEV_GAME_CONFIG.debugMode).toBe(true);
            expect(DEV_GAME_CONFIG.verboseHistory).toBe(true);
            expect(DEV_GAME_CONFIG.quickFirstNight).toBe(true);
            // 其他值应该继承默认
            expect(DEV_GAME_CONFIG.autoSave).toBe(true);
        });
    });

    describe('PROD_GAME_CONFIG', () => {
        it('应该禁用调试功能', () => {
            expect(PROD_GAME_CONFIG.debugMode).toBe(false);
            expect(PROD_GAME_CONFIG.verboseHistory).toBe(false);
            // 其他值应该继承默认
            expect(PROD_GAME_CONFIG.autoSave).toBe(true);
        });
    });

    describe('getGameConfig', () => {
        it('没有保存配置时应该返回基础配置', () => {
            const config = getGameConfig();
            expect(config).toBeDefined();
        });

        it('应该合并本地存储中的配置', () => {
            const customConfig: Partial<GameFeatureConfig> = {
                clockwiseVoting: true,
                aiAssistant: true
            };
            localStorageMock.setItem('grimoire-aether-config', JSON.stringify(customConfig));

            const config = getGameConfig();
            expect(config.clockwiseVoting).toBe(true);
            expect(config.aiAssistant).toBe(true);
        });

        it('应该处理无效的 JSON', () => {
            localStorageMock.setItem('grimoire-aether-config', 'invalid json');

            // 不应该抛出错误
            const config = getGameConfig();
            expect(config).toBeDefined();
        });
    });

    describe('saveGameConfig', () => {
        it('应该保存配置到本地存储', () => {
            saveGameConfig({ clockwiseVoting: true });

            const saved = JSON.parse(localStorageMock.getItem('grimoire-aether-config') || '{}');
            expect(saved.clockwiseVoting).toBe(true);
        });

        it('应该合并现有配置', () => {
            saveGameConfig({ clockwiseVoting: true });
            saveGameConfig({ aiAssistant: true });

            const saved = JSON.parse(localStorageMock.getItem('grimoire-aether-config') || '{}');
            expect(saved.clockwiseVoting).toBe(true);
            expect(saved.aiAssistant).toBe(true);
        });
    });

    describe('resetGameConfig', () => {
        it('应该删除保存的配置', () => {
            localStorageMock.setItem('grimoire-aether-config', JSON.stringify({ clockwiseVoting: true }));

            resetGameConfig();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('grimoire-aether-config');
        });
    });

    describe('FEATURE_DESCRIPTIONS', () => {
        it('应该为所有功能提供描述', () => {
            const keys: (keyof GameFeatureConfig)[] = [
                'clockwiseVoting',
                'aiAssistant',
                'debugMode',
                'quickFirstNight',
                'autoSave',
                'soundEffects',
                'animations',
                'ghostsCanSeeRoles',
                'verboseHistory',
                'realtimeSync'
            ];

            keys.forEach(key => {
                expect(FEATURE_DESCRIPTIONS[key]).toBeDefined();
                expect(typeof FEATURE_DESCRIPTIONS[key]).toBe('string');
                expect(FEATURE_DESCRIPTIONS[key].length).toBeGreaterThan(0);
            });
        });
    });

    describe('FEATURE_LABELS', () => {
        it('应该为所有功能提供标签', () => {
            const keys: (keyof GameFeatureConfig)[] = [
                'clockwiseVoting',
                'aiAssistant',
                'debugMode',
                'quickFirstNight',
                'autoSave',
                'soundEffects',
                'animations',
                'ghostsCanSeeRoles',
                'verboseHistory',
                'realtimeSync'
            ];

            keys.forEach(key => {
                expect(FEATURE_LABELS[key]).toBeDefined();
                expect(typeof FEATURE_LABELS[key]).toBe('string');
                expect(FEATURE_LABELS[key].length).toBeGreaterThan(0);
            });
        });
    });
});
