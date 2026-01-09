/**
 * 状态持久化测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    saveGameState,
    loadGameState,
    clearGameState,
    hasSavedState,
    getSavedStateInfo,
} from './statePersistence';
import { Phase, Team, type GameState } from '../types/game';

// 模拟 localStorage
class LocalStorageMock {
    private store: Map<string, string> = new Map();

    getItem(key: string): string | null {
        return this.store.get(key) || null;
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    get length(): number {
        return this.store.size;
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] || null;
    }
}

// 创建测试用的游戏状态
function createTestGameState(): GameState {
    return {
        sessionId: 'test-session-123',
        phase: Phase.DAY,
        currentDay: 2,
        currentNight: 1,
        isFirstNight: false,
        aliveCount: 5,
        players: [
            {
                id: 'p1',
                name: '玩家1',
                characterId: 'washerwoman',
                seatIndex: 0,
                isDead: false,
                isGhost: false,
                hasUsedGhostVote: false,
                status: {
                    poisoned: false,
                    drunk: false,
                    protected: false,
                    customMarkers: []
                },
                isStoryteller: false
            },
            {
                id: 'p2',
                name: '玩家2',
                characterId: 'imp',
                seatIndex: 1,
                isDead: false,
                isGhost: false,
                hasUsedGhostVote: false,
                status: {
                    poisoned: false,
                    drunk: false,
                    protected: false,
                    customMarkers: []
                },
                isStoryteller: false
            }
        ],
        currentNomineeId: null,
        currentNominatorId: null,
        currentVotes: {},
        nominatedToday: [],
        nominatorsToday: [],
        executionTarget: null,
        highestVoteCount: 0,
        nominationHistory: [],
        executionHistory: [],
        nightActions: [],
        history: [],
        winner: null,
        endReason: null
    };
}

describe('状态持久化系统', () => {
    let localStorageMock: LocalStorageMock;

    beforeEach(() => {
        localStorageMock = new LocalStorageMock();
        global.localStorage = localStorageMock as any;

        // 模拟 console 方法
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        localStorageMock.clear();
        vi.restoreAllMocks();
    });

    describe('saveGameState', () => {
        it('应该成功保存游戏状态', () => {
            const state = createTestGameState();
            const result = saveGameState(state);

            expect(result).toBe(true);
            expect(hasSavedState()).toBe(true);
        });

        it('保存的数据应该包含版本和时间戳', () => {
            const state = createTestGameState();
            saveGameState(state);

            const saved = localStorage.getItem('grimoire_aether_game_state');
            expect(saved).not.toBeNull();

            const parsed = JSON.parse(saved!);
            expect(parsed.version).toBe('1.0');
            expect(parsed.timestamp).toBeTypeOf('number');
            expect(parsed.state).toBeDefined();
        });

        it('应该处理 localStorage 配额超出错误', () => {
            // 模拟配额超出
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });

            const state = createTestGameState();
            const result = saveGameState(state);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('loadGameState', () => {
        it('应该成功加载保存的游戏状态', () => {
            const originalState = createTestGameState();
            saveGameState(originalState);

            const loadedState = loadGameState();

            expect(loadedState).not.toBeNull();
            expect(loadedState?.sessionId).toBe(originalState.sessionId);
            expect(loadedState?.phase).toBe(originalState.phase);
            expect(loadedState?.currentDay).toBe(originalState.currentDay);
            expect(loadedState?.players).toHaveLength(2);
        });

        it('没有保存数据时应该返回 null', () => {
            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
        });

        it('数据损坏时应该返回 null 并清除数据', () => {
            localStorage.setItem('grimoire_aether_game_state', 'invalid json');

            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
            expect(hasSavedState()).toBe(false);
        });

        it('版本不匹配时应该返回 null', () => {
            const state = createTestGameState();
            const savedState = {
                version: '0.9', // 旧版本
                timestamp: Date.now(),
                state
            };

            localStorage.setItem('grimoire_aether_game_state', JSON.stringify(savedState));

            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
            expect(console.warn).toHaveBeenCalled();
        });

        it('数据缺少必需字段时应该返回 null', () => {
            const invalidState = {
                version: '1.0',
                timestamp: Date.now(),
                state: {
                    sessionId: 'test',
                    // 缺少其他必需字段
                }
            };

            localStorage.setItem('grimoire_aether_game_state', JSON.stringify(invalidState));

            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
        });

        it('数据超过7天时应该发出警告但仍返回数据', () => {
            const state = createTestGameState();
            const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8天前
            const savedState = {
                version: '1.0',
                timestamp: oldTimestamp,
                state
            };

            localStorage.setItem('grimoire_aether_game_state', JSON.stringify(savedState));

            const loadedState = loadGameState();

            expect(loadedState).not.toBeNull();
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('超过7天')
            );
        });
    });

    describe('clearGameState', () => {
        it('应该清除保存的游戏状态', () => {
            const state = createTestGameState();
            saveGameState(state);

            expect(hasSavedState()).toBe(true);

            clearGameState();

            expect(hasSavedState()).toBe(false);
        });

        it('没有保存数据时清除不应报错', () => {
            expect(() => clearGameState()).not.toThrow();
        });
    });

    describe('hasSavedState', () => {
        it('有保存数据时应返回 true', () => {
            const state = createTestGameState();
            saveGameState(state);

            expect(hasSavedState()).toBe(true);
        });

        it('没有保存数据时应返回 false', () => {
            expect(hasSavedState()).toBe(false);
        });
    });

    describe('getSavedStateInfo', () => {
        it('应该返回保存状态的元信息', () => {
            const state = createTestGameState();
            saveGameState(state);

            const info = getSavedStateInfo();

            expect(info).not.toBeNull();
            expect(info?.exists).toBe(true);
            expect(info?.sessionId).toBe('test-session-123');
            expect(info?.phase).toBe(Phase.DAY);
            expect(info?.day).toBe(2);
            expect(info?.timestamp).toBeTypeOf('number');
        });

        it('没有保存数据时应返回 exists: false', () => {
            const info = getSavedStateInfo();

            expect(info).toEqual({ exists: false });
        });

        it('数据损坏时应返回 null', () => {
            localStorage.setItem('grimoire_aether_game_state', 'invalid json');

            const info = getSavedStateInfo();

            expect(info).toBeNull();
        });
    });

    describe('数据完整性验证', () => {
        it('players 不是数组时应拒绝加载', () => {
            const invalidState = {
                version: '1.0',
                timestamp: Date.now(),
                state: {
                    sessionId: 'test',
                    phase: Phase.DAY,
                    currentDay: 1,
                    currentNight: 0,
                    aliveCount: 0,
                    players: 'not an array' // 错误类型
                }
            };

            localStorage.setItem('grimoire_aether_game_state', JSON.stringify(invalidState));

            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
        });

        it('玩家数据无效时应拒绝加载', () => {
            const invalidState = {
                version: '1.0',
                timestamp: Date.now(),
                state: {
                    sessionId: 'test',
                    phase: Phase.DAY,
                    currentDay: 1,
                    currentNight: 0,
                    aliveCount: 1,
                    players: [
                        { id: 'p1' } // 缺少 name 字段
                    ]
                }
            };

            localStorage.setItem('grimoire_aether_game_state', JSON.stringify(invalidState));

            const loadedState = loadGameState();

            expect(loadedState).toBeNull();
        });
    });

    describe('保存和加载往返测试', () => {
        it('保存后加载应该得到相同的数据', () => {
            const originalState = createTestGameState();

            saveGameState(originalState);
            const loadedState = loadGameState();

            expect(loadedState).toEqual(originalState);
        });

        it('多次保存应该覆盖旧数据', () => {
            const state1 = createTestGameState();
            saveGameState(state1);

            const state2 = { ...state1, currentDay: 5 };
            saveGameState(state2);

            const loadedState = loadGameState();

            expect(loadedState?.currentDay).toBe(5);
        });
    });
});
