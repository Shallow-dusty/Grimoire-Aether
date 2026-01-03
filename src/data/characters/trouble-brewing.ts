/**
 * Trouble Brewing (麻烦酿造) - 基础剧本
 *
 * Blood on the Clocktower 的官方基础剧本
 * 适合 5-15 人游戏
 */

import { Character, Team } from '../../types/game';

// ============================================================
// 镇民 (Townsfolk) - 善良阵营核心角色
// ============================================================

export const WASHERWOMAN: Character = {
    id: 'washerwoman',
    name: '洗衣妇',
    nameEn: 'Washerwoman',
    team: Team.TOWNSFOLK,
    abilityText: '你会得知两名玩家和一个镇民角色：这两名玩家之一是该角色。',
    firstNight: true,
    otherNight: false,
    firstNightOrder: 15,
    setupReminder: '洗衣妇首夜行动'
};

export const LIBRARIAN: Character = {
    id: 'librarian',
    name: '图书馆员',
    nameEn: 'Librarian',
    team: Team.TOWNSFOLK,
    abilityText: '你会得知两名玩家和一个外来者角色：这两名玩家之一是该角色。',
    firstNight: true,
    otherNight: false,
    firstNightOrder: 16,
    setupReminder: '图书馆员首夜行动'
};

export const INVESTIGATOR: Character = {
    id: 'investigator',
    name: '调查员',
    nameEn: 'Investigator',
    team: Team.TOWNSFOLK,
    abilityText: '你会得知两名玩家和一个爪牙角色：这两名玩家之一是该角色。',
    firstNight: true,
    otherNight: false,
    firstNightOrder: 17,
    setupReminder: '调查员首夜行动'
};

export const CHEF: Character = {
    id: 'chef',
    name: '厨师',
    nameEn: 'Chef',
    team: Team.TOWNSFOLK,
    abilityText: '你会得知邻座的邪恶玩家有多少对。',
    firstNight: true,
    otherNight: false,
    firstNightOrder: 18,
    setupReminder: '厨师首夜行动'
};

export const EMPATH: Character = {
    id: 'empath',
    name: '共情者',
    nameEn: 'Empath',
    team: Team.TOWNSFOLK,
    abilityText: '每个夜晚，你会得知与你邻近的两名存活的邻居中的邪恶玩家数量。',
    firstNight: true,
    otherNight: true,
    firstNightOrder: 19,
    otherNightOrder: 31,
    setupReminder: '共情者每晚行动'
};

export const FORTUNE_TELLER: Character = {
    id: 'fortune_teller',
    name: '占卜师',
    nameEn: 'Fortune Teller',
    team: Team.TOWNSFOLK,
    abilityText: '每个夜晚，选择两名玩家：你会得知他们之中是否有恶魔。会有一名善良玩家始终被你的能力视为恶魔。',
    firstNight: true,
    otherNight: true,
    firstNightOrder: 20,
    otherNightOrder: 32,
    setupReminder: '占卜师每晚行动，有红鲱鱼'
};

export const UNDERTAKER: Character = {
    id: 'undertaker',
    name: '送葬者',
    nameEn: 'Undertaker',
    team: Team.TOWNSFOLK,
    abilityText: '每个夜晚*，你会得知今天白天死于处决的玩家的角色。',
    firstNight: false,
    otherNight: true,
    otherNightOrder: 33,
    setupReminder: '送葬者在处决后行动'
};

export const MONK: Character = {
    id: 'monk',
    name: '僧侣',
    nameEn: 'Monk',
    team: Team.TOWNSFOLK,
    abilityText: '每个夜晚*，选择一名除你以外的玩家：当晚恶魔的能力对该玩家无效。',
    firstNight: false,
    otherNight: true,
    otherNightOrder: 1,
    setupReminder: '僧侣保护在恶魔前'
};

export const RAVENKEEPER: Character = {
    id: 'ravenkeeper',
    name: '守鸦人',
    nameEn: 'Ravenkeeper',
    team: Team.TOWNSFOLK,
    abilityText: '如果你在夜晚死亡，你会被唤醒并选择一名玩家：你会得知他的角色。',
    firstNight: false,
    otherNight: true,
    otherNightOrder: 29,
    setupReminder: '守鸦人在死亡当晚行动'
};

