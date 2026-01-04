/**
 * Blood on the Clocktower - 游戏类型定义
 * 
 * 这是游戏核心逻辑的类型系统
 */

// ============================================================
// 基础 ID 类型
// ============================================================

export type PlayerId = string;
export type CharacterId = string;
export type SessionId = string;

// ============================================================
// 游戏阶段
// ============================================================

export const Phase = {
    /** 游戏设置阶段 - 分配角色 */
    SETUP: 'SETUP',
    /** 夜晚阶段 - 角色行动 */
    NIGHT: 'NIGHT',
    /** 白天阶段 - 讨论 */
    DAY: 'DAY',
    /** 提名阶段 */
    NOMINATION: 'NOMINATION',
    /** 投票阶段 */
    VOTE: 'VOTE',
    /** 处决阶段 */
    EXECUTION: 'EXECUTION',
    /** 游戏结束 */
    GAME_OVER: 'GAME_OVER'
} as const;

export type Phase = typeof Phase[keyof typeof Phase];

// ============================================================
// 阵营类型
// ============================================================

export const Team = {
    /** 镇民 - 善良阵营 */
    TOWNSFOLK: 'TOWNSFOLK',
    /** 外来者 - 善良阵营但有负面能力 */
    OUTSIDER: 'OUTSIDER',
    /** 爪牙 - 邪恶阵营 */
    MINION: 'MINION',
    /** 恶魔 - 邪恶阵营首领 */
    DEMON: 'DEMON',
    /** 旅行者 - 特殊角色 */
    TRAVELER: 'TRAVELER'
} as const;

export type Team = typeof Team[keyof typeof Team];

// ============================================================
// 玩家状态
// ============================================================

export interface PlayerStatus {
    /** 是否被毒害（能力失效） */
    poisoned: boolean;
    /** 是否酒醉（信息错误） */
    drunk: boolean;
    /** 是否被保护 */
    protected: boolean;
    /** 自定义状态标记 */
    customMarkers: string[];
}

// ============================================================
// 玩家
// ============================================================

export interface Player {
    /** 玩家唯一 ID */
    id: PlayerId;
    /** 玩家名称 */
    name: string;
    /** 分配的角色 ID */
    characterId: CharacterId | null;
    /** 座位索引（0-based） */
    seatIndex: number;
    /** 是否死亡 */
    isDead: boolean;
    /** 是否是幽灵（死亡但仍可投票一次） */
    isGhost: boolean;
    /** 幽灵是否已使用投票 */
    hasUsedGhostVote: boolean;
    /** 玩家状态 */
    status: PlayerStatus;
    /** 是否是说书人 */
    isStoryteller: boolean;
}

// ============================================================
// 角色定义
// ============================================================

export interface Character {
    /** 角色唯一 ID */
    id: CharacterId;
    /** 角色名称 */
    name: string;
    /** 角色名称（英文） */
    nameEn: string;
    /** 所属阵营 */
    team: Team;
    /** 能力描述 */
    abilityText: string;
    /** 首夜是否行动 */
    firstNight: boolean;
    /** 其他夜晚是否行动 */
    otherNight: boolean;
    /** 首夜行动顺序 */
    firstNightOrder?: number;
    /** 其他夜晚行动顺序 */
    otherNightOrder?: number;
    /** 设置时提醒 */
    setupReminder?: string;
    /** 角色图标 */
    icon?: string;
}

// ============================================================
// 投票记录
// ============================================================

export interface Vote {
    /** 投票者 ID */
    voterId: PlayerId;
    /** 投票目标（被提名者） */
    nomineeId: PlayerId;
    /** 是否投了赞成票 */
    voted: boolean;
    /** 投票时间 */
    timestamp: number;
}

export interface NominationRecord {
    /** 提名者 ID */
    nominatorId: PlayerId;
    /** 被提名者 ID */
    nomineeId: PlayerId;
    /** 投票结果 */
    votes: Vote[];
    /** 赞成票数 */
    votesFor: number;
    /** 是否通过（票数超过存活人数一半） */
    passed: boolean;
    /** 发生的天数 */
    day: number;
}

// ============================================================
// 处决记录
// ============================================================

export interface ExecutionRecord {
    /** 被处决者 ID */
    executedId: PlayerId;
    /** 发生的天数 */
    day: number;
    /** 票数 */
    voteCount: number;
}

// ============================================================
// 夜晚行动记录
// ============================================================

export interface NightAction {
    /** 行动者 ID */
    actorId: PlayerId;
    /** 目标 ID（如果有） */
    targetId?: PlayerId;
    /** 行动类型 */
    actionType: string;
    /** 结果 */
    result?: unknown;
    /** 夜晚序号 */
    night: number;
}

// ============================================================
// 游戏日志条目
// ============================================================

export const LogType = {
    GAME_START: 'GAME_START',
    GAME_END: 'GAME_END',
    PHASE_CHANGE: 'PHASE_CHANGE',
    PLAYER_DEATH: 'PLAYER_DEATH',
    NOMINATION: 'NOMINATION',
    VOTE: 'VOTE',
    EXECUTION: 'EXECUTION',
    NIGHT_ACTION: 'NIGHT_ACTION',
    ROLE_REVEAL: 'ROLE_REVEAL',
    CUSTOM: 'CUSTOM'
} as const;

export type LogType = typeof LogType[keyof typeof LogType];

