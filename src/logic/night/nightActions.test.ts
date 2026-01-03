/**
 * 夜晚行动系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    buildNightQueue,
    getCurrentAction,
    completeCurrentAction,
    isNightComplete,
    skipCurrentAction,
    getNeighbors,
    isEvil,
    isDemon,
    countAliveEvil,
    countAliveDemon,
    registerAbilityHandler,
    executeAbility,
    type AbilityContext
} from './nightActions';
import { createPlayer, Team, type Player } from '../../types/game';

describe('Night Action System', () => {
    let players: Player[];

    beforeEach(() => {
        // 创建测试玩家
        players = [
            { ...createPlayer('p1', '玩家1', 0), characterId: 'washerwoman' },  // 首夜行动
            { ...createPlayer('p2', '玩家2', 1), characterId: 'empath' },       // 首夜+其他夜晚
            { ...createPlayer('p3', '玩家3', 2), characterId: 'monk' },         // 仅其他夜晚
            { ...createPlayer('p4', '玩家4', 3), characterId: 'soldier' },      // 无夜晚行动
            { ...createPlayer('p5', '玩家5', 4), characterId: 'poisoner' },     // 首夜+其他夜晚（爪牙）
            { ...createPlayer('p6', '玩家6', 5), characterId: 'imp' }           // 仅其他夜晚（恶魔）
        ];
    });

    describe('buildNightQueue', () => {
        it('应该为首夜构建正确的行动队列', () => {
            const queue = buildNightQueue(players, true, 0);

            expect(queue.isFirstNight).toBe(true);
            expect(queue.night).toBe(0);
            expect(queue.actions.length).toBeGreaterThan(0);

            // 首夜应该包含：washerwoman, empath, poisoner
            const characterIds = queue.actions.map(a => a.characterId);
            expect(characterIds).toContain('washerwoman');
            expect(characterIds).toContain('empath');
            expect(characterIds).toContain('poisoner');
            expect(characterIds).not.toContain('monk'); // monk 不在首夜行动
            expect(characterIds).not.toContain('imp');  // imp 不在首夜行动
        });

        it('应该为其他夜晚构建正确的行动队列', () => {
            const queue = buildNightQueue(players, false, 1);

            expect(queue.isFirstNight).toBe(false);
            expect(queue.night).toBe(1);

            // 其他夜晚应该包含：empath, monk, poisoner, imp
            const characterIds = queue.actions.map(a => a.characterId);
            expect(characterIds).toContain('empath');
            expect(characterIds).toContain('monk');
            expect(characterIds).toContain('poisoner');
            expect(characterIds).toContain('imp');
            expect(characterIds).not.toContain('washerwoman'); // washerwoman 只在首夜
        });

        it('应该按正确的顺序排序行动', () => {
            const queue = buildNightQueue(players, true, 0);

            // 检查顺序是否递增
            for (let i = 1; i < queue.actions.length; i++) {
                expect(queue.actions[i].order)
                    .toBeGreaterThanOrEqual(queue.actions[i - 1].order);
            }
        });

        it('应该排除死亡玩家', () => {
            const deadPlayers = players.map((p, i) =>
                i === 0 ? { ...p, isDead: true } : p
            );

            const queue = buildNightQueue(deadPlayers, true, 0);
            const playerIds = queue.actions.flatMap(a => a.playerIds);

            expect(playerIds).not.toContain('p1'); // 死亡的 washerwoman
        });

        it('空玩家列表应该返回空队列', () => {
            const queue = buildNightQueue([], true, 0);
            expect(queue.actions).toHaveLength(0);
        });
    });

    describe('getCurrentAction', () => {
        it('应该返回第一个行动', () => {
            const queue = buildNightQueue(players, true, 0);
            const current = getCurrentAction(queue);

            expect(current).toBeDefined();
            expect(current?.order).toBe(queue.actions[0].order);
        });

        it('索引超出范围应该返回 null', () => {
            const queue = buildNightQueue(players, true, 0);
            queue.currentIndex = 999;

            const current = getCurrentAction(queue);
            expect(current).toBeNull();
        });

        it('空队列应该返回 null', () => {
            const queue = buildNightQueue([], true, 0);
            const current = getCurrentAction(queue);

            expect(current).toBeNull();
        });
    });

    describe('completeCurrentAction', () => {
        it('应该标记当前行动为完成并推进索引', () => {
            const queue = buildNightQueue(players, true, 0);
            const initialIndex = queue.currentIndex;

            const newQueue = completeCurrentAction(queue);

            expect(newQueue.currentIndex).toBe(initialIndex + 1);
            expect(newQueue.actions[initialIndex].completed).toBe(true);
        });

        it('已经在末尾的队列不应该改变', () => {
            const queue = buildNightQueue(players, true, 0);
            queue.currentIndex = queue.actions.length;

            const newQueue = completeCurrentAction(queue);

            expect(newQueue.currentIndex).toBe(queue.currentIndex);
        });
    });

    describe('isNightComplete', () => {
        it('新队列应该未完成', () => {
            const queue = buildNightQueue(players, true, 0);
            expect(isNightComplete(queue)).toBe(false);
        });

        it('索引到达末尾应该返回完成', () => {
            const queue = buildNightQueue(players, true, 0);
            queue.currentIndex = queue.actions.length;

            expect(isNightComplete(queue)).toBe(true);
        });

        it('完成所有行动后应该返回完成', () => {
            let queue = buildNightQueue(players, true, 0);

            while (!isNightComplete(queue)) {
                queue = completeCurrentAction(queue);
            }

            expect(isNightComplete(queue)).toBe(true);
        });
    });

    describe('skipCurrentAction', () => {
        it('应该跳过当前行动', () => {
            const queue = buildNightQueue(players, true, 0);
            const initialIndex = queue.currentIndex;

            const newQueue = skipCurrentAction(queue);

            expect(newQueue.currentIndex).toBe(initialIndex + 1);
            expect(newQueue.actions[initialIndex].completed).toBe(true);
        });
    });

    describe('getNeighbors', () => {
        it('应该返回正确的左右邻居', () => {
            const player = players[2]; // 索引 2
            const neighbors = getNeighbors(player, players);

            expect(neighbors.left).toBeDefined();
            expect(neighbors.left?.seatIndex).toBe(1); // 玩家2
            expect(neighbors.right).toBeDefined();
            expect(neighbors.right?.seatIndex).toBe(3); // 玩家4
        });

        it('第一个玩家的左邻居应该是最后一个', () => {
            const player = players[0];
            const neighbors = getNeighbors(player, players);

            expect(neighbors.left?.seatIndex).toBe(5); // 最后一个玩家
            expect(neighbors.right?.seatIndex).toBe(1);
        });

        it('最后一个玩家的右邻居应该是第一个', () => {
            const player = players[5];
            const neighbors = getNeighbors(player, players);

            expect(neighbors.left?.seatIndex).toBe(4);
            expect(neighbors.right?.seatIndex).toBe(0); // 第一个玩家
        });

        it('应该跳过死亡的邻居', () => {
            const playersWithDead = players.map((p, i) =>
                i === 1 ? { ...p, isDead: true } : p
            );

            const player = playersWithDead[2];
            const neighbors = getNeighbors(player, playersWithDead);

            // 左邻居应该跳过死亡的玩家2
            expect(neighbors.left?.seatIndex).not.toBe(1);
        });
    });

    describe('isEvil / isDemon', () => {
        it('应该正确识别邪恶玩家', () => {
            expect(isEvil(players[4])).toBe(true); // poisoner (爪牙)
            expect(isEvil(players[5])).toBe(true); // imp (恶魔)
            expect(isEvil(players[0])).toBe(false); // washerwoman (镇民)
        });

        it('应该正确识别恶魔', () => {
            expect(isDemon(players[5])).toBe(true);  // imp
            expect(isDemon(players[4])).toBe(false); // poisoner (爪牙)
            expect(isDemon(players[0])).toBe(false); // washerwoman
        });

        it('没有角色ID的玩家不应该是邪恶', () => {
            const noCharacter = { ...players[0], characterId: null };
            expect(isEvil(noCharacter)).toBe(false);
            expect(isDemon(noCharacter)).toBe(false);
        });
    });

    describe('countAliveEvil / countAliveDemon', () => {
        it('应该正确统计存活的邪恶玩家', () => {
            const count = countAliveEvil(players);
            expect(count).toBe(2); // poisoner + imp
        });

        it('应该正确统计存活的恶魔', () => {
            const count = countAliveDemon(players);
            expect(count).toBe(1); // imp
        });

        it('应该排除死亡的邪恶玩家', () => {
            const playersWithDead = players.map((p, i) =>
                i === 5 ? { ...p, isDead: true } : p
            );

            const evilCount = countAliveEvil(playersWithDead);
            const demonCount = countAliveDemon(playersWithDead);

            expect(evilCount).toBe(1); // 只剩 poisoner
            expect(demonCount).toBe(0); // imp 已死
        });
    });

    describe('Ability Execution', () => {
        it('应该能注册和执行能力处理器', async () => {
            let executed = false;

            registerAbilityHandler('test_character', async (actorId, targetIds, context) => {
                executed = true;
                return {
                    actorId,
                    targetIds,
                    success: true,
                    data: { test: 'success' }
                };
            });

            const context: AbilityContext = {
                players,
                night: 1,
                isFirstNight: false
            };

            const result = await executeAbility('test_character', 'p1', ['p2'], context);

            expect(executed).toBe(true);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ test: 'success' });
        });

        it('未注册的能力应该返回默认成功', async () => {
            const context: AbilityContext = {
                players,
                night: 1,
                isFirstNight: false
            };

            const result = await executeAbility('unregistered_character', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.message).toContain('尚未实现');
        });

        it('能力处理器抛出错误应该返回失败', async () => {
            registerAbilityHandler('error_character', async () => {
                throw new Error('Test error');
            });

            const context: AbilityContext = {
                players,
                night: 1,
                isFirstNight: false
            };

            const result = await executeAbility('error_character', 'p1', undefined, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error');
        });
    });
});
