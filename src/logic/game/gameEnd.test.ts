/**
 * 游戏结束判定测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkGameEnd,
    checkDemonDeath,
    checkGoodEliminated,
    checkSaintExecution,
    checkMayorWin,
    checkScarletWomanTransform,
    getAliveGoodPlayers,
    getAliveEvilPlayers,
    getAliveDemons,
    getTeamBalance,
    isGameInDanger,
    estimateRemainingRounds,
    getGameStatusSummary,
    EndConditionType
} from './gameEnd';
import { createPlayer, Team, type Player } from '../../types/game';

describe('Game End Detection', () => {
    let players: Player[];

    beforeEach(() => {
        // 创建标准 7 人局：5 善良 + 2 邪恶
        players = [
            { ...createPlayer('p1', '玩家1', 0), characterId: 'washerwoman' },
            { ...createPlayer('p2', '玩家2', 1), characterId: 'empath' },
            { ...createPlayer('p3', '玩家3', 2), characterId: 'monk' },
            { ...createPlayer('p4', '玩家4', 3), characterId: 'soldier' },
            { ...createPlayer('p5', '玩家5', 4), characterId: 'mayor' },
            { ...createPlayer('p6', '玩家6', 5), characterId: 'poisoner' },
            { ...createPlayer('p7', '玩家7', 6), characterId: 'imp' }
        ];
    });

    describe('checkDemonDeath', () => {
        it('恶魔死亡应该触发善良胜利', () => {
            const deadDemon = players.map(p =>
                p.characterId === 'imp' ? { ...p, isDead: true } : p
            );

            const result = checkDemonDeath(deadDemon);

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.TOWNSFOLK);
            expect(result.conditionType).toBe(EndConditionType.DEMON_DIED);
        });

        it('恶魔存活应该返回未结束', () => {
            const result = checkDemonDeath(players);

            expect(result.isEnded).toBe(false);
        });

        it('只有爪牙死亡不应该触发结束', () => {
            const deadMinion = players.map(p =>
                p.characterId === 'poisoner' ? { ...p, isDead: true } : p
            );

            const result = checkDemonDeath(deadMinion);

            expect(result.isEnded).toBe(false);
        });
    });

    describe('checkGoodEliminated', () => {
        it('所有善良玩家死亡应该触发邪恶胜利', () => {
            const allGoodDead = players.map(p =>
                p.characterId !== 'imp' && p.characterId !== 'poisoner'
                    ? { ...p, isDead: true }
                    : p
            );

            const result = checkGoodEliminated(allGoodDead);

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.DEMON);
            expect(result.conditionType).toBe(EndConditionType.GOOD_ELIMINATED);
        });

        it('还有善良玩家存活应该返回未结束', () => {
            const result = checkGoodEliminated(players);

            expect(result.isEnded).toBe(false);
        });

        it('只有一个善良玩家存活也不应该结束', () => {
            const onlyOneGood = players.map((p, i) =>
                i > 0 && p.characterId !== 'imp' && p.characterId !== 'poisoner'
                    ? { ...p, isDead: true }
                    : p
            );

            const result = checkGoodEliminated(onlyOneGood);

            expect(result.isEnded).toBe(false);
        });
    });

    describe('checkSaintExecution', () => {
        it('圣徒被处决应该触发邪恶胜利', () => {
            const withSaint = [...players];
            withSaint[0] = { ...withSaint[0], characterId: 'saint' };

            const result = checkSaintExecution(withSaint, 'p1');

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.DEMON);
            expect(result.conditionType).toBe(EndConditionType.SAINT_EXECUTED);
        });

        it('非圣徒被处决不应该触发', () => {
            const result = checkSaintExecution(players, 'p1');

            expect(result.isEnded).toBe(false);
        });

        it('处决不存在的玩家不应该触发', () => {
            const result = checkSaintExecution(players, 'nonexistent');

            expect(result.isEnded).toBe(false);
        });
    });

    describe('checkMayorWin', () => {
        it('3 人存活且有市长应该触发市长胜利', () => {
            const threePlayers = players.map((p, i) =>
                i >= 3 ? { ...p, isDead: true } : p
            );
            // 确保其中一个是市长
            threePlayers[0] = { ...threePlayers[0], characterId: 'mayor' };

            const result = checkMayorWin(threePlayers);

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.TOWNSFOLK);
            expect(result.conditionType).toBe(EndConditionType.MAYOR_WIN);
        });

        it('3 人存活但没有市长不应该触发', () => {
            const threePlayers = players.map((p, i) =>
                i >= 3 ? { ...p, isDead: true } : p
            );

            const result = checkMayorWin(threePlayers);

            expect(result.isEnded).toBe(false);
        });

        it('4 人存活不应该触发', () => {
            const fourPlayers = players.map((p, i) =>
                i >= 4 ? { ...p, isDead: true } : p
            );
            fourPlayers[0] = { ...fourPlayers[0], characterId: 'mayor' };

            const result = checkMayorWin(fourPlayers);

            expect(result.isEnded).toBe(false);
        });
    });

    describe('checkScarletWomanTransform', () => {
        it('5 人存活且恶魔死亡应该触发猩红女郎转换', () => {
            const withScarlet = players.map((p, i) => {
                if (i === 5) return { ...p, characterId: 'scarlet_woman' };
                if (i === 6) return { ...p, isDead: true }; // 恶魔死亡
                if (i === 2) return { ...p, isDead: true }; // 杀死1个人，保持5人存活（7-2=5）
                return p;
            });

            const result = checkScarletWomanTransform(withScarlet);

            expect(result.shouldTransform).toBe(true);
            expect(result.scarletWomanId).toBe('p6');
        });

        it('少于 5 人存活不应该触发', () => {
            const fourPlayers = players.map((p, i) => {
                if (i === 5) return { ...p, characterId: 'scarlet_woman' };
                if (i === 6) return { ...p, isDead: true }; // 恶魔死亡
                if (i >= 3) return { ...p, isDead: true };
                return p;
            });

            const result = checkScarletWomanTransform(fourPlayers);

            expect(result.shouldTransform).toBe(false);
        });

        it('恶魔存活不应该触发', () => {
            const withScarlet = players.map((p, i) =>
                i === 5 ? { ...p, characterId: 'scarlet_woman' } : p
            );

            const result = checkScarletWomanTransform(withScarlet);

            expect(result.shouldTransform).toBe(false);
        });

        it('没有猩红女郎不应该触发', () => {
            const demonDead = players.map(p =>
                p.characterId === 'imp' ? { ...p, isDead: true } : p
            );

            const result = checkScarletWomanTransform(demonDead);

            expect(result.shouldTransform).toBe(false);
        });
    });

    describe('checkGameEnd', () => {
        it('应该检测恶魔死亡', () => {
            const deadDemon = players.map(p =>
                p.characterId === 'imp' ? { ...p, isDead: true } : p
            );

            const result = checkGameEnd(deadDemon, false);

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.TOWNSFOLK);
        });

        it('应该检测善良全灭', () => {
            const allGoodDead = players.map(p =>
                p.characterId !== 'imp' && p.characterId !== 'poisoner'
                    ? { ...p, isDead: true }
                    : p
            );

            const result = checkGameEnd(allGoodDead, false);

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.DEMON);
        });

        it('应该检测圣徒被处决', () => {
            const withSaint = [...players];
            withSaint[0] = { ...withSaint[0], characterId: 'saint' };

            const result = checkGameEnd(withSaint, true, 'p1');

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.DEMON);
        });

        it('应该检测市长胜利', () => {
            const threePlayers = players.map((p, i) =>
                i >= 3 ? { ...p, isDead: true } : p
            );
            threePlayers[0] = { ...threePlayers[0], characterId: 'mayor' };

            const result = checkGameEnd(threePlayers, false); // executedToday = false

            expect(result.isEnded).toBe(true);
            expect(result.winner).toBe(Team.TOWNSFOLK);
        });

        it('正常游戏状态不应该结束', () => {
            const result = checkGameEnd(players, false);

            expect(result.isEnded).toBe(false);
        });
    });

    describe('Team Balance Analysis', () => {
        it('getAliveGoodPlayers 应该返回存活的善良玩家', () => {
            const goodPlayers = getAliveGoodPlayers(players);
            expect(goodPlayers).toHaveLength(5);
        });

        it('getAliveEvilPlayers 应该返回存活的邪恶玩家', () => {
            const evilPlayers = getAliveEvilPlayers(players);
            expect(evilPlayers).toHaveLength(2);
        });

        it('getAliveDemons 应该返回存活的恶魔', () => {
            const demons = getAliveDemons(players);
            expect(demons).toHaveLength(1);
            expect(demons[0].characterId).toBe('imp');
        });

        it('getTeamBalance 应该返回正确的阵营统计', () => {
            const balance = getTeamBalance(players);

            expect(balance.totalAlive).toBe(7);
            expect(balance.aliveGood).toBe(5);
            expect(balance.aliveEvil).toBe(2);
            expect(balance.goodPercentage).toBeCloseTo(71.43, 1);
            expect(balance.evilPercentage).toBeCloseTo(28.57, 1);
        });
    });

    describe('Game Danger Analysis', () => {
        it('7 人存活不应该处于危险', () => {
            const result = isGameInDanger(players);
            expect(result.inDanger).toBe(false);
        });

        it('4 人存活应该处于危险', () => {
            const fourPlayers = players.map((p, i) =>
                i >= 4 ? { ...p, isDead: true } : p
            );

            const result = isGameInDanger(fourPlayers);

            expect(result.inDanger).toBe(true);
            expect(result.reason).toContain('4 名玩家');
        });

        it('3 人存活应该是最后一天', () => {
            const threePlayers = players.map((p, i) =>
                i >= 3 ? { ...p, isDead: true } : p
            );

            const result = isGameInDanger(threePlayers);

            expect(result.inDanger).toBe(true);
            expect(result.reason).toContain('3 名玩家');
            expect(result.daysLeft).toBe(1);
        });

        it('邪恶比例过高应该危险', () => {
            // 2 善良 vs 2 邪恶 (50%)
            const balanced = players.map((p, i) =>
                i >= 2 && i < 5 ? { ...p, isDead: true } : p
            );

            const result = isGameInDanger(balanced);

            expect(result.inDanger).toBe(true);
            expect(result.reason).toContain('邪恶玩家比例');
        });
    });

    describe('Remaining Rounds Estimation', () => {
        it('应该估算剩余回合数', () => {
            const rounds = estimateRemainingRounds(players);
            // 5 善良 - 2 邪恶 = 3, 3/2 = 1.5 ≈ 1
            expect(rounds).toBeGreaterThanOrEqual(1);
        });

        it('邪恶全灭应该返回 0', () => {
            const noEvil = players.map(p =>
                p.characterId === 'imp' || p.characterId === 'poisoner'
                    ? { ...p, isDead: true }
                    : p
            );

            const rounds = estimateRemainingRounds(noEvil);
            expect(rounds).toBe(0);
        });

        it('善良全灭应该返回 0', () => {
            const noGood = players.map(p =>
                p.characterId !== 'imp' && p.characterId !== 'poisoner'
                    ? { ...p, isDead: true }
                    : p
            );

            const rounds = estimateRemainingRounds(noGood);
            expect(rounds).toBe(0);
        });
    });

    describe('Game Status Summary', () => {
        it('应该生成游戏状态摘要', () => {
            const summary = getGameStatusSummary(players);

            expect(summary.status).toBeDefined();
            expect(summary.balance).toBeDefined();
            expect(summary.danger).toBeDefined();
            expect(summary.estimatedRounds).toBeGreaterThanOrEqual(0);
        });

        it('危险局势应该显示危急状态', () => {
            const threePlayers = players.map((p, i) =>
                i >= 3 ? { ...p, isDead: true } : p
            );

            const summary = getGameStatusSummary(threePlayers);

            expect(summary.status).toBe('局势危急');
            expect(summary.danger.inDanger).toBe(true);
        });

        it('善良占优应该显示正确状态', () => {
            const summary = getGameStatusSummary(players);

            expect(summary.status).toContain('善良占优');
            expect(summary.balance.goodPercentage).toBeGreaterThan(70);
        });
    });
});
