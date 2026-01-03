/**
 * Trouble Brewing 角色数据测试
 */

import { describe, it, expect } from 'vitest';
import {
    TROUBLE_BREWING_CHARACTERS,
    TROUBLE_BREWING_BY_TEAM,
    getFirstNightOrder,
    getOtherNightOrder,
    getCharacterById,
    getStandardComposition,
    WASHERWOMAN,
    IMP,
    POISONER,
    DRUNK
} from './trouble-brewing';
import { Team } from '../../types/game';

describe('Trouble Brewing Characters', () => {
    describe('角色数据完整性', () => {
        it('应该包含 22 个角色', () => {
            expect(TROUBLE_BREWING_CHARACTERS).toHaveLength(22);
        });

        it('所有角色都应该有必需字段', () => {
            TROUBLE_BREWING_CHARACTERS.forEach(character => {
                expect(character.id).toBeDefined();
                expect(character.name).toBeDefined();
                expect(character.nameEn).toBeDefined();
                expect(character.team).toBeDefined();
                expect(character.abilityText).toBeDefined();
                expect(typeof character.firstNight).toBe('boolean');
                expect(typeof character.otherNight).toBe('boolean');
            });
        });

        it('首夜行动的角色应该有 firstNightOrder', () => {
            TROUBLE_BREWING_CHARACTERS
                .filter(c => c.firstNight)
                .forEach(character => {
                    expect(character.firstNightOrder).toBeDefined();
                    expect(character.firstNightOrder).toBeGreaterThan(0);
                });
        });

        it('其他夜晚行动的角色应该有 otherNightOrder', () => {
            TROUBLE_BREWING_CHARACTERS
                .filter(c => c.otherNight)
                .forEach(character => {
                    expect(character.otherNightOrder).toBeDefined();
                    expect(character.otherNightOrder).toBeGreaterThan(0);
                });
        });
    });

    describe('按阵营分类', () => {
        it('应该有 13 个镇民', () => {
            expect(TROUBLE_BREWING_BY_TEAM[Team.TOWNSFOLK]).toHaveLength(13);
        });

        it('应该有 4 个外来者', () => {
            expect(TROUBLE_BREWING_BY_TEAM[Team.OUTSIDER]).toHaveLength(4);
        });

        it('应该有 4 个爪牙', () => {
            expect(TROUBLE_BREWING_BY_TEAM[Team.MINION]).toHaveLength(4);
        });

        it('应该有 1 个恶魔', () => {
            expect(TROUBLE_BREWING_BY_TEAM[Team.DEMON]).toHaveLength(1);
        });

        it('所有分类的角色总数应该等于 22', () => {
            const total =
                TROUBLE_BREWING_BY_TEAM[Team.TOWNSFOLK].length +
                TROUBLE_BREWING_BY_TEAM[Team.OUTSIDER].length +
                TROUBLE_BREWING_BY_TEAM[Team.MINION].length +
                TROUBLE_BREWING_BY_TEAM[Team.DEMON].length;
            expect(total).toBe(22);
        });
    });

    describe('夜晚行动顺序', () => {
        it('应该按首夜顺序正确排序', () => {
            const firstNightOrder = getFirstNightOrder();

            expect(firstNightOrder.length).toBeGreaterThan(0);

            // 检查顺序是否递增
            for (let i = 1; i < firstNightOrder.length; i++) {
                expect(firstNightOrder[i].firstNightOrder!)
                    .toBeGreaterThanOrEqual(firstNightOrder[i - 1].firstNightOrder!);
            }
        });

        it('应该按其他夜晚顺序正确排序', () => {
            const otherNightOrder = getOtherNightOrder();

            expect(otherNightOrder.length).toBeGreaterThan(0);

            // 检查顺序是否递增
            for (let i = 1; i < otherNightOrder.length; i++) {
                expect(otherNightOrder[i].otherNightOrder!)
                    .toBeGreaterThanOrEqual(otherNightOrder[i - 1].otherNightOrder!);
            }
        });

        it('投毒者应该在首夜和其他夜晚都行动', () => {
            const poisoner = POISONER;
            expect(poisoner.firstNight).toBe(true);
            expect(poisoner.otherNight).toBe(true);
        });

        it('小恶魔应该只在其他夜晚行动（不在首夜）', () => {
            const imp = IMP;
            expect(imp.firstNight).toBe(false);
            expect(imp.otherNight).toBe(true);
        });
    });

    describe('getCharacterById', () => {
        it('应该能通过 ID 找到角色', () => {
            const washerwoman = getCharacterById('washerwoman');
            expect(washerwoman).toBeDefined();
            expect(washerwoman?.id).toBe('washerwoman');
            expect(washerwoman?.name).toBe('洗衣妇');
        });

        it('不存在的 ID 应该返回 undefined', () => {
            const nonExistent = getCharacterById('non_existent_character');
            expect(nonExistent).toBeUndefined();
        });

        it('应该能找到所有角色', () => {
            TROUBLE_BREWING_CHARACTERS.forEach(character => {
                const found = getCharacterById(character.id);
                expect(found).toBeDefined();
                expect(found?.id).toBe(character.id);
            });
        });
    });

    describe('getStandardComposition', () => {
        it('5 人局应该是正确配置', () => {
            const composition = getStandardComposition(5);
            expect(composition).toEqual({
                townsfolk: 3,
                outsiders: 0,
                minions: 1,
                demons: 1
            });
            expect(composition.townsfolk + composition.outsiders +
                   composition.minions + composition.demons).toBe(5);
        });

        it('7 人局应该是正确配置', () => {
            const composition = getStandardComposition(7);
            expect(composition).toEqual({
                townsfolk: 5,
                outsiders: 0,
                minions: 1,
                demons: 1
            });
            expect(composition.townsfolk + composition.outsiders +
                   composition.minions + composition.demons).toBe(7);
        });

        it('10 人局应该是正确配置', () => {
            const composition = getStandardComposition(10);
            expect(composition).toEqual({
                townsfolk: 7,
                outsiders: 0,
                minions: 2,
                demons: 1
            });
            expect(composition.townsfolk + composition.outsiders +
                   composition.minions + composition.demons).toBe(10);
        });

        it('13 人局应该是正确配置', () => {
            const composition = getStandardComposition(13);
            expect(composition).toEqual({
                townsfolk: 9,
                outsiders: 0,
                minions: 3,
                demons: 1
            });
            expect(composition.townsfolk + composition.outsiders +
                   composition.minions + composition.demons).toBe(13);
        });

        it('15 人局应该是正确配置', () => {
            const composition = getStandardComposition(15);
            expect(composition).toEqual({
                townsfolk: 9,
                outsiders: 2,
                minions: 3,
                demons: 1
            });
            expect(composition.townsfolk + composition.outsiders +
                   composition.minions + composition.demons).toBe(15);
        });
    });

    describe('特定角色属性', () => {
        it('洗衣妇应该有正确的属性', () => {
            expect(WASHERWOMAN.id).toBe('washerwoman');
            expect(WASHERWOMAN.team).toBe(Team.TOWNSFOLK);
            expect(WASHERWOMAN.firstNight).toBe(true);
            expect(WASHERWOMAN.otherNight).toBe(false);
        });

        it('酒鬼应该不需要夜晚行动', () => {
            expect(DRUNK.firstNight).toBe(false);
            expect(DRUNK.otherNight).toBe(false);
            expect(DRUNK.team).toBe(Team.OUTSIDER);
        });

        it('投毒者应该是爪牙且每晚都行动', () => {
            expect(POISONER.team).toBe(Team.MINION);
            expect(POISONER.firstNight).toBe(true);
            expect(POISONER.otherNight).toBe(true);
            expect(POISONER.firstNightOrder).toBe(11);
            expect(POISONER.otherNightOrder).toBe(2);
        });

        it('小恶魔应该是恶魔且只在其他夜晚行动', () => {
            expect(IMP.team).toBe(Team.DEMON);
            expect(IMP.firstNight).toBe(false);
            expect(IMP.otherNight).toBe(true);
            expect(IMP.otherNightOrder).toBe(15);
        });
    });
});
