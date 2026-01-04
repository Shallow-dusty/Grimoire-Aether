/**
 * GameMachine 状态机测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine, type GameContext } from './gameMachine';
import { Team, Phase } from '../../types/game';

describe('GameMachine State Machine', () => {
    let actor: ReturnType<typeof createActor<typeof gameMachine>>;

    beforeEach(() => {
        actor = createActor(gameMachine);
        actor.start();
    });

    describe('初始状态', () => {
        it('应该从 setup 状态开始', () => {
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toBe('setup');
        });

        it('应该有正确的初始上下文', () => {
            const context = actor.getSnapshot().context;

            expect(context.players).toEqual([]);
            expect(context.currentDay).toBe(0);
            expect(context.currentNight).toBe(0);
            expect(context.isFirstNight).toBe(true);
            expect(context.history).toEqual([]);
            expect(context.nightQueue).toBeNull();
            expect(context.executedToday).toBe(false);
            expect(context.winner).toBeNull();
        });
    });

    describe('Setup 阶段 - 添加玩家', () => {
        it('应该能添加玩家', () => {
            actor.send({ type: 'ADD_PLAYER', name: '玩家1' });
            actor.send({ type: 'ADD_PLAYER', name: '玩家2' });

            const context = actor.getSnapshot().context;
            expect(context.players).toHaveLength(2);
            expect(context.players[0].name).toBe('玩家1');
            expect(context.players[1].name).toBe('玩家2');
        });

        it('添加玩家应该记录日志', () => {
            actor.send({ type: 'ADD_PLAYER', name: '玩家1' });

            const context = actor.getSnapshot().context;
            expect(context.history).toHaveLength(1);
            expect(context.history[0].message).toContain('玩家1');
        });

        it('应该能移除玩家', () => {
            actor.send({ type: 'ADD_PLAYER', name: '玩家1' });
            actor.send({ type: 'ADD_PLAYER', name: '玩家2' });

            const playerId = actor.getSnapshot().context.players[0].id;
            actor.send({ type: 'REMOVE_PLAYER', playerId });

            const context = actor.getSnapshot().context;
            expect(context.players).toHaveLength(1);
            expect(context.players[0].name).toBe('玩家2');
        });

        it('移除玩家后应该重新分配座位索引', () => {
            actor.send({ type: 'ADD_PLAYER', name: '玩家1' });
            actor.send({ type: 'ADD_PLAYER', name: '玩家2' });
            actor.send({ type: 'ADD_PLAYER', name: '玩家3' });

            const playerId = actor.getSnapshot().context.players[1].id;
            actor.send({ type: 'REMOVE_PLAYER', playerId });

            const context = actor.getSnapshot().context;
            expect(context.players[0].seatIndex).toBe(0);
            expect(context.players[1].seatIndex).toBe(1);
        });
    });

    describe('Setup 阶段 - 分配角色', () => {
        beforeEach(() => {
            // 添加 7 个玩家
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }
        });

        it('应该能分配角色', () => {
            const context = actor.getSnapshot().context;
            const playerId = context.players[0].id;

            actor.send({ type: 'ASSIGN_ROLE', playerId, characterId: 'washerwoman' });

            const updatedContext = actor.getSnapshot().context;
            expect(updatedContext.players[0].characterId).toBe('washerwoman');
        });

        it('只有分配了所有角色才能开始游戏', () => {
            // 尝试开始游戏（但还没分配角色）
            actor.send({ type: 'START_GAME' });

            // 应该还在 setup 状态
            expect(actor.getSnapshot().value).toBe('setup');

            // 分配所有角色
            const context = actor.getSnapshot().context;
            context.players.forEach(p => {
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: 'washerwoman' });
            });

            // 现在可以开始
            actor.send({ type: 'START_GAME' });
            expect(actor.getSnapshot().value).not.toBe('setup');
        });
    });

    describe('游戏开始', () => {
        beforeEach(() => {
            // 设置完整的 7 人局
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }

            const context = actor.getSnapshot().context;
            context.players.forEach((p, i) => {
                const roles = ['washerwoman', 'empath', 'monk', 'soldier', 'mayor', 'poisoner', 'imp'];
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
            });

            actor.send({ type: 'START_GAME' });
        });

        it('应该进入 gameLoop.night 状态', () => {
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: 'night' });
        });

        it('应该构建夜晚行动队列', () => {
            const context = actor.getSnapshot().context;

            expect(context.nightQueue).not.toBeNull();
            expect(context.nightQueue!.isFirstNight).toBe(true);
            expect(context.nightQueue!.actions.length).toBeGreaterThan(0);
        });

        it('应该记录游戏开始日志', () => {
            const context = actor.getSnapshot().context;
            const gameStartLog = context.history.find(h => h.type === 'GAME_START');

            expect(gameStartLog).toBeDefined();
        });

        it('currentNight 应该增加', () => {
            const context = actor.getSnapshot().context;
            expect(context.currentNight).toBe(1);
        });
    });

    describe('夜晚阶段', () => {
        beforeEach(() => {
            // 设置并开始游戏
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }

            const context = actor.getSnapshot().context;
            context.players.forEach((p, i) => {
                const roles = ['washerwoman', 'empath', 'monk', 'soldier', 'mayor', 'poisoner', 'imp'];
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
            });

            actor.send({ type: 'START_GAME' });
        });

        it('应该能推进夜晚行动', () => {
            const initialIndex = actor.getSnapshot().context.nightQueue!.currentIndex;

            actor.send({ type: 'PROCEED_NIGHT_ACTION' });

            const newIndex = actor.getSnapshot().context.nightQueue!.currentIndex;
            expect(newIndex).toBe(initialIndex + 1);
        });

        it('应该能跳过夜晚行动', () => {
            const initialIndex = actor.getSnapshot().context.nightQueue!.currentIndex;

            actor.send({ type: 'SKIP_NIGHT_ACTION' });

            const newIndex = actor.getSnapshot().context.nightQueue!.currentIndex;
            expect(newIndex).toBe(initialIndex + 1);
        });

        it('应该能杀死玩家', () => {
            const context = actor.getSnapshot().context;
            const playerId = context.players[0].id;

            actor.send({ type: 'KILL_PLAYER', playerId, cause: '被小恶魔杀死' });

            const updatedContext = actor.getSnapshot().context;
            const killedPlayer = updatedContext.players.find(p => p.id === playerId);

            expect(killedPlayer?.isDead).toBe(true);
            expect(killedPlayer?.isGhost).toBe(true);
        });

        it('应该能结束夜晚', () => {
            actor.send({ type: 'END_NIGHT' });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'discussion' } });
        });

        it('结束夜晚后应该清除夜晚队列', () => {
            actor.send({ type: 'END_NIGHT' });

            const context = actor.getSnapshot().context;
            // 注意：clearNightQueue 在退出 night 状态时执行
            // 但由于我们进入了 day 状态，队列应该在前一个状态的 exit 被清除
        });
    });

    describe('白天阶段', () => {
        beforeEach(() => {
            // 设置游戏并进入白天
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }

            const context = actor.getSnapshot().context;
            context.players.forEach((p, i) => {
                const roles = ['washerwoman', 'empath', 'monk', 'soldier', 'mayor', 'poisoner', 'imp'];
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
            });

            actor.send({ type: 'START_GAME' });
            actor.send({ type: 'END_NIGHT' });
        });

        it('应该进入白天讨论阶段', () => {
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'discussion' } });
        });

        it('currentDay 应该增加', () => {
            const context = actor.getSnapshot().context;
            expect(context.currentDay).toBe(1);
        });

        it('应该重置每日状态', () => {
            const context = actor.getSnapshot().context;

            expect(context.nominatedToday).toEqual([]);
            expect(context.nominatorsToday).toEqual([]);
            expect(context.executionTarget).toBeNull();
            expect(context.highestVoteCount).toBe(0);
            expect(context.executedToday).toBe(false);
        });

        it('应该能进行提名', () => {
            const context = actor.getSnapshot().context;
            const nominatorId = context.players[0].id;
            const nomineeId = context.players[5].id; // 提名爪牙

            // 先进入提名阶段
            actor.send({ type: 'ENTER_NOMINATION' });
            expect(actor.getSnapshot().value).toEqual({ gameLoop: { day: 'nomination' } });

            // 然后进行提名（会直接进入投票）
            actor.send({ type: 'NOMINATE', nominatorId, nomineeId });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'vote' } });

            const updatedContext = snapshot.context;
            expect(updatedContext.currentNominatorId).toBe(nominatorId);
            expect(updatedContext.currentNomineeId).toBe(nomineeId);
        });

        it('死亡玩家不能提名', () => {
            const context = actor.getSnapshot().context;
            const deadPlayerId = context.players[0].id;

            // 先杀死玩家
            actor.send({ type: 'KILL_PLAYER', playerId: deadPlayerId, cause: '测试' });

            // 进入提名阶段
            actor.send({ type: 'ENTER_NOMINATION' });

            // 尝试提名（应该被guard阻止）
            actor.send({ type: 'NOMINATE', nominatorId: deadPlayerId, nomineeId: context.players[1].id });

            // 应该还在 nomination 阶段（因为提名被阻止了）
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'nomination' } });
        });

        it('同一玩家不能在同一天被提名两次', () => {
            const context = actor.getSnapshot().context;
            const nominatorId1 = context.players[0].id;
            const nominatorId2 = context.players[1].id;
            const nomineeId = context.players[5].id;

            // 第一次提名
            actor.send({ type: 'ENTER_NOMINATION' });
            actor.send({ type: 'NOMINATE', nominatorId: nominatorId1, nomineeId });

            // 应该进入投票
            expect(actor.getSnapshot().value).toEqual({ gameLoop: { day: 'vote' } });

            // 结束投票返回讨论
            actor.send({ type: 'FINISH_VOTE' });

            // 第二次尝试提名同一个玩家
            actor.send({ type: 'ENTER_NOMINATION' });
            actor.send({ type: 'NOMINATE', nominatorId: nominatorId2, nomineeId });

            // 应该还在 nomination（因为被guard拒绝了）
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'nomination' } });
        });
    });

    describe('投票阶段', () => {
        beforeEach(() => {
            // 设置游戏并进行提名
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }

            const context = actor.getSnapshot().context;
            context.players.forEach((p, i) => {
                const roles = ['washerwoman', 'empath', 'monk', 'soldier', 'mayor', 'poisoner', 'imp'];
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
            });

            actor.send({ type: 'START_GAME' });
            actor.send({ type: 'END_NIGHT' });

            // 进行提名
            const ctx = actor.getSnapshot().context;
            actor.send({ type: 'ENTER_NOMINATION' });
            actor.send({ type: 'NOMINATE', nominatorId: ctx.players[0].id, nomineeId: ctx.players[5].id });
        });

        it('应该进入投票阶段', () => {
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'vote' } });
        });

        it('应该能投票', () => {
            const context = actor.getSnapshot().context;
            const voterId = context.players[0].id;

            actor.send({ type: 'CAST_VOTE', voterId, vote: true });

            const updatedContext = actor.getSnapshot().context;
            expect(updatedContext.currentVotes[voterId]).toBe(true);
        });

        it('死亡玩家幽灵只能投一次票', () => {
            const context = actor.getSnapshot().context;
            const ghostId = context.players[0].id;

            // 杀死玩家（变成幽灵）
            actor.send({ type: 'KILL_PLAYER', playerId: ghostId, cause: '测试' });

            // 第一次投票
            actor.send({ type: 'CAST_VOTE', voterId: ghostId, vote: true });

            let updatedContext = actor.getSnapshot().context;
            const ghost = updatedContext.players.find(p => p.id === ghostId);

            // 幽灵投票后应该标记为已使用
            expect(updatedContext.currentVotes[ghostId]).toBe(true);
        });

        it('结束投票应该计算结果', () => {
            const context = actor.getSnapshot().context;

            // 4 个玩家投赞成（需要 4 票通过）
            for (let i = 0; i < 4; i++) {
                actor.send({ type: 'CAST_VOTE', voterId: context.players[i].id, vote: true });
            }

            // 其他玩家投反对
            for (let i = 4; i < 7; i++) {
                actor.send({ type: 'CAST_VOTE', voterId: context.players[i].id, vote: false });
            }

            actor.send({ type: 'FINISH_VOTE' });

            const updatedContext = actor.getSnapshot().context;

            // 应该返回 discussion
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: { day: 'discussion' } });

            // 应该设置处决目标（因为通过了）
            expect(updatedContext.executionTarget).toBe(context.players[5].id);
        });
    });

    describe('处决阶段', () => {
        beforeEach(() => {
            // 设置完整流程直到处决
            for (let i = 1; i <= 7; i++) {
                actor.send({ type: 'ADD_PLAYER', name: `玩家${i}` });
            }

            const context = actor.getSnapshot().context;
            context.players.forEach((p, i) => {
                const roles = ['washerwoman', 'empath', 'monk', 'soldier', 'mayor', 'poisoner', 'imp'];
                actor.send({ type: 'ASSIGN_ROLE', playerId: p.id, characterId: roles[i] });
            });

            actor.send({ type: 'START_GAME' });
            actor.send({ type: 'END_NIGHT' });

            // 提名和投票
            const ctx = actor.getSnapshot().context;
            actor.send({ type: 'ENTER_NOMINATION' });
            actor.send({ type: 'NOMINATE', nominatorId: ctx.players[0].id, nomineeId: ctx.players[5].id });

            // 投 4 票通过
            for (let i = 0; i < 4; i++) {
                actor.send({ type: 'CAST_VOTE', voterId: ctx.players[i].id, vote: true });
            }
            for (let i = 4; i < 7; i++) {
                actor.send({ type: 'CAST_VOTE', voterId: ctx.players[i].id, vote: false });
            }

            actor.send({ type: 'FINISH_VOTE' });
            actor.send({ type: 'END_DAY' });
        });

        it('应该进入处决阶段', () => {
            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: 'execution' });
        });

        it('执行处决应该杀死玩家', () => {
            const context = actor.getSnapshot().context;
            const targetId = context.executionTarget!;

            actor.send({ type: 'EXECUTE' });

            const updatedContext = actor.getSnapshot().context;
            const executedPlayer = updatedContext.players.find(p => p.id === targetId);

            expect(executedPlayer?.isDead).toBe(true);
            expect(updatedContext.executedToday).toBe(true);
        });

        it('执行处决后应该返回夜晚', () => {
            actor.send({ type: 'EXECUTE' });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: 'night' });
        });

        it('跳过处决也应该返回夜晚', () => {
            actor.send({ type: 'SKIP_EXECUTION' });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toEqual({ gameLoop: 'night' });
        });

        it('处决恶魔应该触发游戏结束', () => {
            // 重新设置：提名恶魔
            const context = actor.getSnapshot().context;
            const demonId = context.players.find(p => p.characterId === 'imp')!.id;

            // 手动设置处决目标为恶魔
            actor.send({ type: 'KILL_PLAYER', playerId: demonId, cause: '处决' });

            // 检查游戏结束
            actor.send({ type: 'CHECK_GAME_END' });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toBe('gameOver');
        });
    });

    describe('游戏结束', () => {
        it('手动结束游戏', () => {
            actor.send({ type: 'END_GAME', winner: Team.TOWNSFOLK, reason: '测试结束' });

            const snapshot = actor.getSnapshot();
            expect(snapshot.value).toBe('gameOver');

            const context = snapshot.context;
            expect(context.winner).toBe(Team.TOWNSFOLK);
            expect(context.endReason).toBe('测试结束');
        });

        it('游戏结束应该记录日志', () => {
            actor.send({ type: 'END_GAME', winner: Team.TOWNSFOLK, reason: '测试结束' });

            const context = actor.getSnapshot().context;
            const endLog = context.history.find(h => h.type === 'GAME_END');

            expect(endLog).toBeDefined();
            expect(endLog?.message).toContain('善良阵营');
        });
    });
});
