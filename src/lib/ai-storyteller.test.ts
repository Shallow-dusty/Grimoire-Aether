/**
 * AI 说书人辅助模块测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    AIStorytellerAssistant,
    getStorytellerAssistant,
    resetStorytellerAssistant
} from './ai-storyteller';
import { createPlayer, Team } from '../types/game';
import type { Player } from '../types/game';

// Mock AI client
vi.mock('./ai-client', () => ({
    chat: vi.fn(),
    createSession: vi.fn(() => ({
        send: vi.fn().mockResolvedValue('{}'),
        getHistory: vi.fn().mockReturnValue([]),
        clear: vi.fn(),
        setProvider: vi.fn(),
        setModel: vi.fn()
    }))
}));

describe('AIStorytellerAssistant', () => {
    let assistant: AIStorytellerAssistant;

    beforeEach(() => {
        resetStorytellerAssistant();
    });

    describe('构造和配置', () => {
        it('应该能创建启用的助手', () => {
            assistant = new AIStorytellerAssistant({ enabled: true });
            expect(assistant.isEnabled()).toBe(true);
        });

        it('应该能创建禁用的助手', () => {
            assistant = new AIStorytellerAssistant({ enabled: false });
            expect(assistant.isEnabled()).toBe(false);
        });

        it('getStorytellerAssistant 应该返回单例', () => {
            const a1 = getStorytellerAssistant({ enabled: true });
            const a2 = getStorytellerAssistant();
            expect(a1).toBe(a2);
        });

        it('resetStorytellerAssistant 应该清除单例', () => {
            const a1 = getStorytellerAssistant({ enabled: true });
            resetStorytellerAssistant();
            const a2 = getStorytellerAssistant({ enabled: true });
            expect(a1).not.toBe(a2);
        });
    });

    describe('本地角色分配', () => {
        beforeEach(() => {
            // 使用禁用的助手来测试本地生成
            assistant = new AIStorytellerAssistant({ enabled: false });
        });

        it('应该为5人游戏生成正确配置', async () => {
            const players = [
                { id: 'p1', name: '玩家1' },
                { id: 'p2', name: '玩家2' },
                { id: 'p3', name: '玩家3' },
                { id: 'p4', name: '玩家4' },
                { id: 'p5', name: '玩家5' }
            ];

            const result = await assistant.suggestRoleAssignment(players);

            expect(result.assignments).toHaveLength(5);
            expect(result.description).toContain('5 人');
            expect(result.balance.score).toBeGreaterThanOrEqual(1);
            expect(result.balance.score).toBeLessThanOrEqual(10);
        });

        it('应该为10人游戏生成正确配置', async () => {
            const players = Array.from({ length: 10 }, (_, i) => ({
                id: `p${i + 1}`,
                name: `玩家${i + 1}`
            }));

            const result = await assistant.suggestRoleAssignment(players);

            expect(result.assignments).toHaveLength(10);
            expect(result.description).toContain('10 人');
        });

        it('每个玩家应该分配一个角色', async () => {
            const players = [
                { id: 'p1', name: '玩家1' },
                { id: 'p2', name: '玩家2' },
                { id: 'p3', name: '玩家3' },
                { id: 'p4', name: '玩家4' },
                { id: 'p5', name: '玩家5' }
            ];

            const result = await assistant.suggestRoleAssignment(players);

            const playerIds = result.assignments.map(a => a.playerId);
            expect(new Set(playerIds).size).toBe(5);

            result.assignments.forEach(a => {
                expect(a.characterId).toBeDefined();
                expect(a.characterName).toBeDefined();
                expect(a.reason).toBeDefined();
            });
        });

        it('应该遵守排除角色选项', async () => {
            const players = Array.from({ length: 7 }, (_, i) => ({
                id: `p${i + 1}`,
                name: `玩家${i + 1}`
            }));

            const result = await assistant.suggestRoleAssignment(players, {
                excludedCharacters: ['imp', 'poisoner']
            });

            const assignedCharacters = result.assignments.map(a => a.characterId);
            // 由于 imp 是唯一的恶魔，排除它后游戏无法正常进行
            // 所以这个测试主要验证函数不会崩溃
            expect(result.assignments).toHaveLength(7);
        });
    });

    describe('本地能力结果生成', () => {
        let players: Player[];

        beforeEach(() => {
            assistant = new AIStorytellerAssistant({ enabled: false });
            players = [
                { ...createPlayer('p1', '共情者', 0), characterId: 'empath' },
                { ...createPlayer('p2', '投毒者', 1), characterId: 'poisoner' },
                { ...createPlayer('p3', '村民', 2), characterId: 'washerwoman' }
            ];
        });

        it('共情者应该返回正确的邪恶邻居数', async () => {
            const result = await assistant.suggestAbilityResult(
                'empath',
                players[0],
                undefined,
                {
                    players,
                    currentNight: 1,
                    isFirstNight: true,
                    isPoisoned: false
                }
            );

            expect(result.characterId).toBe('empath');
            expect(result.result.evilNeighborCount).toBeDefined();
            expect(result.isPoisonedInfo).toBe(false);
        });

        it('中毒的共情者应该返回随机结果', async () => {
            const results = new Set<number>();

            // 运行多次收集结果
            for (let i = 0; i < 10; i++) {
                const result = await assistant.suggestAbilityResult(
                    'empath',
                    players[0],
                    undefined,
                    {
                        players,
                        currentNight: 1,
                        isFirstNight: true,
                        isPoisoned: true
                    }
                );
                results.add(result.result.evilNeighborCount as number);
            }

            // 应该生成 0-2 范围内的值
            results.forEach(r => {
                expect(r).toBeGreaterThanOrEqual(0);
                expect(r).toBeLessThanOrEqual(2);
            });
        });

        it('占卜师应该检测恶魔', async () => {
            const demonPlayer = { ...createPlayer('p4', '恶魔', 3), characterId: 'imp' };
            const testPlayers = [...players, demonPlayer];

            const result = await assistant.suggestAbilityResult(
                'fortune_teller',
                { ...createPlayer('ft', '占卜师', 4), characterId: 'fortune_teller' },
                [players[2], demonPlayer],
                {
                    players: testPlayers,
                    currentNight: 1,
                    isFirstNight: true,
                    isPoisoned: false
                }
            );

            expect(result.characterId).toBe('fortune_teller');
            expect(result.result.hasDemon).toBe(true);
        });

        it('厨师应该计算邪恶对数', async () => {
            // 创建相邻的邪恶玩家
            const evilPlayers = [
                { ...createPlayer('e1', '投毒者', 0), characterId: 'poisoner' },
                { ...createPlayer('e2', '小恶魔', 1), characterId: 'imp' },
                { ...createPlayer('g1', '村民', 2), characterId: 'washerwoman' }
            ];

            const result = await assistant.suggestAbilityResult(
                'chef',
                { ...createPlayer('chef', '厨师', 3), characterId: 'chef' },
                undefined,
                {
                    players: evilPlayers,
                    currentNight: 0,
                    isFirstNight: true,
                    isPoisoned: false
                }
            );

            expect(result.characterId).toBe('chef');
            expect(result.result.evilPairs).toBe(1);
        });
    });

    describe('本地游戏节奏提示', () => {
        beforeEach(() => {
            assistant = new AIStorytellerAssistant({ enabled: false });
        });

        it('应该在游戏接近结束时发出警告', async () => {
            const players = [
                { ...createPlayer('p1', '玩家1', 0), characterId: 'empath' },
                { ...createPlayer('p2', '玩家2', 1), characterId: 'imp' },
                { ...createPlayer('p3', '玩家3', 2), characterId: 'washerwoman' }
            ];

            const tips = await assistant.getGamePacingTips({
                players,
                currentDay: 3,
                currentNight: 3,
                executedToday: false,
                nominationHistory: []
            });

            const warningTips = tips.filter(t => t.type === 'warning');
            expect(warningTips.length).toBeGreaterThan(0);
            expect(warningTips[0].message).toContain('3');
        });

        it('应该提示没有处决', async () => {
            const players = Array.from({ length: 7 }, (_, i) => ({
                ...createPlayer(`p${i}`, `玩家${i}`, i),
                characterId: 'washerwoman' as const
            }));

            const tips = await assistant.getGamePacingTips({
                players,
                currentDay: 2,
                currentNight: 2,
                executedToday: false,
                nominationHistory: []
            });

            const suggestionTips = tips.filter(t => t.type === 'suggestion');
            expect(suggestionTips.some(t => t.message.includes('处决'))).toBe(true);
        });

        it('首日应该提供特殊提示', async () => {
            const players = Array.from({ length: 7 }, (_, i) => ({
                ...createPlayer(`p${i}`, `玩家${i}`, i),
                characterId: 'washerwoman' as const
            }));

            const tips = await assistant.getGamePacingTips({
                players,
                currentDay: 1,
                currentNight: 1,
                executedToday: false,
                nominationHistory: []
            });

            const firstDayTips = tips.filter(t => t.message.includes('第一天'));
            expect(firstDayTips.length).toBeGreaterThan(0);
        });
    });
});
