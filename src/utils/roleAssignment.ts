/**
 * 角色分配工具函数
 *
 * 提供随机分配和平衡分配功能
 */

import { TROUBLE_BREWING_CHARACTERS, getStandardComposition } from '../data/characters/trouble-brewing';
import { Team, type Character, type PlayerId } from '../types/game';

/**
 * 随机分配角色给玩家
 * @param playerIds 玩家 ID 列表
 * @returns 玩家 ID 到角色 ID 的映射
 */
export function randomAssignRoles(playerIds: PlayerId[]): Record<PlayerId, string> {
    const playerCount = playerIds.length;
    const composition = getStandardComposition(playerCount);

    // 获取各阵营角色池
    const townsfolk = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.TOWNSFOLK);
    const outsiders = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.OUTSIDER);
    const minions = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.MINION);
    const demons = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.DEMON);

    // 随机选择角色
    const selectedRoles: Character[] = [
        ...shuffleArray(townsfolk).slice(0, composition.townsfolk),
        ...shuffleArray(outsiders).slice(0, composition.outsiders),
        ...shuffleArray(minions).slice(0, composition.minions),
        ...shuffleArray(demons).slice(0, composition.demons)
    ];

    // 打乱角色顺序
    const shuffledRoles = shuffleArray(selectedRoles);

    // 分配给玩家
    const assignments: Record<PlayerId, string> = {};
    playerIds.forEach((playerId, index) => {
        if (shuffledRoles[index]) {
            assignments[playerId] = shuffledRoles[index].id;
        }
    });

    return assignments;
}

/**
 * 平衡分配角色给玩家
 * 使用策略：优先选择信息角色，确保游戏平衡性
 * @param playerIds 玩家 ID 列表
 * @returns 玩家 ID 到角色 ID 的映射
 */
export function balancedAssignRoles(playerIds: PlayerId[]): Record<PlayerId, string> {
    const playerCount = playerIds.length;
    const composition = getStandardComposition(playerCount);

    // 优先级策略
    const priorityTownsfolk = [
        'fortune_teller', // 占卜师 - 强力信息
        'empath',         // 共情者 - 稳定信息
        'undertaker',     // 送葬者 - 处决信息
        'washerwoman',    // 洗衣妇 - 首夜信息
        'librarian',      // 图书馆员 - 首夜信息
        'investigator',   // 调查员 - 首夜信息
        'chef',           // 厨师 - 首夜信息
        'monk',           // 僧侣 - 保护
        'ravenkeeper',    // 守鸦人 - 死亡信息
        'virgin',         // 处女 - 特殊能力
        'slayer',         // 杀手 - 主动能力
        'soldier',        // 士兵 - 被动防御
        'mayor'           // 镇长 - 投票影响
    ];

    const priorityOutsiders = [
        'butler',         // 管家 - 互动性强
        'drunk',          // 酒鬼 - 迷惑信息
        'recluse',        // 隐士 - 信息干扰
        'saint'           // 圣徒 - 防处决
    ];

    const priorityMinions = [
        'poisoner',       // 投毒者 - 强力干扰
        'spy',            // 间谍 - 信息窃取
        'scarlet_woman',  // 猩红女郎 - 恶魔备份
        'baron'           // 男爵 - 外来者增加
    ];

    const priorityDemons = [
        'imp'             // 小恶魔 - 标准恶魔
    ];

    // 选择角色
    const selectedRoles: Character[] = [];

    // 镇民
    const townsfolk = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.TOWNSFOLK);
    const selectedTownsfolk = selectByPriority(townsfolk, priorityTownsfolk, composition.townsfolk);
    selectedRoles.push(...selectedTownsfolk);

    // 外来者
    const outsiders = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.OUTSIDER);
    const selectedOutsiders = selectByPriority(outsiders, priorityOutsiders, composition.outsiders);
    selectedRoles.push(...selectedOutsiders);

    // 爪牙
    const minions = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.MINION);
    const selectedMinions = selectByPriority(minions, priorityMinions, composition.minions);
    selectedRoles.push(...selectedMinions);

    // 恶魔
    const demons = TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.DEMON);
    const selectedDemons = selectByPriority(demons, priorityDemons, composition.demons);
    selectedRoles.push(...selectedDemons);

    // 打乱顺序
    const shuffledRoles = shuffleArray(selectedRoles);

    // 分配给玩家
    const assignments: Record<PlayerId, string> = {};
    playerIds.forEach((playerId, index) => {
        if (shuffledRoles[index]) {
            assignments[playerId] = shuffledRoles[index].id;
        }
    });

    return assignments;
}

/**
 * 根据优先级选择角色
 * @param characters 角色池
 * @param priority 优先级列表
 * @param count 需要选择的数量
 * @returns 选中的角色
 */
function selectByPriority(characters: Character[], priority: string[], count: number): Character[] {
    const selected: Character[] = [];
    const remaining = [...characters];

    // 先按优先级选择
    for (const charId of priority) {
        if (selected.length >= count) break;
        const index = remaining.findIndex(c => c.id === charId);
        if (index !== -1) {
            selected.push(remaining[index]);
            remaining.splice(index, 1);
        }
    }

    // 如果不够，随机补充
    while (selected.length < count && remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        selected.push(remaining[randomIndex]);
        remaining.splice(randomIndex, 1);
    }

    return selected;
}

/**
 * 打乱数组（Fisher-Yates 算法）
 * @param array 原数组
 * @returns 打乱后的新数组
 */
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
