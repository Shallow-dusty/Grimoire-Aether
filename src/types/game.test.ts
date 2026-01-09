/**
 * game.ts 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
    isGoodTeam,
    isEvilTeam,
    createDefaultPlayerStatus,
    createPlayer,
    countAlivePlayers,
    getVotesRequired,
    getExecutionThreshold,
    Team
} from './game';

describe('game.ts 工具函数', () => {
    describe('isGoodTeam', () => {
        it('TOWNSFOLK 应该返回 true', () => {
            expect(isGoodTeam(Team.TOWNSFOLK)).toBe(true);
        });

        it('OUTSIDER 应该返回 true', () => {
            expect(isGoodTeam(Team.OUTSIDER)).toBe(true);
        });

        it('MINION 应该返回 false', () => {
            expect(isGoodTeam(Team.MINION)).toBe(false);
        });

        it('DEMON 应该返回 false', () => {
            expect(isGoodTeam(Team.DEMON)).toBe(false);
        });
    });

    describe('isEvilTeam', () => {
        it('MINION 应该返回 true', () => {
            expect(isEvilTeam(Team.MINION)).toBe(true);
        });

        it('DEMON 应该返回 true', () => {
            expect(isEvilTeam(Team.DEMON)).toBe(true);
        });

        it('TOWNSFOLK 应该返回 false', () => {
            expect(isEvilTeam(Team.TOWNSFOLK)).toBe(false);
        });

        it('OUTSIDER 应该返回 false', () => {
            expect(isEvilTeam(Team.OUTSIDER)).toBe(false);
        });
    });

    describe('createDefaultPlayerStatus', () => {
        it('应该创建默认状态', () => {
            const status = createDefaultPlayerStatus();

            expect(status.poisoned).toBe(false);
            expect(status.drunk).toBe(false);
            expect(status.protected).toBe(false);
            expect(status.customMarkers).toEqual([]);
        });
    });

    describe('createPlayer', () => {
        it('应该创建新玩家', () => {
            const player = createPlayer('p1', '测试玩家', 0);

            expect(player.id).toBe('p1');
            expect(player.name).toBe('测试玩家');
            expect(player.seatIndex).toBe(0);
            expect(player.characterId).toBeNull();
            expect(player.isDead).toBe(false);
            expect(player.isGhost).toBe(false);
            expect(player.hasUsedGhostVote).toBe(false);
            expect(player.isStoryteller).toBe(false);
        });
    });

    describe('countAlivePlayers', () => {
        it('应该正确计算存活玩家数', () => {
            const players = [
                createPlayer('p1', '玩家1', 0),
                createPlayer('p2', '玩家2', 1),
                { ...createPlayer('p3', '玩家3', 2), isDead: true },
            ];

            expect(countAlivePlayers(players)).toBe(2);
        });

        it('应该排除说书人', () => {
            const players = [
                createPlayer('p1', '玩家1', 0),
                { ...createPlayer('st', '说书人', 1), isStoryteller: true },
            ];

            expect(countAlivePlayers(players)).toBe(1);
        });

        it('空数组应该返回 0', () => {
            expect(countAlivePlayers([])).toBe(0);
        });
    });

    describe('getVotesRequired', () => {
        it('偶数玩家应该返回一半', () => {
            expect(getVotesRequired(8)).toBe(4);
            expect(getVotesRequired(10)).toBe(5);
        });

        it('奇数玩家应该向上取整', () => {
            expect(getVotesRequired(7)).toBe(4);
            expect(getVotesRequired(9)).toBe(5);
        });

        it('单个玩家需要 1 票', () => {
            expect(getVotesRequired(1)).toBe(1);
        });
    });

    describe('getExecutionThreshold', () => {
        it('应该根据存活玩家计算阈值', () => {
            const players = [
                createPlayer('p1', '玩家1', 0),
                createPlayer('p2', '玩家2', 1),
                createPlayer('p3', '玩家3', 2),
                createPlayer('p4', '玩家4', 3),
                { ...createPlayer('p5', '玩家5', 4), isDead: true },
            ];

            // 4 人存活，阈值 = ceil(4/2) = 2
            expect(getExecutionThreshold(players)).toBe(2);
        });
    });
});
