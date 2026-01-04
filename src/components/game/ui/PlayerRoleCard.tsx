/**
 * PlayerRoleCard - 玩家角色卡片组件
 *
 * 显示玩家自己的角色信息，包括角色名、阵营、能力描述、夜晚行动提示
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Shield, Skull } from 'lucide-react';
import { type CharacterId, Team } from '../../../types/game';
import { getCharacterById } from '../../../data/characters/trouble-brewing';

interface PlayerRoleCardProps {
    /** 是否显示 */
    visible: boolean;
    /** 角色 ID */
    characterId: CharacterId | null;
    /** 玩家名字 */
    playerName: string;
    /** 关闭回调 */
    onClose: () => void;
}

export function PlayerRoleCard({
    visible,
    characterId,
    playerName,
    onClose
}: PlayerRoleCardProps) {
    if (!characterId) return null;

    const character = getCharacterById(characterId);
    if (!character) return null;

    // 阵营颜色和图标
    const teamConfig = {
        [Team.TOWNSFOLK]: {
            color: 'blue',
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-950/95 to-indigo-950/95',
            borderColor: 'border-blue-400/30',
            icon: Shield,
            label: '镇民'
        },
        [Team.OUTSIDER]: {
            color: 'cyan',
            gradient: 'from-cyan-500 to-teal-600',
            bgGradient: 'from-cyan-950/95 to-teal-950/95',
            borderColor: 'border-cyan-400/30',
            icon: Shield,
            label: '外来者'
        },
        [Team.MINION]: {
            color: 'orange',
            gradient: 'from-orange-500 to-red-600',
            bgGradient: 'from-orange-950/95 to-red-950/95',
            borderColor: 'border-orange-400/30',
            icon: Skull,
            label: '爪牙'
        },
        [Team.DEMON]: {
            color: 'red',
            gradient: 'from-red-500 to-rose-600',
            bgGradient: 'from-red-950/95 to-rose-950/95',
            borderColor: 'border-red-400/30',
            icon: Skull,
            label: '恶魔'
        }
    };

    const config = teamConfig[character.team];
    const TeamIcon = config.icon;

    // 判断是否有夜晚行动
    const hasNightAction = character.firstNight || character.otherNight;
    const nightActionText = character.firstNight && character.otherNight
        ? '首夜和其他夜晚行动'
        : character.firstNight
        ? '仅首夜行动'
        : character.otherNight
        ? '其他夜晚行动'
        : '无夜晚行动';

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* 背景遮罩 */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* 角色卡片 */}
                    <motion.div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <div className={`bg-gradient-to-br ${config.bgGradient} backdrop-blur-xl border ${config.borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
                            {/* 标题栏 */}
                            <div className={`flex items-center justify-between px-6 py-4 border-b ${config.borderColor} bg-gradient-to-r ${config.gradient} bg-opacity-20`}>
                                <div className="flex items-center gap-3">
                                    <TeamIcon className={`w-6 h-6 text-${config.color}-300`} />
                                    <div>
                                        <h3 className={`text-lg font-bold text-${config.color}-200`}>
                                            你的角色
                                        </h3>
                                        <p className={`text-xs text-${config.color}-400/70`}>
                                            {playerName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className={`w-5 h-5 text-${config.color}-300`} />
                                </button>
                            </div>

                            {/* 角色信息 */}
                            <div className="p-6 space-y-6">
                                {/* 角色名称和阵营 */}
                                <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${config.gradient} bg-opacity-10 border ${config.borderColor} rounded-xl`}>
                                    <div>
                                        <h2 className={`text-2xl font-bold text-${config.color}-200 mb-1`}>
                                            {character.name}
                                        </h2>
                                        <p className={`text-sm text-${config.color}-400`}>
                                            {character.nameEn}
                                        </p>
                                    </div>
                                    <div className={`px-4 py-2 bg-${config.color}-500/20 border ${config.borderColor} rounded-lg`}>
                                        <span className={`text-sm font-bold text-${config.color}-300`}>
                                            {config.label}
                                        </span>
                                    </div>
                                </div>

                                {/* 能力描述 */}
                                <div>
                                    <h4 className={`text-sm font-bold text-${config.color}-300 mb-2 uppercase tracking-wider`}>
                                        角色能力
                                    </h4>
                                    <p className={`text-sm text-${config.color}-100/90 leading-relaxed p-4 bg-black/20 rounded-lg border ${config.borderColor}`}>
                                        {character.abilityText}
                                    </p>
                                </div>

                                {/* 夜晚行动提示 */}
                                {hasNightAction && (
                                    <div className={`p-4 bg-indigo-500/10 border border-indigo-400/30 rounded-xl`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className="w-5 h-5 text-indigo-300" />
                                            <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                                                夜晚行动
                                            </h4>
                                        </div>
                                        <p className="text-sm text-indigo-200/80">
                                            {nightActionText}
                                        </p>
                                        {character.firstNightOrder && (
                                            <p className="text-xs text-indigo-300/60 mt-1">
                                                首夜行动顺序: {character.firstNightOrder}
                                            </p>
                                        )}
                                        {character.otherNightOrder && (
                                            <p className="text-xs text-indigo-300/60 mt-1">
                                                其他夜晚行动顺序: {character.otherNightOrder}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 白天提示（如果没有夜晚行动） */}
                                {!hasNightAction && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sun className="w-5 h-5 text-amber-300" />
                                            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                                                游戏提示
                                            </h4>
                                        </div>
                                        <p className="text-sm text-amber-200/80">
                                            此角色无夜晚行动，在白天阶段发挥作用或具有被动能力。
                                        </p>
                                    </div>
                                )}

                                {/* 游戏提示 */}
                                {character.setupReminder && (
                                    <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                        <p className={`text-xs text-${config.color}-300/70 italic`}>
                                            {character.setupReminder}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 底部操作栏 */}
                            <div className={`flex items-center justify-center px-6 py-4 border-t ${config.borderColor} bg-black/20`}>
                                <button
                                    onClick={onClose}
                                    className={`px-8 py-3 bg-${config.color}-500/20 hover:bg-${config.color}-500/30 border ${config.borderColor} rounded-xl text-${config.color}-300 font-medium transition-all hover:scale-105`}
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
