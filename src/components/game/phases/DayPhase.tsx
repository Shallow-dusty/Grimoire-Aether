/**
 * DayPhase - 白天阶段组件
 *
 * 管理白天的讨论、提名、投票流程
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, MessageCircle, Users, Vote } from 'lucide-react';
import { type GameMachineState } from '../../../logic/machines/gameMachine';
import { type PlayerId } from '../../../types/game';
import { NominationPanel } from '../ui/NominationPanel';
import { VotingPanel } from '../ui/VotingPanel';
import { ClockwiseVoting } from '../ui/ClockwiseVoting';

interface DayPhaseProps {
    machineState: GameMachineState;
    players: Array<{
        id: PlayerId;
        name: string;
        characterId: string;
        isDead: boolean;
        isGhost: boolean;
        hasUsedGhostVote: boolean;
    }>;
    onEnterNomination: () => void; // 新增：进入提名阶段
    onStartNomination: (nominatorId: PlayerId, nomineeId: PlayerId) => void;
    onCancelNomination: () => void;
    onVote: (voterId: PlayerId, voteFor: boolean) => void;
    onEndVoting: () => void;
    // 时针投票相关
    onClockwiseVote?: (voterId: PlayerId, voteFor: boolean) => void;
    onClockwiseNext?: () => void;
    onClockwisePrevious?: () => void;
    onFinishClockwiseVote?: () => void;
    // 其他
    onEndDay: () => void;
    isStoryteller: boolean;
    currentPlayerId?: PlayerId;
}

export function DayPhase({
    machineState,
    players,
    onEnterNomination, // 新增
    onStartNomination,
    onCancelNomination,
    onVote,
    onEndVoting,
    // 时针投票回调
    onClockwiseVote,
    onClockwiseNext,
    onClockwisePrevious,
    onFinishClockwiseVote,
    // 其他
    onEndDay,
    isStoryteller,
    currentPlayerId
}: DayPhaseProps) {
    const currentDay = machineState.context.currentDay;
    const executedToday = machineState.context.executedToday;

    // 从状态机获取提名投票信息
    const currentNominatorId = machineState.context.currentNominatorId;
    const currentNomineeId = machineState.context.currentNomineeId;
    const nominatedToday = machineState.context.nominatedToday || [];
    const nominatorsToday = machineState.context.nominatorsToday || [];
    const currentVotes = machineState.context.currentVotes || {};

    // 时针投票状态
    const useClockwiseVoting = machineState.context.useClockwiseVoting;
    const clockwiseVoting = machineState.context.clockwiseVoting;

    // 从currentVotes计算votesFor和votesAgainst
    const votesFor = Object.entries(currentVotes)
        .filter(([_, vote]) => vote === true)
        .map(([voterId]) => voterId);
    const votesAgainst = Object.entries(currentVotes)
        .filter(([_, vote]) => vote === false)
        .map(([voterId]) => voterId);

    // 判断当前阶段
    const isDiscussion = machineState.matches('gameLoop.day.discussion');
    const isNominating = machineState.matches('gameLoop.day.nomination');
    const isVoting = machineState.matches('gameLoop.day.vote');
    const isClockwiseVoting = machineState.matches('gameLoop.day.clockwiseVote');

    const alivePlayers = players.filter(p => !p.isDead);
    const deadPlayers = players.filter(p => p.isDead);

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
            <motion.div
                className="bg-gradient-to-br from-amber-950/95 to-black/95 backdrop-blur-xl border border-amber-400/30 rounded-2xl shadow-2xl overflow-hidden"
                initial={{ y: -50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0, scale: 0.9 }}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-400/20 bg-gradient-to-r from-amber-900/50 to-orange-900/50">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Sun className="w-6 h-6 text-amber-300" />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-bold text-amber-200">
                                第 {currentDay} 天
                            </h2>
                            <p className="text-xs text-amber-400/70">
                                {isDiscussion ? '自由讨论阶段' : '提名投票阶段'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300">{alivePlayers.length} 存活</span>
                        </div>
                        {deadPlayers.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-stone-500" />
                                <span className="text-stone-400">{deadPlayers.length} 死亡</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 阶段内容 */}
                <AnimatePresence mode="wait">
                    {/* 讨论阶段 */}
                    {isDiscussion && (
                        <motion.div
                            key="discussion"
                            className="p-6 space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
                                <MessageCircle className="w-6 h-6 text-amber-300 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-amber-200 mb-2">
                                        自由讨论时间
                                    </h3>
                                    <p className="text-sm text-amber-300/80 leading-relaxed">
                                        玩家可以自由交流信息、讨论推理、分享线索。说书人可以在讨论结束后开启提名投票。
                                    </p>
                                </div>
                            </div>

                            {/* 今日状态 */}
                            <div className="flex items-center gap-2 p-4 bg-black/20 rounded-xl">
                                {executedToday ? (
                                    <>
                                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                                        <span className="text-sm text-red-300">
                                            今天已处决一名玩家
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-sm text-emerald-300">
                                            今天尚未处决
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* 说书人控制 */}
                            {isStoryteller && !executedToday && (
                                <button
                                    onClick={onEnterNomination}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-xl text-blue-300 font-medium transition-all hover:scale-105"
                                >
                                    <Vote className="w-5 h-5" />
                                    进入提名阶段
                                </button>
                            )}

                            {isStoryteller && executedToday && (
                                <button
                                    onClick={onEndDay}
                                    className="w-full px-6 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-xl text-amber-300 font-medium transition-all hover:scale-105"
                                >
                                    结束白天
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* 提名阶段 */}
                    {isNominating && (
                        <motion.div
                            key="nomination"
                            className="p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <NominationPanel
                                players={players}
                                nominatedToday={nominatedToday}
                                nominatorsToday={nominatorsToday}
                                currentNominatorId={currentNominatorId}
                                currentNomineeId={currentNomineeId}
                                onStartNomination={onStartNomination}
                                onCancelNomination={onCancelNomination}
                                isNominating={false}
                                isStoryteller={isStoryteller}
                            />
                        </motion.div>
                    )}

                    {/* 投票阶段 */}
                    {isVoting && currentNominatorId && currentNomineeId && (
                        <motion.div
                            key="voting"
                            className="p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <VotingPanel
                                players={players}
                                nominatorId={currentNominatorId}
                                nomineeId={currentNomineeId}
                                votesFor={votesFor}
                                votesAgainst={votesAgainst}
                                onVote={onVote}
                                onEndVoting={onEndVoting}
                                isStoryteller={isStoryteller}
                                currentPlayerId={currentPlayerId}
                            />
                        </motion.div>
                    )}

                    {/* 时针投票阶段 */}
                    {isClockwiseVoting && currentNominatorId && currentNomineeId && clockwiseVoting && (
                        <motion.div
                            key="clockwise-voting"
                            className="p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ClockwiseVoting
                                players={players}
                                nominatorId={currentNominatorId}
                                nomineeId={currentNomineeId}
                                voteOrder={clockwiseVoting.voteOrder}
                                currentVoteIndex={clockwiseVoting.currentVoteIndex}
                                votes={clockwiseVoting.votes}
                                onVote={onClockwiseVote || (() => {})}
                                onNext={onClockwiseNext || (() => {})}
                                onPrevious={onClockwisePrevious || (() => {})}
                                onEndVoting={onFinishClockwiseVote || (() => {})}
                                isStoryteller={isStoryteller}
                                currentPlayerId={currentPlayerId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
