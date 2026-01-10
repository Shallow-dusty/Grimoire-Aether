/**
 * Blood on the Clocktower - 游戏状态机
 * 
 * 使用 XState v5 实现游戏流程控制
 */

import { setup, assign, assertEvent, and } from 'xstate';
import {
    type PlayerId,
    type CharacterId,
    type Player,
    type LogEntry,
    type NominationRecord,
    type Vote,
    Phase,
    Team,
    LogType,
    createPlayer,
    countAlivePlayers,
    getVotesRequired
} from '../../types/game';
import {
    type NightQueue,
    buildNightQueue,
    getCurrentAction,
    completeCurrentAction,
    isNightComplete
} from '../night/nightActions';
import {
    checkGameEnd,
    checkScarletWomanTransform
} from '../game/gameEnd';
import { getCharacterById } from '../../data/characters/trouble-brewing';

// ============================================================
// 状态机上下文类型
// ============================================================

export interface GameContext {
    /** 游戏会话 ID */
    sessionId: string;
    /** 所有玩家 */
    players: Player[];
    /** 当前天数 */
    currentDay: number;
    /** 当前夜晚 */
    currentNight: number;
    /** 是否首夜 */
    isFirstNight: boolean;
    /** 游戏日志 */
    history: LogEntry[];
    /** 夜晚行动队列 */
    nightQueue: NightQueue | null;
    /** 当前被提名者 */
    currentNomineeId: PlayerId | null;
    /** 当前提名者 */
    currentNominatorId: PlayerId | null;
    /** 当前投票记录 */
    currentVotes: Record<PlayerId, boolean>;
    /** 今日已被提名的玩家 */
    nominatedToday: PlayerId[];
    /** 今日已提名他人的玩家 */
    nominatorsToday: PlayerId[];
    /** 今日处决目标 */
    executionTarget: PlayerId | null;
    /** 今日最高票数 */
    highestVoteCount: number;
    /** 今日今日是否已处决 */
    executedToday: boolean;
    /** 提名历史 */
    nominationHistory: NominationRecord[];
    /** 获胜阵营 */
    winner: Team | null;
    /** 结束原因 */
    endReason: string | null;
    /** 时针投票模式 */
    useClockwiseVoting: boolean;
    /** 时针投票状态（仅在 useClockwiseVoting 为 true 时有效） */
    clockwiseVoting: {
        /** 投票顺序（顺时针玩家 ID 列表） */
        voteOrder: PlayerId[];
        /** 当前投票索引 */
        currentVoteIndex: number;
        /** 投票记录（null 表示未投票） */
        votes: Record<PlayerId, boolean | null>;
    } | null;
    /** 管家的主人记录（管家ID -> 主人ID） */
    butlerMasters: Record<PlayerId, PlayerId>;
}

// ============================================================
// 状态机事件类型
// ============================================================

export type GameMachineEvent =
    // 设置阶段
    | { type: 'ADD_PLAYER'; name: string }
    | { type: 'REMOVE_PLAYER'; playerId: PlayerId }
    | { type: 'ASSIGN_ROLE'; playerId: PlayerId; characterId: CharacterId }
    | { type: 'START_GAME' }
    // 夜晚
    | { type: 'PROCEED_NIGHT_ACTION' }
    | { type: 'USE_ABILITY'; actorId: PlayerId; targetIds?: PlayerId[] }
    | { type: 'SKIP_NIGHT_ACTION' }
    | { type: 'END_NIGHT' }
    // 白天
    | { type: 'ENTER_NOMINATION' } // 进入提名阶段（不需要参数）
    | { type: 'NOMINATE'; nominatorId: PlayerId; nomineeId: PlayerId }
    | { type: 'CANCEL_NOMINATION' }
    | { type: 'START_VOTE' }
    | { type: 'CAST_VOTE'; voterId: PlayerId; vote: boolean }
    | { type: 'FINISH_VOTE' }
    // 时针投票
    | { type: 'ENABLE_CLOCKWISE_VOTING' }
    | { type: 'DISABLE_CLOCKWISE_VOTING' }
    | { type: 'START_CLOCKWISE_VOTE' }
    | { type: 'CLOCKWISE_VOTE'; voterId: PlayerId; vote: boolean }
    | { type: 'CLOCKWISE_NEXT' }
    | { type: 'CLOCKWISE_PREVIOUS' }
    | { type: 'FINISH_CLOCKWISE_VOTE' }
    // 处决
    | { type: 'EXECUTE' }
    | { type: 'SKIP_EXECUTION' }
    | { type: 'END_DAY' }
    // 游戏结束
    | { type: 'END_GAME'; winner: Team; reason: string }
    | { type: 'CHECK_GAME_END' }
    // 特殊
    | { type: 'KILL_PLAYER'; playerId: PlayerId; cause: string }
    | { type: 'REVIVE_PLAYER'; playerId: PlayerId }
    | { type: 'TRANSFORM_SCARLET_WOMAN'; playerId: PlayerId }
    // 杀手能力
    | { type: 'SLAYER_ABILITY'; slayerId: PlayerId; targetId: PlayerId };

