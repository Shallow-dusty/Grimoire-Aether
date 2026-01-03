/**
 * GameOver - 游戏结束组件
 *
 * 显示胜利阵营、游戏统计、角色揭示
 */

import { motion } from 'framer-motion';
import { Trophy, Skull, Users, Calendar } from 'lucide-react';
import { TROUBLE_BREWING_CHARACTERS } from '../../../data/characters/trouble-brewing';
import { Team, type PlayerId } from '../../../types/game';

interface GameOverProps {
    winner: Team | null;
    endReason: string | null;
    players: Array<{
        id: PlayerId;
        name: string;
        characterId: string | null;
        isDead: boolean;
    }>;
    currentDay: number;
    onRestart?: () => void;
}

export function GameOver({
    winner,
    endReason,
    players,
    currentDay,
    onRestart
}: GameOverProps) {
    // 按阵营分组玩家
    const playersByTeam = {
        [Team.TOWNSFOLK]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.TOWNSFOLK;
        }),
        [Team.OUTSIDER]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.OUTSIDER;
        }),
        [Team.MINION]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.MINION;
        }),
        [Team.DEMON]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.DEMON;
        })
    };

    const isGoodWin = winner === Team.TOWNSFOLK || winner === Team.OUTSIDER;

    const teamColors = {
        [Team.TOWNSFOLK]: { bg: 'from-blue-900 to-cyan-900', text: 'text-blue-200', name: '镇民' },
        [Team.OUTSIDER]: { bg: 'from-cyan-900 to-teal-900', text: 'text-cyan-200', name: '外来者' },
        [Team.MINION]: { bg: 'from-red-900 to-rose-900', text: 'text-red-200', name: '爪牙' },
        [Team.DEMON]: { bg: 'from-purple-900 to-fuchsia-900', text: 'text-purple-200', name: '恶魔' }
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className="w-full max-w-5xl max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* 胜利横幅 */}
                <div className={`relative p-8 bg-gradient-to-r ${isGoodWin ? 'from-emerald-900 to-blue-900' : 'from-red-900 to-purple-900'} rounded-t-2xl border-b-4 ${isGoodWin ? 'border-emerald-400' : 'border-red-400'}`}>
                    <motion.div
                        className="text-center"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block mb-4"
                        >
                            <Trophy className={`w-20 h-20 ${isGoodWin ? 'text-emerald-300' : 'text-red-300'}`} />
                        </motion.div>

                        <h1 className="text-5xl font-bold text-white mb-3">
                            {isGoodWin ? '善良阵营胜利！' : '邪恶阵营胜利！'}
                        </h1>

                        {endReason && (
                            <p className="text-xl text-white/80 mb-2">
                                {endReason}
                            </p>
                        )}

                        <div className="flex items-center justify-center gap-6 text-white/60 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>存活 {currentDay} 天</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{players.length} 名玩家</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skull className="w-4 h-4" />
                                <span>{players.filter(p => p.isDead).length} 人死亡</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 角色揭示 */}
                <div className="bg-gradient-to-br from-stone-900 to-black p-8 rounded-b-2xl border border-white/10 max-h-[60vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-amber-200 mb-6 text-center">
                        角色揭示
                    </h2>

                    <div className="grid grid-cols-2 gap-6">
                        {/* 善良阵营 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                                善良阵营
                            </h3>

                            {/* 镇民 */}
                            {playersByTeam[Team.TOWNSFOLK].length > 0 && (
                                <TeamSection
                                    title="镇民"
                                    players={playersByTeam[Team.TOWNSFOLK]}
                                    colors={teamColors[Team.TOWNSFOLK]}
                                />
                            )}

                            {/* 外来者 */}
                            {playersByTeam[Team.OUTSIDER].length > 0 && (
                                <TeamSection
                                    title="外来者"
                                    players={playersByTeam[Team.OUTSIDER]}
                                    colors={teamColors[Team.OUTSIDER]}
                                />
                            )}
                        </div>

                        {/* 邪恶阵营 */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-400 rounded-full" />
                                邪恶阵营
                            </h3>

                            {/* 爪牙 */}
                            {playersByTeam[Team.MINION].length > 0 && (
                                <TeamSection
                                    title="爪牙"
                                    players={playersByTeam[Team.MINION]}
                                    colors={teamColors[Team.MINION]}
                                />
                            )}

                            {/* 恶魔 */}
                            {playersByTeam[Team.DEMON].length > 0 && (
                                <TeamSection
                                    title="恶魔"
                                    players={playersByTeam[Team.DEMON]}
                                    colors={teamColors[Team.DEMON]}
                                />
                            )}
                        </div>
                    </div>

                    {/* 重新开始按钮 */}
                    {onRestart && (
                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={onRestart}
                                className="px-8 py-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-xl text-amber-300 font-bold text-lg transition-all hover:scale-105"
                            >
                                返回大厅
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================================
// 子组件：阵营区块
// ============================================================

interface TeamSectionProps {
    title: string;
    players: Array<{ id: PlayerId; name: string; characterId: string | null; isDead: boolean }>;
    colors: { bg: string; text: string; name: string };
}

function TeamSection({ title, players, colors }: TeamSectionProps) {
    return (
        <div>
            <h4 className={`text-sm font-medium ${colors.text} mb-2`}>{title}</h4>
            <div className="space-y-2">
                {players.map((player, index) => {
                    const character = TROUBLE_BREWING_CHARACTERS.find(c => c.id === player.characterId);

                    return (
                        <motion.div
                            key={player.id}
                            className={`p-3 bg-gradient-to-r ${colors.bg} border border-white/10 rounded-lg ${player.isDead ? 'opacity-60' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className={`font-medium ${colors.text}`}>
                                        {player.name}
                                    </span>
                                    {character && (
                                        <p className="text-xs text-white/60 mt-1">
                                            {character.name}
                                        </p>
                                    )}
                                </div>
                                {player.isDead && (
                                    <Skull className="w-4 h-4 text-stone-400" />
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
