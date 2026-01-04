/**
 * NominationPanel - 提名面板组件
 *
 * 说书人用于管理提名流程
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { PlayerId } from '../../../types/game';

export interface NominationPanelProps {
    /** 所有玩家 */
    players: Array<{
        id: PlayerId;
        name: string;
        isDead: boolean;
        isGhost: boolean;
        hasUsedGhostVote: boolean;
    }>;
    /** 今天已被提名的玩家 ID 列表 */
    nominatedToday: PlayerId[];
    /** 今天已提名过别人的玩家 ID 列表 */
    nominatorsToday: PlayerId[];
    /** 当前提名者 ID */
    currentNominatorId: PlayerId | null;
    /** 当前被提名者 ID */
    currentNomineeId: PlayerId | null;
    /** 开始提名回调 */
    onStartNomination: (nominatorId: PlayerId, nomineeId: PlayerId) => void;
    /** 取消提名回调 */
    onCancelNomination: () => void;
    /** 是否处于提名流程中 */
    isNominating: boolean;
    /** 是否为说书人 */
    isStoryteller: boolean;
}

export function NominationPanel({
    players,
    nominatedToday,
    nominatorsToday,
    currentNominatorId,
    currentNomineeId,
    onStartNomination,
    onCancelNomination,
    isNominating,
    isStoryteller
}: NominationPanelProps) {
    const [selectedNominatorId, setSelectedNominatorId] = useState<PlayerId | null>(null);
    const [selectedNomineeId, setSelectedNomineeId] = useState<PlayerId | null>(null);

    // 可以提名的玩家（存活或幽灵且未使用幽灵投票）
    const eligibleNominators = players.filter(p =>
        !p.isDead || (p.isGhost && !p.hasUsedGhostVote)
    );

    // 可以被提名的玩家（存活且今天未被提名）
    const eligibleNominees = players.filter(p =>
        !p.isDead && !nominatedToday.includes(p.id)
    );

    // 处理提名者选择
    const handleNominatorSelect = (playerId: PlayerId) => {
        if (!isStoryteller || isNominating) return;
        setSelectedNominatorId(playerId);
        setSelectedNomineeId(null); // 重置被提名者
    };

    // 处理被提名者选择
    const handleNomineeSelect = (playerId: PlayerId) => {
        if (!isStoryteller || isNominating || !selectedNominatorId) return;
        if (playerId === selectedNominatorId) return; // 不能提名自己
        setSelectedNomineeId(playerId);
    };

    // 确认提名
    const handleConfirmNomination = () => {
        if (!selectedNominatorId || !selectedNomineeId) return;
        onStartNomination(selectedNominatorId, selectedNomineeId);
        setSelectedNominatorId(null);
        setSelectedNomineeId(null);
    };

    // 取消提名
    const handleCancelNomination = () => {
        onCancelNomination();
    };

    if (!isStoryteller) {
        return (
            <div className="p-6 bg-stone-900/50 border border-white/10 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-stone-400">
                    等待说书人管理提名流程...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 当前状态显示 */}
            <AnimatePresence mode="wait">
                {isNominating ? (
                    <motion.div
                        key="nominating"
                        className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 rounded-xl"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-amber-500/30 rounded-full">
                                    <Users className="w-6 h-6 text-amber-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-200">
                                        提名进行中
                                    </h3>
                                    <p className="text-sm text-amber-300/70">
                                        {players.find(p => p.id === currentNominatorId)?.name} 提名{' '}
                                        {players.find(p => p.id === currentNomineeId)?.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancelNomination}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        className="p-4 bg-stone-900/50 border border-white/10 rounded-xl"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-full">
                                <UserPlus className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-blue-200">
                                    选择提名者和被提名者
                                </h3>
                                <p className="text-sm text-blue-300/70">
                                    {selectedNominatorId
                                        ? selectedNomineeId
                                            ? '点击"确认提名"开始投票'
                                            : '选择被提名者'
                                        : '先选择提名者'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 提名者选择 */}
            {!isNominating && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-stone-300 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        提名者 ({eligibleNominators.length} 可选)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {eligibleNominators.map(player => (
                            <button
                                key={player.id}
                                onClick={() => handleNominatorSelect(player.id)}
                                disabled={nominatorsToday.includes(player.id)}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    selectedNominatorId === player.id
                                        ? 'bg-blue-500/20 border-blue-400 scale-105'
                                        : nominatorsToday.includes(player.id)
                                        ? 'bg-stone-800/30 border-stone-700 opacity-50 cursor-not-allowed'
                                        : 'bg-stone-800/50 border-white/10 hover:bg-stone-700/50 hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                        selectedNominatorId === player.id
                                            ? 'text-blue-200'
                                            : nominatorsToday.includes(player.id)
                                            ? 'text-stone-500'
                                            : 'text-stone-300'
                                    }`}>
                                        {player.name}
                                    </span>
                                    {selectedNominatorId === player.id && (
                                        <Check className="w-4 h-4 text-blue-400" />
                                    )}
                                    {nominatorsToday.includes(player.id) && (
                                        <span className="text-[10px] text-stone-500">已提名</span>
                                    )}
                                </div>
                                {player.isGhost && (
                                    <span className="text-[10px] text-amber-400">幽灵</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 被提名者选择 */}
            {!isNominating && selectedNominatorId && (
                <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <h4 className="text-sm font-medium text-stone-300 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        被提名者 ({eligibleNominees.length} 可选)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {eligibleNominees.map(player => (
                            <button
                                key={player.id}
                                onClick={() => handleNomineeSelect(player.id)}
                                disabled={player.id === selectedNominatorId}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    selectedNomineeId === player.id
                                        ? 'bg-red-500/20 border-red-400 scale-105'
                                        : player.id === selectedNominatorId
                                        ? 'bg-stone-800/30 border-stone-700 opacity-50 cursor-not-allowed'
                                        : 'bg-stone-800/50 border-white/10 hover:bg-stone-700/50 hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                        selectedNomineeId === player.id
                                            ? 'text-red-200'
                                            : player.id === selectedNominatorId
                                            ? 'text-stone-500'
                                            : 'text-stone-300'
                                    }`}>
                                        {player.name}
                                    </span>
                                    {selectedNomineeId === player.id && (
                                        <Check className="w-4 h-4 text-red-400" />
                                    )}
                                    {player.id === selectedNominatorId && (
                                        <span className="text-[10px] text-stone-500">自己</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 确认按钮 */}
            {!isNominating && selectedNominatorId && selectedNomineeId && (
                <motion.button
                    onClick={handleConfirmNomination}
                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Check className="w-5 h-5" />
                    确认提名并开始投票
                </motion.button>
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
                <div className="p-3 bg-stone-800/50 rounded-lg border border-white/5">
                    <div className="text-2xl font-bold text-amber-300">
                        {nominatedToday.length}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                        已被提名
                    </div>
                </div>

                <div className="p-3 bg-stone-800/50 rounded-lg border border-white/5">
                    <div className="text-2xl font-bold text-blue-300">
                        {eligibleNominees.length}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                        可提名
                    </div>
                </div>
            </div>
        </div>
    );
}