export interface LogEntry {
    /** 日志 ID */
    id: string;
    /** 日志类型 */
    type: LogType;
    /** 日志消息 */
    message: string;
    /** 相关数据 */
    data?: Record<string, unknown>;
    /** 时间戳 */
    timestamp: number;
    /** 天数 */
    day: number;
    /** 阶段 */
    phase: Phase;
}

// ============================================================
// 游戏状态
// ============================================================

export interface GameState {
    /** 游戏会话 ID */
    sessionId: SessionId;
    /** 当前阶段 */
    phase: Phase;
    /** 当前天数（从 1 开始） */
    currentDay: number;
    /** 当前夜晚（从 0 开始，0 = 首夜） */
    currentNight: number;
    /** 是否是首夜 */
    isFirstNight: boolean;
    /** 存活玩家数量 */
    aliveCount: number;
    /** 所有玩家 */
    players: Player[];
    /** 当前被提名者 ID */
    currentNomineeId: PlayerId | null;
    /** 当前提名者 ID */
    currentNominatorId: PlayerId | null;
    /** 投票记录：玩家ID -> 是否投票 */
    currentVotes: Record<PlayerId, boolean>;
    /** 今日已提名过的玩家 */
    nominatedToday: PlayerId[];
    /** 今日已执行提名的玩家 */
    nominatorsToday: PlayerId[];
    /** 今日处决目标（票数最高者） */
    executionTarget: PlayerId | null;
    /** 今日最高票数 */
    highestVoteCount: number;
    /** 投票历史 */
    nominationHistory: NominationRecord[];
    /** 处决历史 */
    executionHistory: ExecutionRecord[];
    /** 夜晚行动历史 */
    nightActions: NightAction[];
    /** 游戏日志 */
    history: LogEntry[];
    /** 获胜阵营 */
    winner: Team | null;
    /** 游戏结束原因 */
    endReason: string | null;
}

// ============================================================
// 游戏配置
// ============================================================

export interface GameConfig {
    /** 最大玩家数 */
    maxPlayers: number;
    /** 最小玩家数 */
    minPlayers: number;
    /** 使用的剧本 */
    script: string;
    /** 可用角色列表 */
    availableCharacters: Character[];
    /** 是否启用旅行者 */
    allowTravelers: boolean;
    /** 是否启用私聊 */
    allowWhispers: boolean;
    /** 投票倒计时（秒） */
    voteTimeLimit: number;
    /** 讨论时间限制（秒，0 = 无限制） */
    discussionTimeLimit: number;
}

// ============================================================
// 状态机事件类型
// ============================================================

export type GameEvent =
    // 设置阶段
    | { type: 'ADD_PLAYER'; player: Omit<Player, 'id' | 'seatIndex' | 'status'> }
    | { type: 'REMOVE_PLAYER'; playerId: PlayerId }
    | { type: 'ASSIGN_ROLE'; playerId: PlayerId; characterId: CharacterId }
    | { type: 'START_GAME' }
    // 夜晚阶段
    | { type: 'NIGHT_ACTION'; actorId: PlayerId; targetId?: PlayerId; actionType: string }
    | { type: 'END_NIGHT' }
    // 白天阶段
    | { type: 'NOMINATE'; nominatorId: PlayerId; nomineeId: PlayerId }
    | { type: 'CANCEL_NOMINATION' }
    | { type: 'START_VOTE' }
    | { type: 'CAST_VOTE'; voterId: PlayerId; vote: boolean }
    | { type: 'FINISH_VOTE' }
    | { type: 'EXECUTE' }
    | { type: 'SKIP_EXECUTION' }
    | { type: 'END_DAY' }
    // 游戏结束
    | { type: 'END_GAME'; winner: Team; reason: string }
    // 特殊操作
    | { type: 'KILL_PLAYER'; playerId: PlayerId; cause: string }
    | { type: 'REVIVE_PLAYER'; playerId: PlayerId }
    | { type: 'SET_PLAYER_STATUS'; playerId: PlayerId; status: Partial<PlayerStatus> };

// ============================================================
// 工具函数
// ============================================================

/** 获取善良阵营 */
export function isGoodTeam(team: Team): boolean {
    return team === Team.TOWNSFOLK || team === Team.OUTSIDER;
}

/** 获取邪恶阵营 */
export function isEvilTeam(team: Team): boolean {
    return team === Team.MINION || team === Team.DEMON;
}

/** 创建默认玩家状态 */
export function createDefaultPlayerStatus(): PlayerStatus {
    return {
        poisoned: false,
        drunk: false,
        protected: false,
        customMarkers: []
    };
}

/** 创建新玩家 */
export function createPlayer(
    id: PlayerId,
    name: string,
    seatIndex: number
): Player {
    return {
        id,
        name,
        characterId: null,
        seatIndex,
        isDead: false,
        isGhost: false,
        hasUsedGhostVote: false,
        status: createDefaultPlayerStatus(),
        isStoryteller: false
    };
}

/** 计算存活玩家数 */
export function countAlivePlayers(players: Player[]): number {
    return players.filter(p => !p.isDead && !p.isStoryteller).length;
}

/** 计算投票通过所需票数 */
export function getVotesRequired(aliveCount: number): number {
    return Math.ceil(aliveCount / 2);
}

/** 计算处决阈值（从玩家数组直接计算） */
export function getExecutionThreshold(players: Player[]): number {
    const aliveCount = countAlivePlayers(players);
    return getVotesRequired(aliveCount);
}
