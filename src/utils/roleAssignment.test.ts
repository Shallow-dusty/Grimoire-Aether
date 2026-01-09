/**
 * 角色分配工具函数测试
 */

import { describe, it, expect } from 'vitest';
import { randomAssignRoles, balancedAssignRoles, applyDrunkMechanism } from './roleAssignment';
import { getStandardComposition, TROUBLE_BREWING_CHARACTERS } from '../data/characters/trouble-brewing';
import { Team } from '../types/game';

describe('roleAssignment', () => {
    describe('randomAssignRoles', () => {
        it('should assign correct number of roles for 5 players', () => {
            const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const assignments = randomAssignRoles(playerIds);

            expect(Object.keys(assignments).length).toBe(5);
            expect(assignments['p1']).toBeDefined();
            expect(assignments['p5']).toBeDefined();
        });

        it('should assign correct number of roles for 15 players', () => {
            const playerIds = Array.from({ length: 15 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);

            expect(Object.keys(assignments).length).toBe(15);
        });

        it('should follow standard composition for 7 players', () => {
            const playerIds = Array.from({ length: 7 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);
            const composition = getStandardComposition(7);

            // 统计各阵营数量
            const counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
            Object.values(assignments).forEach(charId => {
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                if (char) {
                    if (char.team === Team.TOWNSFOLK) counts.townsfolk++;
                    if (char.team === Team.OUTSIDER) counts.outsiders++;
                    if (char.team === Team.MINION) counts.minions++;
                    if (char.team === Team.DEMON) counts.demons++;
                }
            });

            expect(counts.townsfolk).toBe(composition.townsfolk);
            expect(counts.outsiders).toBe(composition.outsiders);
            expect(counts.minions).toBe(composition.minions);
            expect(counts.demons).toBe(composition.demons);
        });

        it('should assign unique roles (no duplicates)', () => {
            const playerIds = Array.from({ length: 10 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);
            const roleIds = Object.values(assignments);

            const uniqueRoleIds = new Set(roleIds);
            expect(uniqueRoleIds.size).toBe(roleIds.length);
        });

        it('should assign valid character IDs', () => {
            const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const assignments = randomAssignRoles(playerIds);

            Object.values(assignments).forEach(charId => {
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                expect(char).toBeDefined();
            });
        });

        it('should assign exactly 1 demon for any player count', () => {
            for (let playerCount = 5; playerCount <= 15; playerCount++) {
                const playerIds = Array.from({ length: playerCount }, (_, i) => `p${i + 1}`);
                const assignments = randomAssignRoles(playerIds);

                const demons = Object.values(assignments).filter(charId => {
                    const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                    return char?.team === Team.DEMON;
                });

                expect(demons.length).toBe(1);
            }
        });
    });

    describe('balancedAssignRoles', () => {
        it('should assign correct number of roles for 5 players', () => {
            const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const assignments = balancedAssignRoles(playerIds);

            expect(Object.keys(assignments).length).toBe(5);
        });

        it('should follow standard composition for 7 players', () => {
            const playerIds = Array.from({ length: 7 }, (_, i) => `p${i + 1}`);
            const assignments = balancedAssignRoles(playerIds);
            const composition = getStandardComposition(7);

            const counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
            Object.values(assignments).forEach(charId => {
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                if (char) {
                    if (char.team === Team.TOWNSFOLK) counts.townsfolk++;
                    if (char.team === Team.OUTSIDER) counts.outsiders++;
                    if (char.team === Team.MINION) counts.minions++;
                    if (char.team === Team.DEMON) counts.demons++;
                }
            });

            expect(counts.townsfolk).toBe(composition.townsfolk);
            expect(counts.outsiders).toBe(composition.outsiders);
            expect(counts.minions).toBe(composition.minions);
            expect(counts.demons).toBe(composition.demons);
        });

        it('should prioritize information roles (fortune_teller, empath)', () => {
            const playerIds = Array.from({ length: 10 }, (_, i) => `p${i + 1}`);
            const assignments = balancedAssignRoles(playerIds);
            const roleIds = Object.values(assignments);

            // 应该包含强力信息角色
            const hasFortuneTeller = roleIds.includes('fortune_teller');
            const hasEmpath = roleIds.includes('empath');

            expect(hasFortuneTeller || hasEmpath).toBe(true);
        });

        it('should assign unique roles (no duplicates)', () => {
            const playerIds = Array.from({ length: 12 }, (_, i) => `p${i + 1}`);
            const assignments = balancedAssignRoles(playerIds);
            const roleIds = Object.values(assignments);

            const uniqueRoleIds = new Set(roleIds);
            expect(uniqueRoleIds.size).toBe(roleIds.length);
        });

        it('should always assign imp as demon', () => {
            const playerIds = Array.from({ length: 8 }, (_, i) => `p${i + 1}`);
            const assignments = balancedAssignRoles(playerIds);

            const demons = Object.values(assignments).filter(charId => {
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                return char?.team === Team.DEMON;
            });

            expect(demons.length).toBe(1);
            expect(demons[0]).toBe('imp');
        });

        it('should assign valid character IDs', () => {
            const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const assignments = balancedAssignRoles(playerIds);

            Object.values(assignments).forEach(charId => {
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                expect(char).toBeDefined();
            });
        });

        it('should work correctly for edge cases (5 and 15 players)', () => {
            // 最少 5 人
            const minPlayers = Array.from({ length: 5 }, (_, i) => `p${i + 1}`);
            const minAssignments = balancedAssignRoles(minPlayers);
            expect(Object.keys(minAssignments).length).toBe(5);

            // 最多 15 人
            const maxPlayers = Array.from({ length: 15 }, (_, i) => `p${i + 1}`);
            const maxAssignments = balancedAssignRoles(maxPlayers);
            expect(Object.keys(maxAssignments).length).toBe(15);
        });
    });

    describe('composition consistency', () => {
        it('random and balanced should follow valid composition rules (standard or baron-adjusted)', () => {
            const playerIds = Array.from({ length: 9 }, (_, i) => `p${i + 1}`);

            const randomAssignments = randomAssignRoles(playerIds);
            const balancedAssignments = balancedAssignRoles(playerIds);

            const randomCounts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
            const balancedCounts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };

            // 检查是否有男爵
            let randomHasBaron = false;
            let balancedHasBaron = false;

            Object.values(randomAssignments).forEach(charId => {
                if (charId === 'baron') randomHasBaron = true;
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                if (char) {
                    if (char.team === Team.TOWNSFOLK) randomCounts.townsfolk++;
                    if (char.team === Team.OUTSIDER) randomCounts.outsiders++;
                    if (char.team === Team.MINION) randomCounts.minions++;
                    if (char.team === Team.DEMON) randomCounts.demons++;
                }
            });

            Object.values(balancedAssignments).forEach(charId => {
                if (charId === 'baron') balancedHasBaron = true;
                const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === charId);
                if (char) {
                    if (char.team === Team.TOWNSFOLK) balancedCounts.townsfolk++;
                    if (char.team === Team.OUTSIDER) balancedCounts.outsiders++;
                    if (char.team === Team.MINION) balancedCounts.minions++;
                    if (char.team === Team.DEMON) balancedCounts.demons++;
                }
            });

            // 验证组成：标准组成（7镇民0外来者）或男爵调整组成（5镇民2外来者）
            const standardComposition = { townsfolk: 7, outsiders: 0, minions: 1, demons: 1 };
            const baronComposition = { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };

            // Random 应该符合标准或男爵组成
            if (randomHasBaron) {
                expect(randomCounts).toEqual(baronComposition);
            } else {
                expect(randomCounts).toEqual(standardComposition);
            }

            // Balanced 应该符合标准或男爵组成
            if (balancedHasBaron) {
                expect(balancedCounts).toEqual(baronComposition);
            } else {
                expect(balancedCounts).toEqual(standardComposition);
            }
        });
    });

    describe('applyDrunkMechanism', () => {
        it('should return null drunk info when no townsfolk present', () => {
            // 创建一个只有恶魔的分配（边缘案例）
            const assignments = {
                'p1': 'imp'
            };

            const result = applyDrunkMechanism(assignments);

            expect(result.drunkPlayerId).toBeNull();
            expect(result.fakeCharacterId).toBeNull();
            expect(result.assignments).toEqual(assignments);
        });

        it('should select one townsfolk as drunk', () => {
            const playerIds = Array.from({ length: 7 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);

            const result = applyDrunkMechanism(assignments);

            // 应该选中一名镇民
            if (result.drunkPlayerId) {
                const drunkRealRole = assignments[result.drunkPlayerId];
                const drunkCharacter = TROUBLE_BREWING_CHARACTERS.find(c => c.id === drunkRealRole);

                expect(drunkCharacter?.team).toBe(Team.TOWNSFOLK);
                expect(result.fakeCharacterId).toBeDefined();
            }
        });

        it('should assign different fake character than real character', () => {
            const playerIds = Array.from({ length: 7 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);

            const result = applyDrunkMechanism(assignments);

            if (result.drunkPlayerId && result.fakeCharacterId) {
                const realCharacterId = assignments[result.drunkPlayerId];
                expect(result.fakeCharacterId).not.toBe(realCharacterId);
            }
        });

        it('should assign fake character that is also a townsfolk', () => {
            const playerIds = Array.from({ length: 10 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);

            const result = applyDrunkMechanism(assignments);

            if (result.fakeCharacterId) {
                const fakeCharacter = TROUBLE_BREWING_CHARACTERS.find(c => c.id === result.fakeCharacterId);
                expect(fakeCharacter?.team).toBe(Team.TOWNSFOLK);
            }
        });

        it('should not modify original assignments object', () => {
            const playerIds = Array.from({ length: 7 }, (_, i) => `p${i + 1}`);
            const assignments = randomAssignRoles(playerIds);
            const originalAssignments = { ...assignments };

            const result = applyDrunkMechanism(assignments);

            expect(result.assignments).toEqual(originalAssignments);
        });

        it('should work with both random and balanced assignments', () => {
            const playerIds = Array.from({ length: 8 }, (_, i) => `p${i + 1}`);

            // 测试随机分配
            const randomAssignments = randomAssignRoles(playerIds);
            const randomResult = applyDrunkMechanism(randomAssignments);

            // 测试平衡分配
            const balancedAssignments = balancedAssignRoles(playerIds);
            const balancedResult = applyDrunkMechanism(balancedAssignments);

            // 两种方式都应该能正确应用醉鬼机制（drunkPlayerId 应该是字符串或 null）
            expect(typeof randomResult.drunkPlayerId === 'string' || randomResult.drunkPlayerId === null).toBe(true);
            expect(typeof balancedResult.drunkPlayerId === 'string' || balancedResult.drunkPlayerId === null).toBe(true);
        });
    });
});
