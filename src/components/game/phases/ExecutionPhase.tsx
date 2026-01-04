/**
 * ExecutionPhase - 处决阶段组件
 *
 * 显示投票结果并处理处决或赦免
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Heart, Users, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { TROUBLE_BREWING_CHARACTERS } from '../../../data/characters/trouble-brewing';
import type { PlayerId } from '../../../types/game';

export interface ExecutionPhaseProps {
    /** 被提名者信息 */
    nominee: {
        id: PlayerId;
        name: string;
        characterId: string;
    };
    /** 提名者信息 */
    nominator: {
        id: PlayerId;
        name: string;
    };
    /** 赞成票数 */
    votesFor: number;
    /** 反对票数 */
    votesAgainst: number;
    /** 执行阈值 */
    executionThreshold: number;
    /** 是否达到处决票数 */
    willExecute: boolean;
    /** 确认处决回调 */
    onConfirmExecution: () => void;
    /** 继续游戏回调（未达到处决票数时） */
    onContinue: () => void;
    /** 是否为说书人 */
    isStoryteller: boolean;
}

export function ExecutionPhase({
    nominee,
    nominator,
    votesFor,
    votesAgainst,
    executionThreshold,
    willExecute,
    onConfirmExecution,
    onContinue,
    isStoryteller
}: ExecutionPhaseProps) {
    // 获取角色信息
    const character = TROUBLE_BREWING_CHARACTERS.find(c => c.id === nominee.characterId);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-stone-900 via-black to-stone-900">
            <motion.div
                className="w-full max-w-4xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* 结果横幅 */}
                <AnimatePresence mode="wait">
                    {willExecute ? (
                        <motion.div
                            key="execute"
                            className="relative overflow-hidden rounded-2xl mb-8"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                        >
                            {/* 背景动画 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-800 to-red-900 opacity-50" />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{
                                    x: ['-100%', '100%']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'linear'
                                }}
                            />

                            {/* 内容 */}
                            <div className="relative p-12 text-center">
                                <motion.div
                                    className="inline-flex items-center justify-center w-24 h-24 bg-red-500/30 rounded-full mb-6"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity
                                    }}
                                >
                                    <Skull className="w-14 h-14 text-red-300" />
                                </motion.div>

                                <h1 className="text-5xl font-bold text-red-200 mb-4 font-cinzel">
                                    处决通过
                                </h1>
                                <p className="text-2xl text-red-300/80">
                                    {nominee.name} 将被处决
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="spare"
                            className="relative overflow-hidden rounded-2xl mb-8"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                        >
                            {/* 背景 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 opacity-50" />

                            {/* 内容 */}
                            <div className="relative p-12 text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500/30 rounded-full mb-6">
                                    <Heart className="w-14 h-14 text-emerald-300" />
                                </div>

                                <h1 className="text-5xl font-bold text-emerald-200 mb-4 font-cinzel">
                                    处决失败
                                </h1>
                                <p className="text-2xl text-emerald-300/80">
                                    {nominee.name} 幸存
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 投票详情 */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* 提名信息 */}
                    <motion.div
                        className="p-6 bg-stone-900/50 border border-white/10 rounded-xl"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-6 h-6 text-amber-400" />
                            <h3 className="text-lg font-bold text-amber-300">提名信息</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-stone-400">提名者：</span>
                                <span className="text-stone-200 font-medium">{nominator.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">被提名者：</span>
                                <span className="text-stone-200 font-medium">{nominee.name}</span>
                            </div>
                            {willExecute && character && (
                                <div className="flex justify-between pt-3 border-t border-white/10">
                                    <span className="text-stone-400">真实角色：</span>
                                    <span className="text-amber-300 font-bold">{character.name}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* 投票统计 */}
                    <motion.div
                        className="p-6 bg-stone-900/50 border border-white/10 rounded-xl"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <ThumbsUp className="w-6 h-6 text-blue-400" />
                            <h3 className="text-lg font-bold text-blue-300">投票统计</h3>
                        </div>
                        <div className="space-y-4">
                            {/* 赞成票 */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-emerald-400">赞成</span>
                                    <span className="text-2xl font-bold text-emerald-300">{votesFor}</span>
                                </div>
                                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-emerald-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(votesFor / (votesFor + votesAgainst)) * 100}%` }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                    />
                                </div>
                            </div>

                            {/* 反对票 */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-red-400">反对</span>
                                    <span className="text-2xl font-bold text-red-300">{votesAgainst}</span>
                                </div>
                                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-red-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(votesAgainst / (votesFor + votesAgainst)) * 100}%` }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                    />
                                </div>
                            </div>

                            {/* 阈值 */}
                            <div className="pt-3 border-t border-white/10">
                                <div className="flex justify-between">
                                    <span className="text-sm text-amber-400">所需票数：</span>
                                    <span className={`text-lg font-bold ${
                                        votesFor >= executionThreshold
                                            ? 'text-emerald-300'
                                            : 'text-amber-300'
                                    }`}>
                                        {votesFor} / {executionThreshold}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 角色揭示（仅当处决成功时） */}
                {willExecute && character && (
                    <motion.div
                        className="p-8 bg-gradient-to-br from-purple-900/30 to-red-900/30 border border-purple-500/30 rounded-xl mb-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-purple-200 mb-3">
                                角色揭示
                            </h3>
                            <div className="inline-block p-6 bg-black/30 rounded-xl">
                                <h4 className="text-3xl font-bold text-amber-300 mb-2">
                                    {character.name}
                                </h4>
                                <p className="text-stone-400 text-sm max-w-md mx-auto">
                                    {character.abilityText}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 操作按钮 */}
                {isStoryteller && (
                    <motion.div
                        className="flex justify-center gap-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {willExecute ? (
                            <button
                                onClick={onConfirmExecution}
                                className="px-8 py-4 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-400/50 rounded-xl text-red-300 font-bold text-lg transition-all hover:scale-105 flex items-center gap-3"
                            >
                                <Skull className="w-6 h-6" />
                                确认处决，继续游戏
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={onContinue}
                                className="px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-bold text-lg transition-all hover:scale-105 flex items-center gap-3"
                            >
                                <Heart className="w-6 h-6" />
                                继续提名流程
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>
                )}

                {/* 玩家视图提示 */}
                {!isStoryteller && (
                    <motion.div
                        className="p-6 bg-stone-900/50 border border-white/10 rounded-xl text-center"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p className="text-stone-400">
                            等待说书人确认并继续游戏...
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