export const VIRGIN: Character = {
    id: 'virgin',
    name: '处女',
    nameEn: 'Virgin',
    team: Team.TOWNSFOLK,
    abilityText: '第一次有镇民提名你时，如果提名者是镇民，他立刻被处决。',
    firstNight: false,
    otherNight: false,
    setupReminder: '处女能力在白天触发'
};

export const SLAYER: Character = {
    id: 'slayer',
    name: '猎手',
    nameEn: 'Slayer',
    team: Team.TOWNSFOLK,
    abilityText: '每局游戏限一次，在白天时，你可以公开选择一名玩家：如果他是恶魔，他死亡。',
    firstNight: false,
    otherNight: false,
    setupReminder: '猎手能力在白天使用'
};

export const SOLDIER: Character = {
    id: 'soldier',
    name: '士兵',
    nameEn: 'Soldier',
    team: Team.TOWNSFOLK,
    abilityText: '你免受恶魔能力的伤害。',
    firstNight: false,
    otherNight: false,
    setupReminder: '士兵被动能力'
};

export const MAYOR: Character = {
    id: 'mayor',
    name: '市长',
    nameEn: 'Mayor',
    team: Team.TOWNSFOLK,
    abilityText: '如果只有三名玩家存活且白天没有处决，你的阵营获胜。',
    firstNight: false,
    otherNight: false,
    setupReminder: '市长触发胜利条件'
};

// ============================================================
// 外来者 (Outsiders) - 善良阵营但带有负面效果
// ============================================================

export const BUTLER: Character = {
    id: 'butler',
    name: '管家',
    nameEn: 'Butler',
    team: Team.OUTSIDER,
    abilityText: '每个夜晚，选择一名除你以外的玩家：明天白天，你只能在他投票后投票。',
    firstNight: true,
    otherNight: true,
    firstNightOrder: 21,
    otherNightOrder: 34,
    setupReminder: '管家每晚选择主人'
};

export const DRUNK: Character = {
    id: 'drunk',
    name: '酒鬼',
    nameEn: 'Drunk',
    team: Team.OUTSIDER,
    abilityText: '你不知道你是酒鬼。你以为你是一个镇民角色，但其实不是。',
    firstNight: false,
    otherNight: false,
    setupReminder: '酒鬼不知道自己的身份'
};

export const RECLUSE: Character = {
    id: 'recluse',
    name: '隐士',
    nameEn: 'Recluse',
    team: Team.OUTSIDER,
    abilityText: '你可能会被当作邪恶、爪牙或恶魔的能力视为邪恶、爪牙甚至恶魔。',
    firstNight: false,
    otherNight: false,
    setupReminder: '隐士可能被误认为邪恶'
};

export const SAINT: Character = {
    id: 'saint',
    name: '圣徒',
    nameEn: 'Saint',
    team: Team.OUTSIDER,
    abilityText: '如果你死于处决，你的阵营落败。',
    firstNight: false,
    otherNight: false,
    setupReminder: '圣徒死亡会导致善良失败'
};

// ============================================================
// 爪牙 (Minions) - 邪恶阵营辅助角色
// ============================================================

export const POISONER: Character = {
    id: 'poisoner',
    name: '投毒者',
    nameEn: 'Poisoner',
    team: Team.MINION,
    abilityText: '每个夜晚，选择一名玩家：该玩家在当晚和明天白天中毒（能力失效）。',
    firstNight: true,
    otherNight: true,
    firstNightOrder: 11,
    otherNightOrder: 2,
    setupReminder: '投毒者在夜晚早期行动'
};

export const SPY: Character = {
    id: 'spy',
    name: '间谍',
    nameEn: 'Spy',
    team: Team.MINION,
    abilityText: '每个夜晚，你会看到魔典。你可能会被当作善良、镇民或外来者的能力视为善良、镇民或外来者。',
    firstNight: true,
    otherNight: true,
    firstNightOrder: 35,
    otherNightOrder: 35,
    setupReminder: '间谍每晚查看魔典'
};

export const SCARLET_WOMAN: Character = {
    id: 'scarlet_woman',
    name: '猩红女郎',
    nameEn: 'Scarlet Woman',
    team: Team.MINION,
    abilityText: '如果有 5 名或更多玩家存活且恶魔死亡，你变成恶魔。',
    firstNight: false,
    otherNight: true,
    otherNightOrder: 12,
    setupReminder: '猩红女郎在恶魔死后可能变成恶魔'
};

