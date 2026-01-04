/**
 * NightPhase - 夜晚阶段组件
 *
 * 显示夜晚行动队列，说书人执行角色能力
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, ChevronRight, Check, SkipForward, Eye, EyeOff } from 'lucide-react';
import { type NightQueue } from '../../../logic/night/nightActions';
import { TROUBLE_BREWING_CHARACTERS } from '../../../data/characters/trouble-brewing';
import { type PlayerId } from '../../../types/game';
import { useUIStore } from '../../../logic/stores/uiStore';
import { AbilityTargetSelector } from './AbilityTargetSelector';

interface NightPhaseProps {
    nightQueue: NightQueue;
    players: Array<{ id: PlayerId; name: string; characterId: string | null; isDead: boolean }>;
    onUseAbility: (playerId: PlayerId, targets?: PlayerId[]) => void;
    onSkipAction: () => void;
    onEndNight: () => void;
    isStoryteller: boolean;
}

export function NightPhase({
    nightQueue,
    players,
    onUseAbility,
    onSkipAction,
    onEndNight,
    isStoryteller
}: NightPhaseProps) {
    const { nightActionInProgress, setNightActionInProgress } = useUIStore();
    const [showTargetSelector, setShowTargetSelector] = useState(false);

    const currentAction = nightQueue.actions[nightQueue.currentIndex];
    const isComplete = nightQueue.currentIndex >= nightQueue.actions.length;

    // 获取当前行动的角色信息
    const currentCharacter = currentAction
        ? TROUBLE_BREWING_CHARACTERS.find(c => c.id === currentAction.characterId)
        : null;

    // 获取当前行动的玩家
    const currentPlayer = currentAction
        ? players.find(p => p.id === currentAction.playerId)
        : null;

    // 处理能力使用（打开目标选择器）
    const handleUseAbilityClick = () => {
        setShowTargetSelector(true);
    };

    // 处理目标选择确认
    const handleTargetConfirm = (targets: PlayerId[]) => {
        if (!currentAction) return;
        setShowTargetSelector(false);
        setNightActionInProgress(true);
        onUseAbility(currentAction.playerId, targets);
        setTimeout(() => setNightActionInProgress(false), 500);
    };

    // 处理目标选择取消
    const handleTargetCancel = () => {
        setShowTargetSelector(false);
    };

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4">
            <motion.div
                className="bg-gradient-to-br from-indigo-950/95 to-black/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl overflow-hidden"
                initial={{ y: -50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-blue-400/20 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <Moon className="w-6 h-6 text-blue-300" />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-bold text-blue-200">
                                {nightQueue.isFirstNight ? '首夜' : `第 ${nightQueue.night} 夜`}
                            </h2>
                            <p className="text-xs text-blue-400/70">
                                进度: {nightQueue.currentIndex} / {nightQueue.actions.length}
                            </p>
                        </div>
                    </div>

                    {/* 进度条 */}
                    <div className="flex items-center gap-2">
                        <div className="w-48 h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${(nightQueue.currentIndex / nightQueue.actions.length) * 100}%`
                                }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            />
                        </div>
                        <span className="text-sm text-blue-300 font-mono">
                            {Math.round((nightQueue.currentIndex / nightQueue.actions.length) * 100)}%
                        </span>
                    </div>
                </div>

                {/* 当前行动 */}
                <AnimatePresence mode="wait">
                    {!isComplete ? (
                        <motion.div
                            key={currentAction?.playerId}
                            className="p-6"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            {currentCharacter && currentPlayer && (
                                <div className="space-y-6">
                                    {/* 角色卡片 */}
                                    <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/30 rounded-xl">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-2xl font-bold text-blue-200">
                                                    {currentCharacter.name}
                                                </h3>
                                                <span className="text-sm text-blue-400">
                                                    ({currentPlayer.name})
                                                </span>
                                            </div>
                                            <p className="text-sm text-blue-300/80 leading-relaxed">
                                                {currentCharacter.abilityText}
                                            </p>
                                        </div>

                                        {currentAction.order && (
                                            <div className="flex flex-col items-center justify-center px-6 py-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                                                <span className="text-xs text-blue-400">行动顺序</span>
                                                <span className="text-3xl font-bold text-blue-200">
                                                    {currentAction.order}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 说书人控制 */}
                                    {isStoryteller && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleUseAbilityClick}
                                                disabled={nightActionInProgress}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-xl text-emerald-300 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Check className="w-5 h-5" />
                                                执行能力
                                            </button>

                                            <button
                                                onClick={onSkipAction}
                                                disabled={nightActionInProgress}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-xl text-amber-300 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <SkipForward className="w-5 h-5" />
                                                跳过
                                            </button>
                                        </div>
                                    )}

                                    {/* 玩家视图提示 */}
                                    {!isStoryteller && (
                                        <div className="flex items-center justify-center gap-2 p-4 bg-blue-500/10 rounded-xl">
                                            <EyeOff className="w-5 h-5 text-blue-400" />
                                            <span className="text-blue-300">
                                                等待说书人执行夜晚行动...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            className="p-8 text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 border-4 border-emerald-400/50 rounded-full mb-4">
                                <Check className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-200 mb-2">
                                夜晚行动完成
                            </h3>
                            <p className="text-emerald-300/70 mb-6">
                                所有角色能力已执行完毕
                            </p>

                            {isStoryteller && (
                                <button
                                    onClick={onEndNight}
                                    className="px-8 py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/50 rounded-xl text-amber-300 font-bold text-lg transition-all hover:scale-105"
                                >
                                    结束夜晚，进入白天 <ChevronRight className="inline w-6 h-6 ml-2" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 行动列表预览（可折叠） */}
                {!isComplete && nightQueue.actions.length > 0 && (
                    <div className="border-t border-blue-400/20 bg-black/20">
                        <details className="group">
                            <summary className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-blue-500/10 transition-colors">
                                <span className="text-sm text-blue-300 font-medium">
                                    查看完整行动队列
                                </span>
                                <Eye className="w-4 h-4 text-blue-400 group-open:rotate-180 transition-transform" />
                            </summary>

                            <div className="px-6 pb-4 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {nightQueue.actions.map((action, index) => {
                                        const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === action.characterId);
                                        const player = players.find(p => p.id === action.playerId);
                                        const isActive = index === nightQueue.currentIndex;
                                        const isCompleted = index < nightQueue.currentIndex;

                                        return (
                                            <div
                                                key={action.playerId}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                                    isActive
                                                        ? 'bg-blue-500/20 border border-blue-400/50 scale-105'
                                                        : isCompleted
                                                        ? 'bg-emerald-500/10 border border-emerald-400/20 opacity-60'
                                                        : 'bg-black/20 border border-white/5'
                                                }`}
                                            >
                                                <span className="text-xs text-blue-400 font-mono w-8">
                                                    {action.order}
                                                </span>
                                                <span className="text-sm text-blue-200 flex-1">
                                                    {char?.name} - {player?.name}
                                                </span>
                                                {isCompleted && <Check className="w-4 h-4 text-emerald-400" />}
                                                {isActive && (
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    >
                                                        <ChevronRight className="w-4 h-4 text-blue-300" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </motion.div>

            {/* 能力目标选择器 */}
            {currentAction && currentCharacter && currentPlayer && (
                <AbilityTargetSelector
                    characterId={currentAction.characterId}
                    characterName={currentCharacter.name}
                    players={players}
                    actorId={currentAction.playerId}
                    visible={showTargetSelector}
                    onConfirm={handleTargetConfirm}
                    onCancel={handleTargetCancel}
                />
            )}
        </div>
    );
}
