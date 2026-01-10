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
import { createPlayer, Team, ErrorInfoMode, type Player, type GameConfig } from '../../types/game';

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
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('undertaker', '殓葬师', 0), characterId: 'undertaker' },
                    { ...createPlayer('victim', '受害者', 1), characterId: 'washerwoman', isDead: true }
                ],
                night: 2,
                isFirstNight: false,
                executionHistory: []
            };
        });

        it('昨天没有处决时应返回无处决信息', async () => {
            // 没有处决历史
            context.executionHistory = [];

            const result = await executeAbility('undertaker', 'undertaker', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasExecution).toBe(false);
            expect(result.data?.message).toBe('昨天没有人被处决');
        });

        it('应该正确返回昨天被处决玩家的角色', async () => {
            // 添加处决历史（day 2对应night 2）
            context.executionHistory = [
                {
                    day: 2,
                    executedId: 'victim',
                    executedCharacterId: 'washerwoman',
                    nominatorId: 'someone'
                }
            ];

            const result = await executeAbility('undertaker', 'undertaker', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasExecution).toBe(true);
            expect(result.data?.executedPlayerId).toBe('victim');
            expect(result.data?.executedPlayerName).toBe('受害者');
            expect(result.data?.characterId).toBe('washerwoman');
            expect(result.data?.characterName).toBe('洗衣妇');
            expect(result.data?.message).toContain('受害者');
            expect(result.data?.message).toContain('洗衣妇');
        });

        it('应该忽略更早的处决记录', async () => {
            // 有多天的处决记录
            context.executionHistory = [
                {
                    day: 1,
                    executedId: 'other',
                    executedCharacterId: 'monk',
                    nominatorId: 'someone'
                },
                {
                    day: 2,
                    executedId: 'victim',
                    executedCharacterId: 'washerwoman',
                    nominatorId: 'someone'
                }
            ];

            const result = await executeAbility('undertaker', 'undertaker', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasExecution).toBe(true);
            // 应该返回day 2的处决，而不是day 1
            expect(result.data?.executedPlayerId).toBe('victim');
            expect(result.data?.characterId).toBe('washerwoman');
        });

        it('首夜（night 0）查询应该查找day 0的处决（通常没有）', async () => {
            context.night = 0;
            context.isFirstNight = true;
            context.executionHistory = [];

            const result = await executeAbility('undertaker', 'undertaker', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.hasExecution).toBe(false);
        });

        it('玩家不存在应该失败', async () => {
            const result = await executeAbility('undertaker', 'nonexistent', undefined, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('玩家不存在');
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

    // ============================================================
    // 僧侣保护系统测试
    // ============================================================

    describe('僧侣保护系统', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('monk', '僧侣', 0), characterId: 'monk' },
                    { ...createPlayer('target', '目标', 1), characterId: 'washerwoman' },
                    { ...createPlayer('imp', '小恶魔', 2), characterId: 'imp' }
                ],
                night: 1,
                isFirstNight: false,
                protectedPlayers: new Set()
            };
        });

        it('僧侣保护应该阻止恶魔攻击', async () => {
            // 僧侣保护目标
            const monkResult = await executeAbility('monk', 'monk', ['target'], context);
            expect(monkResult.success).toBe(true);
            expect(monkResult.data?.protectedPlayerId).toBe('target');

            // 将被保护的玩家添加到保护集合
            context.protectedPlayers = new Set([monkResult.data?.protectedPlayerId as string]);

            // 恶魔攻击被保护的目标
            const impResult = await executeAbility('imp', 'imp', ['target'], context);
            expect(impResult.success).toBe(true);
            expect(impResult.data?.killed).toBe(false);
            expect(impResult.data?.reason).toBe('目标被僧侣保护');
        });

        it('僧侣不能保护自己', async () => {
            const result = await executeAbility('monk', 'monk', ['monk'], context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('僧侣不能保护自己');
        });

        it('僧侣不能保护已死亡的玩家', async () => {
            context.players[1].isDead = true;

            const result = await executeAbility('monk', 'monk', ['target'], context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('不能保护已死亡的玩家');
        });

        it('保护状态不影响士兵免疫', async () => {
            context.players[1].characterId = 'soldier';

            // 恶魔攻击士兵（士兵免疫优先于保护检查）
            const result = await executeAbility('imp', 'imp', ['target'], context);
            expect(result.success).toBe(true);
            expect(result.data?.killed).toBe(false);
            expect(result.data?.reason).toBe('目标是士兵，免疫攻击');
        });

        it('未被保护的玩家应该被恶魔杀死', async () => {
            // 不设置保护状态
            const result = await executeAbility('imp', 'imp', ['target'], context);
            expect(result.success).toBe(true);
            expect(result.data?.killed).toBe(true);
            expect(result.data?.victimId).toBe('target');
        });
    });

    // ============================================================
    // 中毒/醉酒系统测试
    // ============================================================

    describe('中毒/醉酒系统', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('empath', '共情者', 0), characterId: 'empath', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('poisoner', '中毒者', 1), characterId: 'poisoner', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('washer', '洗衣妇', 2), characterId: 'washerwoman', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                ],
                night: 1,
                isFirstNight: true
            };
        });

        describe('自定义模式 (CUSTOM)', () => {
            it('应该使用说书人提供的自定义信息', async () => {
                // 设置共情者为中毒状态
                context.players[0].status.poisoned = true;

                // 说书人提供自定义错误信息
                context.config = { errorInfoMode: ErrorInfoMode.CUSTOM };
                context.customErrorInfo = {
                    'empath': { evilNeighborCount: 1, custom: true }
                };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                expect(result.data?.evilNeighborCount).toBe(1);
                expect(result.data?.custom).toBe(true);
            });

            it('中毒但无自定义信息时应返回原始结果', async () => {
                context.players[0].status.poisoned = true;
                context.config = { errorInfoMode: ErrorInfoMode.CUSTOM };
                // 不提供 customErrorInfo

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 应该返回实际的邪恶邻居数（1，因为有poisoner）
                expect(result.data?.evilNeighborCount).toBe(1);
            });
        });

        describe('随机模式 (RANDOM)', () => {
            it('应该为共情者生成随机邪恶邻居数（0-2）', async () => {
                context.players[0].status.poisoned = true;
                context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                expect(result.data?.evilNeighborCount).toBeGreaterThanOrEqual(0);
                expect(result.data?.evilNeighborCount).toBeLessThanOrEqual(2);
                expect(Number.isInteger(result.data?.evilNeighborCount)).toBe(true);
            });

            it('应该为占卜师生成随机布尔值', async () => {
                context.players[0].characterId = 'fortune_teller';
                context.players[0].status.drunk = true;
                context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

                const result = await executeAbility('fortune_teller', 'empath', ['poisoner', 'washer'], context);

                expect(result.success).toBe(true);
                expect(typeof result.data?.hasDemon).toBe('boolean');
            });

            it('多次调用应生成不同的随机值（概率性测试）', async () => {
                context.players[0].status.poisoned = true;
                context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

                const results = new Set<number>();
                // 运行10次，应该至少有2个不同值
                for (let i = 0; i < 10; i++) {
                    const result = await executeAbility('empath', 'empath', undefined, context);
                    results.add(result.data?.evilNeighborCount as number);
                }

                // 10次中至少应该有2个不同的值（概率极高）
                expect(results.size).toBeGreaterThanOrEqual(2);
            });
        });

        describe('基于规则模式 (RULE_BASED)', () => {
            it('应该为共情者显示相反的邪恶邻居数', async () => {
                // 实际情况：empath 的邻居是 washer(善良) 和 poisoner(邪恶) = 1
                context.players[0].status.poisoned = true;
                context.config = { errorInfoMode: ErrorInfoMode.RULE_BASED };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 2 - 1 = 1，但实际应该是显示相反
                // 让我重新理解：规则是 2 - original，所以如果原本是1，应该变成1
                // 不对，让我检查 applyErrorRules 函数的逻辑
                // data.evilNeighborCount = 2 - data.evilNeighborCount;
                // 原本是1，应该变成 2-1=1
                // 等等，让我计算实际邻居数
                // empath(索引0) 的邻居：左边是索引2(washer-善良)，右边是索引1(poisoner-邪恶)
                // 所以实际邪恶邻居数是1
                // 规则转换：2 - 1 = 1
                expect(result.data?.evilNeighborCount).toBe(1);
            });

            it('应该为占卜师显示相反的恶魔结果', async () => {
                context.players[0].characterId = 'fortune_teller';
                context.players[0].status.drunk = true;
                context.players[2].characterId = 'imp'; // 将washer改成imp（恶魔）
                context.config = { errorInfoMode: ErrorInfoMode.RULE_BASED };

                const result = await executeAbility('fortune_teller', 'empath', ['poisoner', 'washer'], context);

                // 实际：poisoner不是恶魔，washer现在是imp(恶魔)，所以hasDemon = true
                // 规则：显示相反，所以应该返回 false
                expect(result.success).toBe(true);
                expect(result.data?.hasDemon).toBe(false);
            });

            it('邪恶邻居数为0时应显示2', async () => {
                // 修改玩家配置，使共情者两边都是善良
                context.players = [
                    { ...createPlayer('washer1', '洗衣妇1', 0), characterId: 'washerwoman', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('empath', '共情者', 1), characterId: 'empath', status: { poisoned: true, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('washer2', '洗衣妇2', 2), characterId: 'washerwoman', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                ];
                context.config = { errorInfoMode: ErrorInfoMode.RULE_BASED };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 实际邻居数：0，规则转换：2 - 0 = 2
                expect(result.data?.evilNeighborCount).toBe(2);
            });

            it('邪恶邻居数为2时应显示0', async () => {
                // 修改玩家配置，使共情者两边都是邪恶
                context.players = [
                    { ...createPlayer('poisoner', '中毒者', 0), characterId: 'poisoner', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('empath', '共情者', 1), characterId: 'empath', status: { poisoned: true, drunk: false, protected: false, customMarkers: [] } },
                    { ...createPlayer('imp', '小恶魔', 2), characterId: 'imp', status: { poisoned: false, drunk: false, protected: false, customMarkers: [] } },
                ];
                context.config = { errorInfoMode: ErrorInfoMode.RULE_BASED };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 实际邻居数：2，规则转换：2 - 2 = 0
                expect(result.data?.evilNeighborCount).toBe(0);
            });
        });

        describe('未中毒/醉酒时不应用错误信息', () => {
            it('共情者未中毒应返回正确信息', async () => {
                // empath 未中毒
                context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 应该返回实际的邪恶邻居数（1）
                expect(result.data?.evilNeighborCount).toBe(1);
            });

            it('占卜师未醉酒应返回正确信息', async () => {
                context.players[0].characterId = 'fortune_teller';
                // 不修改其他玩家角色，保持poisoner和washerwoman都不是恶魔
                context.config = { errorInfoMode: ErrorInfoMode.RULE_BASED };

                const result = await executeAbility('fortune_teller', 'empath', ['poisoner', 'washer'], context);

                expect(result.success).toBe(true);
                // poisoner是爪牙（不是恶魔），washerwoman是镇民（不是恶魔）
                // 所以应该返回false（没有恶魔）
                expect(result.data?.hasDemon).toBe(false);
            });
        });

        describe('无配置时的默认行为', () => {
            it('无config时应返回原始结果', async () => {
                context.players[0].status.poisoned = true;
                // 不设置 context.config

                const result = await executeAbility('empath', 'empath', undefined, context);

                expect(result.success).toBe(true);
                // 应该返回实际结果（因为无配置，wrapPoisonedAbility会直接返回原始结果）
                expect(result.data?.evilNeighborCount).toBe(1);
            });
        });
    });

    // ============================================================
    // 厨师能力测试
    // ============================================================

    describe('厨师能力系统', () => {
        it('无邪恶玩家相邻时应返回0', async () => {
            const context: AbilityContext = {
                players: [
                    { ...createPlayer('chef', '厨师', 0), characterId: 'chef' },
                    { ...createPlayer('washer', '洗衣妇', 1), characterId: 'washerwoman' },
                    { ...createPlayer('empath', '共情者', 2), characterId: 'empath' },
                ],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'chef', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.evilPairs).toBe(0);
            expect(result.data?.message).toContain('0 对');
        });

        it('1对邪恶玩家相邻时应返回1', async () => {
            const context: AbilityContext = {
                players: [
                    { ...createPlayer('chef', '厨师', 0), characterId: 'chef' },
                    { ...createPlayer('poisoner', '投毒者', 1), characterId: 'poisoner' },
                    { ...createPlayer('imp', '小恶魔', 2), characterId: 'imp' },
                    { ...createPlayer('washer', '洗衣妇', 3), characterId: 'washerwoman' },
                ],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'chef', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.evilPairs).toBe(1);
            expect(result.data?.message).toContain('1 对');
        });

        it('多对邪恶玩家相邻时应返回正确数量', async () => {
            const context: AbilityContext = {
                players: [
                    { ...createPlayer('poisoner', '投毒者', 0), characterId: 'poisoner' },
                    { ...createPlayer('imp', '小恶魔', 1), characterId: 'imp' },
                    { ...createPlayer('washer', '洗衣妇', 2), characterId: 'washerwoman' },
                    { ...createPlayer('scarlet', '猩红女郎', 3), characterId: 'scarlet_woman' },
                    { ...createPlayer('spy', '间谍', 4), characterId: 'spy' },
                    { ...createPlayer('chef', '厨师', 5), characterId: 'chef' },
                ],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'chef', undefined, context);

            expect(result.success).toBe(true);
            // poisoner-imp (1对) + scarlet-spy (1对) = 2对
            expect(result.data?.evilPairs).toBe(2);
        });

        it('死亡玩家不应计入统计', async () => {
            const context: AbilityContext = {
                players: [
                    { ...createPlayer('chef', '厨师', 0), characterId: 'chef' },
                    { ...createPlayer('poisoner', '投毒者', 1), characterId: 'poisoner', isDead: true },
                    { ...createPlayer('imp', '小恶魔', 2), characterId: 'imp' },
                ],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'chef', undefined, context);

            expect(result.success).toBe(true);
            // poisoner已死，不应计入
            expect(result.data?.evilPairs).toBe(0);
        });

        it('3人游戏边界情况', async () => {
            const context: AbilityContext = {
                players: [
                    { ...createPlayer('imp', '小恶魔', 0), characterId: 'imp' },
                    { ...createPlayer('poisoner', '投毒者', 1), characterId: 'poisoner' },
                    { ...createPlayer('chef', '厨师', 2), characterId: 'chef' },
                ],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'chef', undefined, context);

            expect(result.success).toBe(true);
            // imp-poisoner (索引0-1), poisoner-chef (索引1-2), chef-imp (索引2-0)
            // 只有 imp-poisoner 是邪恶对
            expect(result.data?.evilPairs).toBe(1);
        });

        it('玩家不存在应该失败', async () => {
            const context: AbilityContext = {
                players: [],
                night: 0,
                isFirstNight: true
            };

            const result = await executeAbility('chef', 'nonexistent', undefined, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('玩家不存在');
        });
    });

    // ============================================================
    // 投毒者能力测试
    // ============================================================

    describe('投毒者能力系统', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('poisoner', '投毒者', 0), characterId: 'poisoner' },
                    { ...createPlayer('empath', '共情者', 1), characterId: 'empath' },
                    { ...createPlayer('washer', '洗衣妇', 2), characterId: 'washerwoman', isDead: false },
                ],
                night: 1,
                isFirstNight: false
            };
        });

        it('应该成功投毒目标玩家', async () => {
            const result = await executeAbility('poisoner', 'poisoner', ['empath'], context);

            expect(result.success).toBe(true);
            expect(result.data?.poisonedPlayerId).toBe('empath');
            expect(result.data?.poisonedPlayerName).toBe('共情者');
            expect(result.data?.message).toContain('投毒者毒害了');
        });

        it('没有选择目标应该失败', async () => {
            const result = await executeAbility('poisoner', 'poisoner', [], context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('必须选择一个目标');
        });

        it('目标玩家不存在应该失败', async () => {
            const result = await executeAbility('poisoner', 'poisoner', ['nonexistent'], context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('目标玩家不存在');
        });

        it('目标玩家已死亡应该失败', async () => {
            context.players[2].isDead = true;

            const result = await executeAbility('poisoner', 'poisoner', ['washer'], context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('目标玩家已死亡');
        });

        it('投毒者不存在应该失败', async () => {
            const result = await executeAbility('poisoner', 'nonexistent', ['empath'], context);

            expect(result.success).toBe(false);
            expect(result.error).toBe('玩家不存在');
        });

        it('中毒状态应该影响能力结果（与中毒系统集成）', async () => {
            // 首先让投毒者毒害共情者
            const poisonResult = await executeAbility('poisoner', 'poisoner', ['empath'], context);
            expect(poisonResult.success).toBe(true);

            // 应用中毒状态
            context.players[1].status.poisoned = true;

            // 创建一个有邪恶邻居的场景
            context.players.push(
                { ...createPlayer('imp', '小恶魔', 3), characterId: 'imp' }
            );
            context.players[1].seatIndex = 1; // empath 在中间
            context.players[0].seatIndex = 0; // poisoner 左边
            context.players[3].seatIndex = 2; // imp 右边（邻居）

            // 配置随机错误模式
            context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

            // 执行共情者能力，应该得到错误信息
            const empathResult = await executeAbility('empath', 'empath', undefined, context);

            expect(empathResult.success).toBe(true);
            // 因为中毒，结果应该是随机的（0-2之间）
            expect(empathResult.data?.evilNeighborCount).toBeGreaterThanOrEqual(0);
            expect(empathResult.data?.evilNeighborCount).toBeLessThanOrEqual(2);
        });

        it('清除中毒状态后应该返回正确信息', async () => {
            // 首先中毒共情者
            context.players[1].status.poisoned = true;
            context.config = { errorInfoMode: ErrorInfoMode.RANDOM };

            // 中毒时执行能力
            const poisonedResult = await executeAbility('empath', 'empath', undefined, context);
            // 结果可能是任意的

            // 清除中毒状态（新的一天开始）
            context.players[1].status.poisoned = false;

            // 再次执行能力，应该返回正确结果
            const cleanResult = await executeAbility('empath', 'empath', undefined, context);

            expect(cleanResult.success).toBe(true);
            // empath的邻居：poisoner(左)和washer(右)，只有poisoner是邪恶
            expect(cleanResult.data?.evilNeighborCount).toBe(1);
        });

        it('投毒者可以每晚选择不同目标', async () => {
            const result1 = await executeAbility('poisoner', 'poisoner', ['empath'], context);
            expect(result1.success).toBe(true);
            expect(result1.data?.poisonedPlayerId).toBe('empath');

            const result2 = await executeAbility('poisoner', 'poisoner', ['washer'], context);
            expect(result2.success).toBe(true);
            expect(result2.data?.poisonedPlayerId).toBe('washer');
        });
    });

    // ============================================================
    // 红鲱鱼系统测试
    // ============================================================

    describe('红鲱鱼系统', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('ft', '占卜师', 0), characterId: 'fortune_teller' },
                    { ...createPlayer('washer', '洗衣妇', 1), characterId: 'washerwoman' }, // 善良
                    { ...createPlayer('empath', '共情者', 2), characterId: 'empath' }, // 善良
                    { ...createPlayer('monk', '僧侣', 3), characterId: 'monk' }, // 善良
                ],
                night: 0,
                isFirstNight: true
            };
        });

        it('没有红鲱鱼时查看两名善良玩家应显示无恶魔', async () => {
            // 不设置 redHerringPlayerId

            const result = await executeAbility('fortune_teller', 'ft', ['washer', 'empath'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(false);
            expect(result.data?.isRedHerring).toBeFalsy();
        });

        it('占卜师查看红鲱鱼应显示有恶魔', async () => {
            context.redHerringPlayerId = 'washer'; // 洗衣妇是红鲱鱼

            const result = await executeAbility('fortune_teller', 'ft', ['washer', 'empath'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(true); // 红鲱鱼被误判为恶魔
            expect(result.data?.isRedHerring).toBe(true);
        });

        it('占卜师查看非红鲱鱼的善良玩家应显示无恶魔', async () => {
            context.redHerringPlayerId = 'washer'; // 洗衣妇是红鲱鱼

            const result = await executeAbility('fortune_teller', 'ft', ['empath', 'monk'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(false); // 没有恶魔
            expect(result.data?.isRedHerring).toBe(false);
        });

        it('红鲱鱼 + 真恶魔同时被查看应显示有恶魔', async () => {
            context.redHerringPlayerId = 'washer';
            context.players.push(
                { ...createPlayer('imp', '小恶魔', 4), characterId: 'imp' }
            );

            const result = await executeAbility('fortune_teller', 'ft', ['washer', 'imp'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(true); // 真恶魔存在
            // isRedHerring 仍然为 true，因为红鲱鱼在查看范围内
            expect(result.data?.isRedHerring).toBe(true);
        });

        it('只查看真恶魔（不含红鲱鱼）应显示有恶魔', async () => {
            context.redHerringPlayerId = 'washer';
            context.players.push(
                { ...createPlayer('imp', '小恶魔', 4), characterId: 'imp' }
            );

            const result = await executeAbility('fortune_teller', 'ft', ['imp', 'empath'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(true); // 真恶魔
            expect(result.data?.isRedHerring).toBe(false); // 没有查看红鲱鱼
        });

        it('红鲱鱼在两个目标之一时应正确标记', async () => {
            context.redHerringPlayerId = 'empath'; // empath 是红鲱鱼

            const result = await executeAbility('fortune_teller', 'ft', ['washer', 'empath'], context);

            expect(result.success).toBe(true);
            expect(result.data?.hasDemon).toBe(true);
            expect(result.data?.isRedHerring).toBe(true);
            expect(result.data?.target1Id).toBe('washer');
            expect(result.data?.target2Id).toBe('empath');
        });
    });

    describe('Butler (管家) 能力', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('butler', '管家', 0), characterId: 'butler' },
                    { ...createPlayer('master1', '主人1', 1), characterId: 'washerwoman' },
                    { ...createPlayer('master2', '主人2', 2), characterId: 'empath' }
                ],
                night: 1,
                isFirstNight: false
            };
        });

        it('管家应该能选择一名玩家作为主人', async () => {
            const result = await executeAbility('butler', 'butler', ['master1'], context);

            expect(result.success).toBe(true);
            expect(result.data?.butlerMasterId).toBe('master1');
            expect(result.data?.butlerMasterName).toBe('主人1');
        });

        it('管家不能选择自己作为主人', async () => {
            const result = await executeAbility('butler', 'butler', ['butler'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不能选择自己');
        });

        it('管家必须选择一个目标', async () => {
            const result = await executeAbility('butler', 'butler', [], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('必须选择');
        });

        it('管家不能选择不存在的玩家', async () => {
            const result = await executeAbility('butler', 'butler', ['nonexistent'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('管家不能选择已死亡的玩家作为主人', async () => {
            context.players[1] = { ...context.players[1], isDead: true };

            const result = await executeAbility('butler', 'butler', ['master1'], context);

            expect(result.success).toBe(false);
            expect(result.error).toContain('已死亡');
        });
    });

    describe('Recluse (隐士) 能力', () => {
        let context: AbilityContext;

        beforeEach(() => {
            context = {
                players: [
                    { ...createPlayer('recluse', '隐士', 0), characterId: 'recluse' }
                ],
                night: 1,
                isFirstNight: false
            };
        });

        it('隐士能力应该返回说书人提示', async () => {
            const result = await executeAbility('recluse', 'recluse', undefined, context);

            expect(result.success).toBe(true);
            expect(result.data?.role).toBe('recluse');
            expect(result.data?.message).toContain('可能被');
            expect(result.data?.message).toContain('邪恶');
        });

        it('隐士能力不需要目标', async () => {
            const result = await executeAbility('recluse', 'recluse', [], context);

            expect(result.success).toBe(true);
        });
    });
});
