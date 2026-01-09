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

        it('应该返回所有邻居（包括死亡的）', () => {
            const playersWithDead = players.map((p, i) =>
                i === 1 ? { ...p, isDead: true } : p
            );

            const player = playersWithDead[2];
            const neighbors = getNeighbors(player, playersWithDead);

            // 应该返回左邻居（即使已死亡），用于共情者等角色
            expect(neighbors.left?.seatIndex).toBe(1);
            expect(neighbors.left?.isDead).toBe(true);
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

    // ============================================================
    // 角色能力处理器详细测试
    // ============================================================

    describe('Imp 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 2,
            isFirstNight: false
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '小恶魔', 0), characterId: 'imp' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' },
                { ...createPlayer('p3', '士兵', 2), characterId: 'soldier' },
                { ...createPlayer('p4', '死亡者', 3), characterId: 'empath', isDead: true }
            ];
        });

        it('应该成功杀死目标', async () => {
            const result = await executeAbility('imp', 'p1', ['p2'], context);

            expect(result.success).toBe(true);
            expect(result.data?.killed).toBe(true);
            expect(result.data?.victimId).toBe('p2');
        });

        it('没有目标应该失败', async () => {
            const result = await executeAbility('imp', 'p1', [], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('目标');
        });

        it('目标不存在应该失败', async () => {
            const result = await executeAbility('imp', 'p1', ['non_existent'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('目标已死亡应该失败', async () => {
            const result = await executeAbility('imp', 'p1', ['p4'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('已死亡');
        });

        it('士兵应该免疫攻击', async () => {
            const result = await executeAbility('imp', 'p1', ['p3'], context);

            expect(result.success).toBe(true);
            expect(result.data?.killed).toBe(false);
            expect(result.data?.reason).toContain('士兵');
        });
    });

    describe('Empath 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '共情者', 0), characterId: 'empath' },
                { ...createPlayer('p2', '中毒者', 1), characterId: 'poisoner' },  // 邪恶
                { ...createPlayer('p3', '村民', 2), characterId: 'washerwoman' },
                { ...createPlayer('p4', '小恶魔', 3), characterId: 'imp' },  // 邪恶
                { ...createPlayer('p5', '僧侣', 4), characterId: 'monk' },
                { ...createPlayer('p6', '士兵', 5), characterId: 'soldier' },
            ];
        });

        it('应该正确检测邻居中的邪恶玩家数量', async () => {
            const result = await executeAbility('empath', 'p1', undefined, context);

            expect(result.success).toBe(true);
            // p1 的邻居是 p6(士兵-善良) 和 p2(中毒者-邪恶)
            expect(result.data?.evilNeighborCount).toBe(1);
        });

        it('两边都是邪恶时应该返回2', async () => {
            // 修改玩家位置使共情者两边都是邪恶
            context.players = [
                { ...createPlayer('p1', '中毒者', 0), characterId: 'poisoner' },  // 邪恶
                { ...createPlayer('p2', '共情者', 1), characterId: 'empath' },
                { ...createPlayer('p3', '小恶魔', 2), characterId: 'imp' },  // 邪恶
            ];

            const result = await executeAbility('empath', 'p2', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.evilNeighborCount).toBe(2);
        });

        it('两边都是善良时应该返回0', async () => {
            context.players = [
                { ...createPlayer('p1', '村民1', 0), characterId: 'washerwoman' },
                { ...createPlayer('p2', '共情者', 1), characterId: 'empath' },
                { ...createPlayer('p3', '村民2', 2), characterId: 'librarian' },
            ];

            const result = await executeAbility('empath', 'p2', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.evilNeighborCount).toBe(0);
        });

        it('玩家不存在应该失败', async () => {
            const result = await executeAbility('empath', 'non_existent', undefined, context);

            expect(result.success).toBe(false);
        });
    });

    describe('Fortune Teller 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '占卜师', 0), characterId: 'fortune_teller' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' },
                { ...createPlayer('p3', '小恶魔', 2), characterId: 'imp' },
            ];
        });

        it('选择两个善良玩家应该返回无恶魔', async () => {
            // 添加第二个善良玩家
            context.players.push({ ...createPlayer('p4', '村民2', 3), characterId: 'librarian' });

            const result = await executeAbility('fortune_teller', 'p1', ['p2', 'p4'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(false);
        });

        it('选择包含恶魔的玩家应该返回有恶魔', async () => {
            const result = await executeAbility('fortune_teller', 'p1', ['p2', 'p3'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(true);
        });

        it('选择不够两个玩家应该失败', async () => {
            const result = await executeAbility('fortune_teller', 'p1', ['p2'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('两名玩家');
        });

        it('目标玩家不存在应该失败', async () => {
            const result = await executeAbility('fortune_teller', 'p1', ['p2', 'non_existent'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    describe('Monk 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 2,
            isFirstNight: false
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '僧侣', 0), characterId: 'monk' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' },
                { ...createPlayer('p3', '死亡者', 2), characterId: 'empath', isDead: true }
            ];
        });

        it('应该成功保护目标玩家', async () => {
            const result = await executeAbility('monk', 'p1', ['p2'], context);

            expect(result.success).toBe(true);
            expect(result.data?.protectedPlayerId).toBe('p2');
        });

        it('不能保护自己', async () => {
            const result = await executeAbility('monk', 'p1', ['p1'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不能保护自己');
        });

        it('没有选择目标应该失败', async () => {
            const result = await executeAbility('monk', 'p1', [], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('必须选择');
        });

        it('不能保护已死亡的玩家', async () => {
            const result = await executeAbility('monk', 'p1', ['p3'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('已死亡');
        });
    });

    describe('Ravenkeeper 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 2,
            isFirstNight: false
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '守鸦人', 0), characterId: 'ravenkeeper' },
                { ...createPlayer('p2', '小恶魔', 1), characterId: 'imp' }
            ];
        });

        it('应该成功查看目标玩家角色', async () => {
            const result = await executeAbility('ravenkeeper', 'p1', ['p2'], context);

            expect(result.success).toBe(true);
            expect(result.data?.targetCharacterId).toBe('imp');
        });

        it('没有选择目标应该失败', async () => {
            const result = await executeAbility('ravenkeeper', 'p1', [], context);

            expect(result.success).toBe(false);
        });

        it('目标不存在应该失败', async () => {
            const result = await executeAbility('ravenkeeper', 'p1', ['non_existent'], context);

            expect(result.success).toBe(false);
        });
    });

    describe('Spy 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '间谍', 0), characterId: 'spy' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' },
                { ...createPlayer('p3', '小恶魔', 2), characterId: 'imp' }
            ];
        });

        it('应该返回所有玩家信息', async () => {
            const result = await executeAbility('spy', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.grimoireInfo).toHaveLength(3);
            expect(result.data?.grimoireInfo[0].characterId).toBe('spy');
            expect(result.data?.grimoireInfo[1].characterId).toBe('washerwoman');
            expect(result.data?.grimoireInfo[2].characterId).toBe('imp');
        });
    });

    describe('Investigator 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '调查员', 0), characterId: 'investigator' },
                { ...createPlayer('p2', '中毒者', 1), characterId: 'poisoner' },  // 爪牙
                { ...createPlayer('p3', '村民', 2), characterId: 'washerwoman' }
            ];
        });

        it('存在爪牙时应该返回正确信息', async () => {
            const result = await executeAbility('investigator', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasMinions).toBe(true);
        });

        it('没有爪牙时应该返回虚假信息提示', async () => {
            context.players = [
                { ...createPlayer('p1', '调查员', 0), characterId: 'investigator' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' }
            ];

            const result = await executeAbility('investigator', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasMinions).toBe(false);
        });
    });

    describe('Librarian 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '图书管理员', 0), characterId: 'librarian' },
                { ...createPlayer('p2', '酒鬼', 1), characterId: 'drunk' },  // 外来者
                { ...createPlayer('p3', '村民', 2), characterId: 'washerwoman' }
            ];
        });

        it('存在外来者时应该返回正确信息', async () => {
            const result = await executeAbility('librarian', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasOutsiders).toBe(true);
        });

        it('没有外来者时应该返回虚假信息提示', async () => {
            context.players = [
                { ...createPlayer('p1', '图书管理员', 0), characterId: 'librarian' },
                { ...createPlayer('p2', '村民', 1), characterId: 'washerwoman' }
            ];

            const result = await executeAbility('librarian', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasOutsiders).toBe(false);
        });
    });

    describe('Washerwoman 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 1,
            isFirstNight: true
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '洗衣妇', 0), characterId: 'washerwoman' },
                { ...createPlayer('p2', '共情者', 1), characterId: 'empath' },  // 镇民
                { ...createPlayer('p3', '酒鬼', 2), characterId: 'drunk' }  // 外来者
            ];
        });

        it('应该返回可用的镇民数量', async () => {
            const result = await executeAbility('washerwoman', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.availableTownsfolk).toBe(1);  // empath（不包括自己）
        });
    });

    describe('Undertaker 能力处理器', () => {
        const context: AbilityContext = {
            players: [],
            night: 2,
            isFirstNight: false
        };

        beforeEach(() => {
            context.players = [
                { ...createPlayer('p1', '殓葬师', 0), characterId: 'undertaker' }
            ];
        });

        it('应该成功执行并返回提示信息', async () => {
            const result = await executeAbility('undertaker', 'p1', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.role).toBe('undertaker');
        });
    });

    // ============================================================
    // 边界情况和特殊场景测试
    // ============================================================

    describe('边界情况', () => {
        it('所有玩家都没有角色ID时应该返回空队列', () => {
            const playersWithoutCharacters = [
                { ...createPlayer('p1', '玩家1', 0), characterId: null },
                { ...createPlayer('p2', '玩家2', 1), characterId: null }
            ];

            const queue = buildNightQueue(playersWithoutCharacters, true, 0);
            expect(queue.actions).toHaveLength(0);
        });

        it('所有玩家都死亡时应该返回空队列', () => {
            const deadPlayers = players.map(p => ({ ...p, isDead: true }));
            const queue = buildNightQueue(deadPlayers, true, 0);
            expect(queue.actions).toHaveLength(0);
        });

        it('只有一个玩家时邻居应该是自己', () => {
            const singlePlayer = [{ ...createPlayer('p1', '玩家1', 0), characterId: 'empath' }];
            const neighbors = getNeighbors(singlePlayer[0], singlePlayer);

            expect(neighbors.left?.id).toBe('p1');
            expect(neighbors.right?.id).toBe('p1');
        });

        it('两个玩家时邻居应该互为左右', () => {
            const twoPlayers = [
                { ...createPlayer('p1', '玩家1', 0), characterId: 'empath' },
                { ...createPlayer('p2', '玩家2', 1), characterId: 'washerwoman' }
            ];

            const neighbors1 = getNeighbors(twoPlayers[0], twoPlayers);
            expect(neighbors1.left?.id).toBe('p2');
            expect(neighbors1.right?.id).toBe('p2');

            const neighbors2 = getNeighbors(twoPlayers[1], twoPlayers);
            expect(neighbors2.left?.id).toBe('p1');
            expect(neighbors2.right?.id).toBe('p1');
        });
    });
});