export const BARON: Character = {
    id: 'baron',
    name: '男爵',
    nameEn: 'Baron',
    team: Team.MINION,
    abilityText: '会有额外的外来者加入游戏。【设置时生效】',
    firstNight: false,
    otherNight: false,
    setupReminder: '男爵增加外来者数量'
};

// ============================================================
// 恶魔 (Demons) - 邪恶阵营核心角色
// ============================================================

export const IMP: Character = {
    id: 'imp',
    name: '小恶魔',
    nameEn: 'Imp',
    team: Team.DEMON,
    abilityText: '每个夜晚*，选择一名玩家：该玩家死亡。如果你以这种方式自杀，一名爪牙会变成小恶魔。',
    firstNight: false,
    otherNight: true,
    otherNightOrder: 15,
    setupReminder: '小恶魔每晚杀人'
};

// ============================================================
// 导出所有角色
// ============================================================

export const TROUBLE_BREWING_CHARACTERS: Character[] = [
    // Townsfolk
    WASHERWOMAN,
    LIBRARIAN,
    INVESTIGATOR,
    CHEF,
    EMPATH,
    FORTUNE_TELLER,
    UNDERTAKER,
    MONK,
    RAVENKEEPER,
    VIRGIN,
    SLAYER,
    SOLDIER,
    MAYOR,
    // Outsiders
    BUTLER,
    DRUNK,
    RECLUSE,
    SAINT,
    // Minions
    POISONER,
    SPY,
    SCARLET_WOMAN,
    BARON,
    // Demons
    IMP
];

// 按阵营分类
export const TROUBLE_BREWING_BY_TEAM = {
    [Team.TOWNSFOLK]: [
        WASHERWOMAN, LIBRARIAN, INVESTIGATOR, CHEF,
        EMPATH, FORTUNE_TELLER, UNDERTAKER, MONK,
        RAVENKEEPER, VIRGIN, SLAYER, SOLDIER, MAYOR
    ],
    [Team.OUTSIDER]: [BUTLER, DRUNK, RECLUSE, SAINT],
    [Team.MINION]: [POISONER, SPY, SCARLET_WOMAN, BARON],
    [Team.DEMON]: [IMP]
};

/**
 * 获取首夜行动顺序
 */
export function getFirstNightOrder(): Character[] {
    return TROUBLE_BREWING_CHARACTERS
        .filter(c => c.firstNight && c.firstNightOrder !== undefined)
        .sort((a, b) => (a.firstNightOrder || 0) - (b.firstNightOrder || 0));
}

/**
 * 获取其他夜晚行动顺序
 */
export function getOtherNightOrder(): Character[] {
    return TROUBLE_BREWING_CHARACTERS
        .filter(c => c.otherNight && c.otherNightOrder !== undefined)
        .sort((a, b) => (a.otherNightOrder || 0) - (b.otherNightOrder || 0));
}

/**
 * 根据 ID 获取角色
 */
export function getCharacterById(id: string): Character | undefined {
    return TROUBLE_BREWING_CHARACTERS.find(c => c.id === id);
}

/**
 * 根据玩家数量获取标准配置
 */
export function getStandardComposition(playerCount: number): {
    townsfolk: number;
    outsiders: number;
    minions: number;
    demons: number;
} {
    // Blood on the Clocktower 标准配置规则
    const demons = 1;
    let minions = 0;
    let outsiders = 0;

    // 爪牙数量（5-6人:1个, 7-9人:1个, 10-12人:2个, 13+人:3个）
    if (playerCount >= 5 && playerCount <= 6) minions = 1;
    else if (playerCount >= 7 && playerCount <= 9) minions = 1;
    else if (playerCount >= 10 && playerCount <= 12) minions = 2;
    else if (playerCount >= 13) minions = 3;

    // 外来者数量（5-6人:0个, 7-9人:0个, 10-12人:0个, 13-14人:0个, 15+人:2个）
    if (playerCount >= 5 && playerCount <= 14) outsiders = 0;
    else if (playerCount >= 15) outsiders = 2;

    const townsfolk = playerCount - demons - minions - outsiders;

    return { townsfolk, outsiders, minions, demons };
}
