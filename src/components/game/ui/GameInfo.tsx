/**
 * GameInfo - 游戏信息侧边栏
 *
 * 显示当前游戏状态、玩家列表、统计信息
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Skull, Eye, EyeOff, X } from 'lucide-react';
import { TROUBLE_BREWING_CHARACTERS } from '../../../data/characters/trouble-brewing';
import { Team, type PlayerId } from '../../../types/game';

interface GameInfoProps {
    players: Array<{
        id: PlayerId;
        name: string;
        characterId: string | null;
        isDead: boolean;
        statusFlags: {
            poisoned: boolean;
            drunk: boolean;
            protected: boolean;
        };
    }>;
    currentDay: number;
    currentNight: number;
    phase: 'setup' | 'night' | 'day' | 'execution' | 'gameOver';
    isOpen: boolean;
    onClose: () => void;
    showRoles: boolean;
    onToggleRoles: () => void;
    isStoryteller: boolean;
}

export function GameInfo({
    players,
    currentDay,
    currentNight,
    phase,
    isOpen,
    onClose,
    showRoles,
    onToggleRoles,
    isStoryteller
}: GameInfoProps) {
    const alivePlayers = players.filter(p => !p.isDead);
    const deadPlayers = players.filter(p => p.isDead);

    // 统计各阵营存活人数
    const teamCounts = {
        good: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return !p.isDead && (char?.team === Team.TOWNSFOLK || char?.team === Team.OUTSIDER);
        }).length,
        evil: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return !p.isDead && (char?.team === Team.MINION || char?.team === Team.DEMON);
        }).length
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 遮罩层 */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* 侧边栏 */}
                    <motion.div
                        className="fixed right-0 top-0 bottom-0 w-96 bg-gradient-to-br from-stone-900 to-black border-l border-amber-900/30 z-50 overflow-hidden flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        {/* 标题栏 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-900/30 to-stone-900/30">
                            <h2 className="text-xl font-bold text-amber-200">游戏信息</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>

                        {/* 游戏状态 */}
                        <div className="px-6 py-4 border-b border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-400">当前阶段</span>
                                <span className="text-amber-300 font-medium capitalize">
                                    {phase === 'setup' && '准备阶段'}
                                    {phase === 'night' && `第 ${currentNight} 夜`}
                                    {phase === 'day' && `第 ${currentDay} 天`}
                                    {phase === 'execution' && '处决阶段'}
                                    {phase === 'gameOver' && '游戏结束'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-400">存活玩家</span>
                                <span className="text-emerald-300 font-bold">
                                    {alivePlayers.length} / {players.length}
                                </span>
                            </div>

                            {isStoryteller && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-stone-400">阵营平衡</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-300">{teamCounts.good} 善良</span>
                                        <span className="text-stone-500">vs</span>
                                        <span className="text-red-300">{teamCounts.evil} 邪恶</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 说书人控制 */}
                        {isStoryteller && (
                            <div className="px-6 py-3 border-b border-white/10 bg-black/20">
                                <button
                                    onClick={onToggleRoles}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        showRoles
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                                            : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
                                    }`}
                                >
                                    {showRoles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    {showRoles ? '隐藏角色' : '显示角色'}
                                </button>
                            </div>
                        )}

                        {/* 玩家列表 */}
                        <div className="flex-1 overflow-y-auto">
                            {/* 存活玩家 */}
                            <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-bold text-emerald-300">
                                        存活玩家 ({alivePlayers.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {alivePlayers.map(player => (
                                        <PlayerCard key={player.id} player={player} showRole={showRoles && isStoryteller} />
                                    ))}
                                </div>
                            </div>

                            {/* 死亡玩家 */}
                            {deadPlayers.length > 0 && (
                                <div className="px-6 py-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Skull className="w-4 h-4 text-stone-500" />
                                        <h3 className="text-sm font-bold text-stone-400">
                                            死亡玩家 ({deadPlayers.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2 opacity-60">
                                        {deadPlayers.map(player => (
                                            <PlayerCard key={player.id} player={player} showRole={showRoles && isStoryteller} isDead />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================================
// 子组件：玩家卡片
// ============================================================

interface PlayerCardProps {
    player: {
        id: PlayerId;
        name: string;
        characterId: string | null;
        statusFlags: {
            poisoned: boolean;
            drunk: boolean;
            protected: boolean;
        };
    };
    showRole: boolean;
    isDead?: boolean;
}

function PlayerCard({ player, showRole, isDead = false }: PlayerCardProps) {
    const character = player.characterId
        ? TROUBLE_BREWING_CHARACTERS.find(c => c.id === player.characterId)
        : null;

    const teamColors = character
        ? {
              [Team.TOWNSFOLK]: 'border-blue-400/30 bg-blue-500/10',
              [Team.OUTSIDER]: 'border-cyan-400/30 bg-cyan-500/10',
              [Team.MINION]: 'border-red-400/30 bg-red-500/10',
              [Team.DEMON]: 'border-purple-400/30 bg-purple-500/10'
          }[character.team]
        : 'border-stone-700 bg-stone-800/30';

    return (
        <div className={`p-3 rounded-lg border ${teamColors} ${isDead ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-stone-200">
                    {player.name}
                </span>
                {isDead && <Skull className="w-4 h-4 text-stone-500" />}
            </div>

            {showRole && character && (
                <p className="text-xs text-stone-400">
                    {character.name}
                </p>
            )}

            {/* 状态标记 */}
            {(player.statusFlags.poisoned || player.statusFlags.drunk || player.statusFlags.protected) && (
                <div className="flex gap-1 mt-2">
                    {player.statusFlags.poisoned && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-[10px] rounded">
                            中毒
                        </span>
                    )}
                    {player.statusFlags.drunk && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded">
                            醉酒
                        </span>
                    )}
                    {player.statusFlags.protected && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded">
                            保护
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