// ============================================================
// 辅助函数
// ============================================================

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

function createLogEntry(
    type: LogType,
    message: string,
    context: GameContext,
    data?: Record<string, unknown>
): LogEntry {
    return {
        id: generateId(),
        type,
        message,
        data,
        timestamp: Date.now(),
        day: context.currentDay,
        phase: Phase.SETUP // 会在使用时被覆盖
    };
}

function getAliveCount(players: Player[]): number {
    return countAlivePlayers(players);
}

// ============================================================
// 游戏状态机
// ============================================================

export const gameMachine = setup({
    types: {
        context: {} as GameContext,
        events: {} as GameMachineEvent
    },

    actions: {
        // 添加玩家
        addPlayer: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'ADD_PLAYER');
                const newPlayer = createPlayer(
                    generateId(),
                    event.name,
                    context.players.length
                );
                return [...context.players, newPlayer];
            },
            history: ({ context, event }) => {
                assertEvent(event, 'ADD_PLAYER');
                const log = createLogEntry(
                    LogType.CUSTOM,
                    `玩家 ${event.name} 加入游戏`,
                    context
                );
                return [...context.history, log];
            }
        }),

        // 移除玩家
        removePlayer: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'REMOVE_PLAYER');
                return context.players
                    .filter(p => p.id !== event.playerId)
                    .map((p, index) => ({ ...p, seatIndex: index }));
            }
        }),

        // 分配角色
        assignRole: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'ASSIGN_ROLE');
                return context.players.map(p =>
                    p.id === event.playerId
                        ? { ...p, characterId: event.characterId }
                        : p
                );
            }
        }),

        // 开始游戏 - 记录日志
        logGameStart: assign({
            history: ({ context }) => {
                const log = createLogEntry(
                    LogType.GAME_START,
                    `游戏开始！共 ${context.players.length} 名玩家`,
                    context,
                    { playerCount: context.players.length }
                );
                return [...context.history, log];
            }
        }),

        // 进入夜晚
        enterNight: assign({
            currentNight: ({ context }) => context.currentNight + 1,
            isFirstNight: ({ context }) => context.currentNight === 0,
            nightQueue: ({ context }) => {
                const isFirst = context.currentNight === 0;
                return buildNightQueue(context.players, isFirst, context.currentNight + 1);
            },
            // 清除管家主人记录（每晚重新选择）
            butlerMasters: () => ({}),
            history: ({ context }) => {
                const nightNum = context.currentNight + 1;
                const log = createLogEntry(
                    LogType.PHASE_CHANGE,
                    nightNum === 1 ? '首夜降临...' : `第 ${nightNum} 夜降临...`,
                    context,
                    { night: nightNum }
                );
                return [...context.history, log];
            }
        }),

        // 推进夜晚行动
        proceedNightAction: assign({
            nightQueue: ({ context }) => {
                if (!context.nightQueue) return null;
                return completeCurrentAction(context.nightQueue);
            }
        }),

        // 清除夜晚队列
        clearNightQueue: assign({
            nightQueue: () => null
        }),

        // 进入白天
        enterDay: assign({
            currentDay: ({ context }) => context.currentDay + 1,
            isFirstNight: () => false,
            // 重置每日状态
            nominatedToday: () => [],
            nominatorsToday: () => [],
            executionTarget: () => null,
            highestVoteCount: () => 0,
            executedToday: () => false,
            history: ({ context }) => {
                const dayNum = context.currentDay + 1;
                const log = createLogEntry(
                    LogType.PHASE_CHANGE,
                    `第 ${dayNum} 天开始`,
                    context,
                    { day: dayNum }
                );
                return [...context.history, log];
            }
        }),

        // 设置提名
        setNomination: assign({
            currentNomineeId: ({ event }) => {
                assertEvent(event, 'NOMINATE');
                return event.nomineeId;
            },
            currentNominatorId: ({ event }) => {
                assertEvent(event, 'NOMINATE');
                return event.nominatorId;
            },
            nominatedToday: ({ context, event }) => {
                assertEvent(event, 'NOMINATE');
                return [...context.nominatedToday, event.nomineeId];
            },
            nominatorsToday: ({ context, event }) => {
                assertEvent(event, 'NOMINATE');
                return [...context.nominatorsToday, event.nominatorId];
            },
            currentVotes: () => ({}),
            history: ({ context, event }) => {
                assertEvent(event, 'NOMINATE');
                const nominator = context.players.find(p => p.id === event.nominatorId);
                const nominee = context.players.find(p => p.id === event.nomineeId);
                const log = createLogEntry(
                    LogType.NOMINATION,
                    `${nominator?.name} 提名了 ${nominee?.name}`,
                    context,
                    { nominatorId: event.nominatorId, nomineeId: event.nomineeId }
                );
                return [...context.history, log];
            }
        }),

        // 清除提名
        clearNomination: assign({
            currentNomineeId: () => null,
            currentNominatorId: () => null,
            currentVotes: () => ({})
        }),

        // 记录投票
        recordVote: assign(({ context, event }) => {
            assertEvent(event, 'CAST_VOTE');
            const voter = context.players.find(p => p.id === event.voterId);

            // 更新投票记录
            const currentVotes = {
                ...context.currentVotes,
                [event.voterId]: event.vote
            };

            // 如果是幽灵投票，标记为已使用
            if (voter && voter.isGhost && !voter.hasUsedGhostVote) {
                return {
                    currentVotes,
                    players: context.players.map(p =>
                        p.id === event.voterId
                            ? { ...p, hasUsedGhostVote: true }
                            : p
                    )
                };
            }

            return { currentVotes };
        }),

        // 计算投票结果
        calculateVoteResult: assign(({ context }) => {
            const votesFor = Object.values(context.currentVotes).filter(v => v).length;
            const aliveCount = getAliveCount(context.players);
            const votesRequired = getVotesRequired(aliveCount);
            const passed = votesFor >= votesRequired;

            // 记录到提名历史
            const votes: Vote[] = Object.entries(context.currentVotes).map(([voterId, voted]) => ({
                voterId,
                nomineeId: context.currentNomineeId!,
                voted,
                timestamp: Date.now()
            }));

            const nominationRecord: NominationRecord = {
                nominatorId: context.currentNominatorId!,
                nomineeId: context.currentNomineeId!,
                votes,
                votesFor,
                passed,
                day: context.currentDay
            };

            // 更新处决目标
            let newExecutionTarget = context.executionTarget;
            let newHighestVoteCount = context.highestVoteCount;

            if (passed && votesFor > context.highestVoteCount) {
                newExecutionTarget = context.currentNomineeId;
                newHighestVoteCount = votesFor;
            }

            const log = createLogEntry(
                LogType.VOTE,
                `投票结果：${votesFor} 票${passed ? '（通过）' : '（未通过）'}`,
                context,
                { votesFor, votesRequired, passed }
            );

            return {
                nominationHistory: [...context.nominationHistory, nominationRecord],
                executionTarget: newExecutionTarget,
                highestVoteCount: newHighestVoteCount,
                currentNomineeId: null,
                currentNominatorId: null,
                currentVotes: {},
                history: [...context.history, log]
            };
        }),

        // ============================================================
        // 时针投票相关 Actions
        // ============================================================

        // 启用时针投票模式
        enableClockwiseVoting: assign({
            useClockwiseVoting: () => true
        }),

        // 禁用时针投票模式
        disableClockwiseVoting: assign({
            useClockwiseVoting: () => false,
            clockwiseVoting: () => null
        }),

        // 初始化时针投票
        initializeClockwiseVoting: assign({
            clockwiseVoting: ({ context }) => {
                // 生成投票顺序：从提名者的下一位开始，顺时针排列
                const nominator = context.players.find(p => p.id === context.currentNominatorId);
                if (!nominator) return null;

                // 获取可以投票的玩家（存活 + 幽灵且未使用幽灵投票）
                const eligibleVoters = context.players.filter(p =>
                    !p.isDead || (p.isGhost && !p.hasUsedGhostVote)
                );

                // 按座位顺序排序
                const sortedVoters = [...eligibleVoters].sort((a, b) => a.seatIndex - b.seatIndex);

                // 找到提名者在可投票玩家中的索引
                const nominatorIndexInVoters = sortedVoters.findIndex(p => p.id === nominator.id);

                // 从提名者的下一位开始，顺时针排列投票顺序
                const voteOrder: PlayerId[] = [];
                for (let i = 0; i < sortedVoters.length; i++) {
                    // 如果提名者在可投票列表中，从其下一位开始；否则从第一位开始
                    const startIndex = nominatorIndexInVoters >= 0 ? nominatorIndexInVoters + 1 : 0;
                    const voterIndex = (startIndex + i) % sortedVoters.length;
                    voteOrder.push(sortedVoters[voterIndex].id);
                }

                // 初始化投票记录
                const votes: Record<PlayerId, boolean | null> = {};
                voteOrder.forEach(playerId => {
                    votes[playerId] = null;
                });

                return {
                    voteOrder,
                    currentVoteIndex: 0,
                    votes
                };
            }
        }),

        // 记录时针投票
        recordClockwiseVote: assign(({ context, event }) => {
            assertEvent(event, 'CLOCKWISE_VOTE');
            if (!context.clockwiseVoting) return {};

            const voter = context.players.find(p => p.id === event.voterId);

            const updatedClockwiseVoting = {
                ...context.clockwiseVoting,
                votes: {
                    ...context.clockwiseVoting.votes,
                    [event.voterId]: event.vote
                }
            };

            // 如果是幽灵投票，标记为已使用
            if (voter && voter.isGhost && !voter.hasUsedGhostVote) {
                return {
                    clockwiseVoting: updatedClockwiseVoting,
                    players: context.players.map(p =>
                        p.id === event.voterId
                            ? { ...p, hasUsedGhostVote: true }
                            : p
                    )
                };
            }

            return { clockwiseVoting: updatedClockwiseVoting };
        }),

        // 前进到下一位投票者
        advanceClockwiseVoter: assign({
            clockwiseVoting: ({ context }) => {
                if (!context.clockwiseVoting) return null;

                const nextIndex = context.clockwiseVoting.currentVoteIndex + 1;
                return {
                    ...context.clockwiseVoting,
                    currentVoteIndex: nextIndex
                };
            }
        }),

        // 后退到上一位投票者
        retreatClockwiseVoter: assign({
            clockwiseVoting: ({ context }) => {
                if (!context.clockwiseVoting) return null;

                const prevIndex = Math.max(0, context.clockwiseVoting.currentVoteIndex - 1);
                return {
                    ...context.clockwiseVoting,
                    currentVoteIndex: prevIndex
                };
            }
        }),

        // 计算时针投票结果
        calculateClockwiseVoteResult: assign(({ context }) => {
            if (!context.clockwiseVoting) {
                return {};
            }

            // 统计投票结果
            const votesFor = Object.values(context.clockwiseVoting.votes).filter(v => v === true).length;
            const votesAgainst = Object.values(context.clockwiseVoting.votes).filter(v => v === false).length;

            const aliveCount = getAliveCount(context.players);
            const votesRequired = getVotesRequired(aliveCount);
            const passed = votesFor >= votesRequired;

            // 转换为标准投票记录
            const votes: Vote[] = Object.entries(context.clockwiseVoting.votes)
                .filter(([_, vote]) => vote !== null)
                .map(([voterId, voted]) => ({
                    voterId,
                    nomineeId: context.currentNomineeId!,
                    voted: voted as boolean,
                    timestamp: Date.now()
                }));

            const nominationRecord: NominationRecord = {
                nominatorId: context.currentNominatorId!,
                nomineeId: context.currentNomineeId!,
                votes,
                votesFor,
                passed,
                day: context.currentDay
            };

            // 更新处决目标
            let newExecutionTarget = context.executionTarget;
            let newHighestVoteCount = context.highestVoteCount;

            if (passed && votesFor > context.highestVoteCount) {
                newExecutionTarget = context.currentNomineeId;
                newHighestVoteCount = votesFor;
            }

            const log = createLogEntry(
                LogType.VOTE,
                `时针投票结果：${votesFor} 票${passed ? '（通过）' : '（未通过）'}`,
                context,
                { votesFor, votesRequired, passed, clockwise: true }
            );

            return {
                nominationHistory: [...context.nominationHistory, nominationRecord],
                executionTarget: newExecutionTarget,
                highestVoteCount: newHighestVoteCount,
                currentNomineeId: null,
                currentNominatorId: null,
                currentVotes: {},
                clockwiseVoting: null,
                history: [...context.history, log]
            };
        }),

        // ============================================================
        // 处决相关 Actions
        // ============================================================

        // 执行处决
        executePlayer: assign(({ context }) => {
            if (!context.executionTarget) return context;

            const player = context.players.find(p => p.id === context.executionTarget);

            const log = createLogEntry(
                LogType.EXECUTION,
                `${player?.name} 被处决`,
                context,
                { playerId: context.executionTarget }
            );

            return {
                players: context.players.map(p =>
                    p.id === context.executionTarget
                        ? { ...p, isDead: true, isGhost: true }
                        : p
                ),
                executionTarget: null,
                highestVoteCount: 0,
                executedToday: true,
                history: [...context.history, log]
            };
        }),

        // 杀死玩家（夜晚死亡等）
        killPlayer: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'KILL_PLAYER');
                return context.players.map(p =>
                    p.id === event.playerId
                        ? { ...p, isDead: true, isGhost: true }
                        : p
                );
            },
            history: ({ context, event }) => {
                assertEvent(event, 'KILL_PLAYER');
                const player = context.players.find(p => p.id === event.playerId);
                const log = createLogEntry(
                    LogType.PLAYER_DEATH,
                    `${player?.name} 死亡（${event.cause}）`,
                    context,
                    { playerId: event.playerId, cause: event.cause }
                );
                return [...context.history, log];
            }
        }),

        // 复活玩家
        revivePlayer: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'REVIVE_PLAYER');
                return context.players.map(p =>
                    p.id === event.playerId
                        ? { ...p, isDead: false, isGhost: false }
                        : p
                );
            }
        }),

        // 游戏结束
        setGameEnd: assign({
            winner: ({ event }) => {
                assertEvent(event, 'END_GAME');
                return event.winner;
            },
            endReason: ({ event }) => {
                assertEvent(event, 'END_GAME');
                return event.reason;
            },
            history: ({ context, event }) => {
                assertEvent(event, 'END_GAME');
                const teamName = event.winner === Team.TOWNSFOLK || event.winner === Team.OUTSIDER
                    ? '善良阵营'
                    : '邪恶阵营';
                const log = createLogEntry(
                    LogType.GAME_END,
                    `游戏结束！${teamName}获胜 - ${event.reason}`,
                    context,
                    { winner: event.winner, reason: event.reason }
                );
                return [...context.history, log];
            }
        }),

        // 猩红女郎转换为恶魔
        transformScarletWoman: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'TRANSFORM_SCARLET_WOMAN');
                return context.players.map(p =>
                    p.id === event.playerId
                        ? { ...p, characterId: 'imp' } // 变成小恶魔
                        : p
                );
            },
            history: ({ context, event }) => {
                assertEvent(event, 'TRANSFORM_SCARLET_WOMAN');
                const player = context.players.find(p => p.id === event.playerId);
                const log = createLogEntry(
                    LogType.CUSTOM,
                    `${player?.name} (猩红女郎) 变成了小恶魔！`,
                    context,
                    { playerId: event.playerId }
                );
                return [...context.history, log];
            }
        }),

        // 触发处女能力（杀死提名者）
        triggerVirginAbility: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'NOMINATE');
                return context.players.map(p => {
                    // 标记处女能力已使用
                    if (p.id === event.nomineeId) {
                        return {
                            ...p,
                            status: {
                                ...p.status,
                                customMarkers: [...p.status.customMarkers, 'virgin_used']
                            }
                        };
                    }
                    // 杀死提名者
                    if (p.id === event.nominatorId) {
                        return { ...p, isDead: true, isGhost: true };
                    }
                    return p;
                });
            },
            aliveCount: ({ context }) => countAlivePlayers(context.players) - 1,
            history: ({ context, event }) => {
                assertEvent(event, 'NOMINATE');
                const nominator = context.players.find(p => p.id === event.nominatorId);
                const nominee = context.players.find(p => p.id === event.nomineeId);
                const log = createLogEntry(
                    LogType.DEATH,
                    `${nominator?.name} 提名了处女 ${nominee?.name}，作为镇民被处女能力处决！`,
                    context,
                    { playerId: event.nominatorId }
                );
                return [...context.history, log];
            }
        }),

        // 使用杀手能力
        useSlayerAbility: assign({
            players: ({ context, event }) => {
                assertEvent(event, 'SLAYER_ABILITY');
                const target = context.players.find(p => p.id === event.targetId);
                const targetChar = target?.characterId ? getCharacterById(target.characterId) : null;
                const isDemon = targetChar?.team === Team.DEMON;

                return context.players.map(p => {
                    // 标记杀手能力已使用
                    if (p.id === event.slayerId) {
                        return {
                            ...p,
                            status: {
                                ...p.status,
                                customMarkers: [...p.status.customMarkers, 'slayer_used']
                            }
                        };
                    }
                    // 如果目标是恶魔，杀死目标
                    if (p.id === event.targetId && isDemon) {
                        return { ...p, isDead: true, isGhost: true };
                    }
                    return p;
                });
            },
            aliveCount: ({ context, event }) => {
                assertEvent(event, 'SLAYER_ABILITY');
                const target = context.players.find(p => p.id === event.targetId);
                const targetChar = target?.characterId ? getCharacterById(target.characterId) : null;
                const isDemon = targetChar?.team === Team.DEMON;
                return isDemon ? countAlivePlayers(context.players) - 1 : countAlivePlayers(context.players);
            },
            history: ({ context, event }) => {
                assertEvent(event, 'SLAYER_ABILITY');
                const slayer = context.players.find(p => p.id === event.slayerId);
                const target = context.players.find(p => p.id === event.targetId);
                const targetChar = target?.characterId ? getCharacterById(target.characterId) : null;
                const isDemon = targetChar?.team === Team.DEMON;

                const message = isDemon
                    ? `杀手 ${slayer?.name} 成功杀死了恶魔 ${target?.name}！`
                    : `杀手 ${slayer?.name} 尝试杀死 ${target?.name}，但什么也没发生`;

                const log = createLogEntry(
                    isDemon ? LogType.DEATH : LogType.CUSTOM,
                    message,
                    context,
                    { playerId: event.targetId }
                );
                return [...context.history, log];
            }
        })
    },

    guards: {
        // 是否有足够玩家开始游戏
        hasEnoughPlayers: ({ context }) => {
            return context.players.length >= 5;
        },
        // 是否所有玩家都有角色
        allPlayersHaveRoles: ({ context }) => {
            return context.players.every(p => p.characterId !== null);
        },
        // 提名是否有效
        isValidNomination: ({ context, event }) => {
            assertEvent(event, 'NOMINATE');
            const nominator = context.players.find(p => p.id === event.nominatorId);
            const nominee = context.players.find(p => p.id === event.nomineeId);

            // 提名者必须存在且今日未提名过（活人和幽灵都可以提名）
            if (!nominator) return false;
            if (context.nominatorsToday.includes(event.nominatorId)) return false;

            // 被提名者必须存活且今日未被提名过
            if (!nominee || nominee.isDead) return false;
            if (context.nominatedToday.includes(event.nomineeId)) return false;

            return true;
        },
        // 投票者是否可以投票
        canVote: ({ context, event }) => {
            assertEvent(event, 'CAST_VOTE');
            const player = context.players.find(p => p.id === event.voterId);
            if (!player) return false;

            // 检查是否是管家且需要等待主人投票
            if (player.characterId === 'butler') {
                const masterId = context.butlerMasters[player.id];
                if (masterId) {
                    // 检查主人是否已投票
                    const masterVoted = context.currentVotes[masterId] !== undefined;
                    if (!masterVoted) {
                        return false; // 主人还没投票，管家不能投票
                    }
                }
            }

            // 存活玩家可以投票
            if (!player.isDead) return true;

            // 幽灵只能投一次票
            if (player.isGhost && !player.hasUsedGhostVote) return true;

            return false;
        },
        // 是否有处决目标
        hasExecutionTarget: ({ context }) => {
            return context.executionTarget !== null;
        },
        // 夜晚是否完成
        isNightComplete: ({ context }) => {
            return context.nightQueue ? isNightComplete(context.nightQueue) : true;
        },
        // 是否应该检查游戏结束
        shouldCheckGameEnd: ({ context }) => {
            const result = checkGameEnd(
                context.players,
                context.executedToday,
                context.executionTarget || undefined
            );
            return result.isEnded;
        },
        // 猩红女郎是否应该转换
        shouldTransformScarletWoman: ({ context }) => {
            const result = checkScarletWomanTransform(context.players);
            return result.shouldTransform;
        },
        // 处女能力是否触发（被提名且提名者是镇民）
        shouldTriggerVirgin: ({ context, event }) => {
            assertEvent(event, 'NOMINATE');
            const nominee = context.players.find(p => p.id === event.nomineeId);
            const nominator = context.players.find(p => p.id === event.nominatorId);

            if (!nominee || !nominator) return false;

            // 被提名者必须是处女且能力未使用
            if (nominee.characterId !== 'virgin') return false;
            if (nominee.status.customMarkers.includes('virgin_used')) return false;

            // 提名者必须是镇民
            if (!nominator.characterId) return false;
            const nominatorChar = getCharacterById(nominator.characterId);
            if (!nominatorChar || nominatorChar.team !== Team.TOWNSFOLK) return false;

            return true;
        },
        // 杀手能力是否有效
        isValidSlayerAbility: ({ context, event }) => {
            assertEvent(event, 'SLAYER_ABILITY');
            const slayer = context.players.find(p => p.id === event.slayerId);
            const target = context.players.find(p => p.id === event.targetId);

            // 杀手必须存在、存活、是杀手角色、能力未使用
            if (!slayer || slayer.isDead) return false;
            if (slayer.characterId !== 'slayer') return false;
            if (slayer.status.customMarkers.includes('slayer_used')) return false;

            // 目标必须存在且存活
            if (!target || target.isDead) return false;

            return true;
        }
    }
}).createMachine({
    id: 'bloodOnTheClockTower',

    context: {
        sessionId: generateId(),
        players: [],
        currentDay: 0,
        currentNight: 0,
        isFirstNight: true,
        history: [],
        nightQueue: null,
        currentNomineeId: null,
        currentNominatorId: null,
        currentVotes: {},
        nominatedToday: [],
        nominatorsToday: [],
        executionTarget: null,
        highestVoteCount: 0,
        executedToday: false,
        nominationHistory: [],
        winner: null,
        endReason: null,
        useClockwiseVoting: false,
        clockwiseVoting: null,
        butlerMasters: {}
    },

    initial: 'setup',

    on: {
        // END_GAME 可以从任何状态触发
        END_GAME: {
            target: '.gameOver',
            actions: 'setGameEnd'
        },
        // CHECK_GAME_END 也可以从任何状态触发
        CHECK_GAME_END: {
            target: '.gameOver',
            guard: 'shouldCheckGameEnd',
            actions: assign(({ context }) => {
                const result = checkGameEnd(context.players, context.executedToday, context.executionTarget || undefined);
                if (result.isEnded && result.winner && result.reason) {
                    return {
                        winner: result.winner,
                        endReason: result.reason
                    };
                }
                return {};
            })
        },
        // KILL_PLAYER 可以从任何状态触发（说书人随时可以杀死玩家）
        KILL_PLAYER: {
            actions: 'killPlayer'
        }
    },

    states: {
        // ========================================
        // 设置阶段
        // ========================================
        setup: {
            on: {
                ADD_PLAYER: {
                    actions: 'addPlayer'
                },
                REMOVE_PLAYER: {
                    actions: 'removePlayer'
                },
                ASSIGN_ROLE: {
                    actions: 'assignRole'
                },
                START_GAME: {
                    target: 'gameLoop',
                    guard: and(['hasEnoughPlayers', 'allPlayersHaveRoles']),
                    actions: 'logGameStart'
                }
            }
        },

        // ========================================
        // 游戏主循环
        // ========================================
        gameLoop: {
            initial: 'night',

            states: {
                // 夜晚阶段
                night: {
                    entry: 'enterNight',
                    exit: 'clearNightQueue',
                    on: {
                        PROCEED_NIGHT_ACTION: {
                            actions: 'proceedNightAction'
                        },
                        USE_ABILITY: {
                            // 使用角色能力（由UI调用）
                            actions: [
                                'proceedNightAction',
                                // 处理管家能力：保存主人选择
                                assign(({ context, event }) => {
                                    assertEvent(event, 'USE_ABILITY');
                                    const actor = context.players.find(p => p.id === event.actorId);

                                    // 如果是管家且有目标，保存主人
                                    if (actor?.characterId === 'butler' && event.targetIds && event.targetIds.length > 0) {
                                        return {
                                            butlerMasters: {
                                                ...context.butlerMasters,
                                                [event.actorId]: event.targetIds[0]
                                            }
                                        };
                                    }

                                    return {};
                                })
                            ]
                        },
                        SKIP_NIGHT_ACTION: {
                            actions: 'proceedNightAction'
                        },
                        KILL_PLAYER: {
                            actions: 'killPlayer'
                        },
                        TRANSFORM_SCARLET_WOMAN: {
                            guard: 'shouldTransformScarletWoman',
                            actions: 'transformScarletWoman'
                        },
                        END_NIGHT: {
                            target: 'day'
                        },
                        CHECK_GAME_END: [
                            {
                                target: '#bloodOnTheClockTower.gameOver',
                                guard: 'shouldCheckGameEnd',
                                actions: assign(({ context }) => {
                                    const result = checkGameEnd(context.players, context.executedToday);
                                    if (result.isEnded && result.winner && result.reason) {
                                        return {
                                            winner: result.winner,
                                            endReason: result.reason
                                        };
                                    }
                                    return {};
                                })
                            }
                        ],
                        END_GAME: {
                            target: '#bloodOnTheClockTower.gameOver',
                            actions: 'setGameEnd'
                        }
                    }
                },

                // 白天阶段
                day: {
                    initial: 'discussion',
                    entry: 'enterDay',

                    states: {
                        // 讨论阶段
                        discussion: {
                            on: {
                                ENTER_NOMINATION: {
                                    target: 'nomination'
                                },
                                END_DAY: {
                                    target: '#bloodOnTheClockTower.gameLoop.execution'
                                },
                                END_GAME: {
                                    target: '#bloodOnTheClockTower.gameOver',
                                    actions: 'setGameEnd'
                                },
                                // 杀手能力（白天使用）
                                SLAYER_ABILITY: {
                                    guard: 'isValidSlayerAbility',
                                    actions: 'useSlayerAbility'
                                }
                            }
                        },

                        // 提名阶段
                        nomination: {
                            on: {
                                NOMINATE: [
                                    {
                                        // 处女能力触发：提名者是镇民，立即死亡
                                        guard: and(['isValidNomination', 'shouldTriggerVirgin']),
                                        actions: 'triggerVirginAbility',
                                        target: 'discussion'
                                    },
                                    {
                                        // 如果启用时针投票，进入 clockwiseVote
                                        guard: and(['isValidNomination', ({ context }) => context.useClockwiseVoting]),
                                        actions: ['setNomination', 'initializeClockwiseVoting'],
                                        target: 'clockwiseVote'
                                    },
                                    {
                                        // 否则进入普通投票
                                        guard: 'isValidNomination',
                                        actions: 'setNomination',
                                        target: 'vote'
                                    }
                                ],
                                CANCEL_NOMINATION: {
                                    target: 'discussion'
                                },
                                // 允许在提名阶段切换投票模式
                                ENABLE_CLOCKWISE_VOTING: {
                                    actions: 'enableClockwiseVoting'
                                },
                                DISABLE_CLOCKWISE_VOTING: {
                                    actions: 'disableClockwiseVoting'
                                }
                            }
                        },

                        // 投票阶段（传统并行投票）
                        vote: {
                            on: {
                                CAST_VOTE: {
                                    guard: 'canVote',
                                    actions: 'recordVote'
                                },
                                FINISH_VOTE: {
                                    target: 'discussion',
                                    actions: 'calculateVoteResult'
                                }
                            }
                        },

                        // 时针投票阶段
                        clockwiseVote: {
                            on: {
                                CLOCKWISE_VOTE: {
                                    actions: 'recordClockwiseVote'
                                },
                                CLOCKWISE_NEXT: {
                                    actions: 'advanceClockwiseVoter'
                                },
                                CLOCKWISE_PREVIOUS: {
                                    actions: 'retreatClockwiseVoter'
                                },
                                FINISH_CLOCKWISE_VOTE: {
                                    target: 'discussion',
                                    actions: 'calculateClockwiseVoteResult'
                                },
                                // 允许切换回普通投票（紧急情况）
                                DISABLE_CLOCKWISE_VOTING: {
                                    actions: 'disableClockwiseVoting',
                                    target: 'vote'
                                }
                            }
                        }
                    }
                },

                // 处决阶段
                execution: {
                    on: {
                        EXECUTE: [
                            {
                                // 处决后检查是否游戏结束
                                target: '#bloodOnTheClockTower.gameOver',
                                guard: ({ context }) => {
                                    // 先模拟处决
                                    const afterExecution = context.players.map(p =>
                                        p.id === context.executionTarget
                                            ? { ...p, isDead: true }
                                            : p
                                    );
                                    const result = checkGameEnd(afterExecution, true, context.executionTarget || undefined);
                                    return result.isEnded;
                                },
                                actions: [
                                    'executePlayer',
                                    assign(({ context }) => {
                                        const result = checkGameEnd(context.players, true, context.executionTarget || undefined);
                                        if (result.isEnded && result.winner && result.reason) {
                                            return {
                                                winner: result.winner,
                                                endReason: result.reason
                                            };
                                        }
                                        return {};
                                    })
                                ]
                            },
                            {
                                // 处决后检查猩红女郎
                                target: 'night',
                                guard: ({ context }) => {
                                    const hasTarget = context.executionTarget !== null;
                                    if (!hasTarget) return false;

                                    // 模拟处决后检查猩红女郎
                                    const afterExecution = context.players.map(p =>
                                        p.id === context.executionTarget
                                            ? { ...p, isDead: true }
                                            : p
                                    );
                                    const scarletResult = checkScarletWomanTransform(afterExecution);
                                    return scarletResult.shouldTransform;
                                },
                                actions: [
                                    'executePlayer',
                                    assign(({ context }) => {
                                        const scarletResult = checkScarletWomanTransform(context.players);
                                        if (scarletResult.shouldTransform && scarletResult.scarletWomanId) {
                                            // 直接在这里转换猩红女郎
                                            return {
                                                players: context.players.map(p =>
                                                    p.id === scarletResult.scarletWomanId
                                                        ? { ...p, characterId: 'imp' as CharacterId }
                                                        : p
                                                ),
                                                history: [...context.history, {
                                                    id: generateId(),
                                                    type: LogType.CUSTOM,
                                                    message: `${context.players.find(p => p.id === scarletResult.scarletWomanId)?.name} (猩红女郎) 变成了小恶魔！`,
                                                    timestamp: Date.now(),
                                                    day: context.currentDay,
                                                    phase: Phase.EXECUTION
                                                }]
                                            };
                                        }
                                        return {};
                                    })
                                ]
                            },
                            {
                                // 正常处决
                                target: 'night',
                                guard: 'hasExecutionTarget',
                                actions: 'executePlayer'
                            }
                        ],
                        SKIP_EXECUTION: {
                            target: 'night'
                        },
                        CHECK_GAME_END: [
                            {
                                target: '#bloodOnTheClockTower.gameOver',
                                guard: 'shouldCheckGameEnd'
                            }
                        ],
                        END_GAME: {
                            target: '#bloodOnTheClockTower.gameOver',
                            actions: 'setGameEnd'
                        }
                    }
                }
            }
        },

        // ========================================
        // 游戏结束
        // ========================================
        gameOver: {
            type: 'final'
        }
    }
});

// ============================================================
// 导出类型
// ============================================================

export type GameMachine = typeof gameMachine;
export type GameMachineState = ReturnType<typeof gameMachine.transition>;
