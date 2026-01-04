/**
 * VotingPanel - 投票面板组件
 *
 * 管理提名投票流程，玩家投赞成或反对票
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Clock, Users, Ghost, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { PlayerId } from '../../../types/game';
import { VoteCounter } from './VoteCounter';

export interface VotingPanelProps {
    /** 所有玩家 */
    players: Array<{
        id: PlayerId;
        name: string;
        isDead: boolean;
        isGhost: boolean;
        hasUsedGhostVote: boolean;
    }>;
    /** 提名者 ID */
    nominatorId: PlayerId;
    /** 被提名者 ID */
    nomineeId: PlayerId;
    /** 已投赞成票的玩家 ID 列表 */
    votesFor: PlayerId[];
    /** 已投反对票的玩家 ID 列表 */
    votesAgainst: PlayerId[];
    /** 投票回调 */
    onVote: (voterId: PlayerId, voteFor: boolean) => void;
    /** 结束投票回调 */
    onEndVoting: () => void;
    /** 是否为说书人 */
    isStoryteller: boolean;
    /** 当前玩家 ID（如果是玩家视角） */
    currentPlayerId?: PlayerId;
}

export function VotingPanel({
    players,
    nominatorId,
    nomineeId,
    votesFor,
    votesAgainst,
    onVote,
    onEndVoting,
    isStoryteller,
    currentPlayerId
}: VotingPanelProps) {
    const [selectedVoterId, setSelectedVoterId] = useState<PlayerId | null>(null);

    // 获取玩家信息
    const nominator = players.find(p => p.id === nominatorId);
    const nominee = players.find(p => p.id === nomineeId);

    // 存活玩家数
    const alivePlayers = players.filter(p => !p.isDead).length;

    // 可以投票的玩家（存活 + 幽灵且未使用幽灵投票）
    const eligibleVoters = players.filter(p =>
        !p.isDead || (p.isGhost && !p.hasUsedGhostVote)
    );

    // 已投票的玩家
    const votedPlayers = [...votesFor, ...votesAgainst];

    // 未投票的玩家
    const pendingVoters = eligibleVoters
        .filter(p => !votedPlayers.includes(p.id))
        .map(p => p.id);

    // 处理投票
    const handleVote = (voterId: PlayerId, voteFor: boolean) => {
        onVote(voterId, voteFor);
        setSelectedVoterId(null);
    };

    // 是否显示投票完成按钮
    const allVoted = pendingVoters.length === 0;

    return (
        <div className="space-y-6">
            {/* 提名信息 */}
            <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-amber-500/30 rounded-full">
                            <Users className="w-7 h-7 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-amber-200">
                                {nominator?.name} 提名 {nominee?.name}
                            </h3>
                            <p className="text-sm text-amber-300/70 mt-1">
                                {nominee?.name} 是否应该被处决？
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 投票计数器 */}
            <VoteCounter
                totalPlayers={players.length}
                alivePlayers={alivePlayers}
                votesFor={votesFor}
                votesAgainst={votesAgainst}
                pendingVotes={pendingVoters}
                showDetails={true}
            />

            {/* 说书人视图：管理所有玩家投票 */}
            {isStoryteller ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-stone-300 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            管理投票 ({eligibleVoters.length} 名可投票玩家)
                        </h4>
                        {allVoted && (
                            <motion.button
                                onClick={onEndVoting}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold transition-all hover:scale-105"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                结束投票
                            </motion.button>
                        )}
                    </div>

                    {/* 玩家投票列表 */}
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {eligibleVoters.map(voter => {
                            const hasVoted = votedPlayers.includes(voter.id);
                            const votedFor = votesFor.includes(voter.id);
                            const votedAgainst = votesAgainst.includes(voter.id);

                            return (
                                <motion.div
                                    key={voter.id}
                                    className={`relative p-4 rounded-xl border transition-all ${
                                        hasVoted
                                            ? votedFor
                                                ? 'bg-emerald-500/20 border-emerald-400'
                                                : 'bg-red-500/20 border-red-400'
                                            : selectedVoterId === voter.id
                                            ? 'bg-amber-500/20 border-amber-400 scale-105'
                                            : 'bg-stone-800/50 border-white/10 hover:bg-stone-700/50'
                                    }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* 玩家信息 */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${
                                                    hasVoted
                                                        ? votedFor
                                                            ? 'text-emerald-300'
                                                            : 'text-red-300'
                                                        : 'text-stone-200'
                                                }`}>
                                                    {voter.name}
                                                </span>
                                                {voter.isGhost && (
                                                    <span className="flex items-center gap-1 text-xs text-amber-400">
                                                        <Ghost className="w-3 h-3" />
                                                        幽灵投票
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 投票按钮或结果 */}
                                        {hasVoted ? (
                                            <div className="flex items-center gap-2">
                                                {votedFor ? (
                                                    <>
                                                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                                                        <span className="text-sm font-medium text-emerald-300">
                                                            赞成
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ThumbsDown className="w-5 h-5 text-red-400" />
                                                        <span className="text-sm font-medium text-red-300">
                                                            反对
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleVote(voter.id, true)}
                                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-lg transition-all hover:scale-110"
                                                    title="投赞成票"
                                                >
                                                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleVote(voter.id, false)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg transition-all hover:scale-110"
                                                    title="投反对票"
                                                >
                                                    <ThumbsDown className="w-5 h-5 text-red-400" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* 未投票提示 */}
                    {!allVoted && (
                        <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <p className="text-sm text-blue-300">
                                    还有 {pendingVoters.length} 名玩家未投票
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* 玩家视图：显示自己的投票状态 */
                <div className="space-y-4">
                    {currentPlayerId && eligibleVoters.some(v => v.id === currentPlayerId) ? (
                        <div className="p-6 bg-stone-900/50 border border-white/10 rounded-xl">
                            <AnimatePresence mode="wait">
                                {votedPlayers.includes(currentPlayerId) ? (
                                    <motion.div
                                        key="voted"
                                        className="text-center"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                            votesFor.includes(currentPlayerId)
                                                ? 'bg-emerald-500/20'
                                                : 'bg-red-500/20'
                                        }`}>
                                            {votesFor.includes(currentPlayerId) ? (
                                                <ThumbsUp className="w-8 h-8 text-emerald-400" />
                                            ) : (
                                                <ThumbsDown className="w-8 h-8 text-red-400" />
                                            )}
                                        </div>
                                        <h3 className={`text-xl font-bold ${
                                            votesFor.includes(currentPlayerId)
                                                ? 'text-emerald-300'
                                                : 'text-red-300'
                                        }`}>
                                            你已投票：{votesFor.includes(currentPlayerId) ? '赞成' : '反对'}
                                        </h3>
                                        <p className="text-sm text-stone-400 mt-2">
                                            等待其他玩家投票...
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="waiting"
                                        className="text-center"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
                                            <Clock className="w-8 h-8 text-amber-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-amber-300">
                                            等待说书人收集你的投票
                                        </h3>
                                        <p className="text-sm text-stone-400 mt-2">
                                            请向说书人示意你的投票决定
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="p-6 bg-stone-900/50 border border-white/10 rounded-xl text-center">
                            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                            <p className="text-stone-400">
                                你无法参与此次投票（已死亡且已使用幽灵投票）
                            </p>
                        </div>
                    )}

                    {/* 投票进度信息 */}
                    <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-300">
                                投票进度：{votedPlayers.length} / {eligibleVoters.length}
                            </span>
                            <span className="text-blue-400/70">
                                {Math.round((votedPlayers.length / eligibleVoters.length) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
