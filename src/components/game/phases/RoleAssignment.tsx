/**
 * RoleAssignment - 角色分配组件
 *
 * 说书人用于分配角色给玩家
 * 支持拖拽、随机分配、平衡分配、AI 建议
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, X, Check, Users, Brain } from 'lucide-react';
import { TROUBLE_BREWING_CHARACTERS, getStandardComposition } from '../../../data/characters/trouble-brewing';
import { Team, type Character, type PlayerId } from '../../../types/game';
import { useUIStore } from '../../../logic/stores/uiStore';
import { useAIAssistant } from '../../../hooks/useAIAssistant';
import { RoleSuggestionPanel } from '../ui/AISuggestionPanel';
import type { RoleAssignmentSuggestion } from '../../../lib/ai-storyteller';

interface RoleAssignmentProps {
    players: Array<{ id: PlayerId; name: string; characterId: string | null }>;
    onAssignRole: (playerId: PlayerId, characterId: string) => void;
    onRandomAssign: () => void;
    onBalancedAssign: () => void;
    onClose: () => void;
}

export function RoleAssignment({
    players,
    onAssignRole,
    onRandomAssign,
    onBalancedAssign,
    onClose
}: RoleAssignmentProps) {
    const { draggedCharacterId, setDraggedCharacter } = useUIStore();
    const [selectedTeam, setSelectedTeam] = useState<Team | 'all'>('all');
    const [hoveredPlayerId, setHoveredPlayerId] = useState<PlayerId | null>(null);

    // AI 辅助
    const { isEnabled: aiEnabled, isLoading: aiLoading, error: aiError, suggestRoles } = useAIAssistant();
    const [aiSuggestion, setAiSuggestion] = useState<RoleAssignmentSuggestion | null>(null);

    // 请求 AI 建议
    const handleRequestAISuggestion = useCallback(async () => {
        const playersForAI = players.map(p => ({ id: p.id, name: p.name }));
        const suggestion = await suggestRoles(playersForAI);
        if (suggestion) {
            setAiSuggestion(suggestion);
        }
    }, [players, suggestRoles]);

    // 应用 AI 建议
    const handleApplyAISuggestion = useCallback(() => {
        if (!aiSuggestion) return;

        aiSuggestion.assignments.forEach(assignment => {
            onAssignRole(assignment.playerId, assignment.characterId);
        });
    }, [aiSuggestion, onAssignRole]);

    // 按阵营分组角色
    const charactersByTeam = {
        [Team.TOWNSFOLK]: TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.TOWNSFOLK),
        [Team.OUTSIDER]: TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.OUTSIDER),
        [Team.MINION]: TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.MINION),
        [Team.DEMON]: TROUBLE_BREWING_CHARACTERS.filter(c => c.team === Team.DEMON)
    };

    // 获取推荐配置
    const recommendedComposition = getStandardComposition(players.length);

    // 获取已分配角色统计
    const assignedCount = {
        [Team.TOWNSFOLK]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.TOWNSFOLK;
        }).length,
        [Team.OUTSIDER]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.OUTSIDER;
        }).length,
        [Team.MINION]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.MINION;
        }).length,
        [Team.DEMON]: players.filter(p => {
            const char = TROUBLE_BREWING_CHARACTERS.find(c => c.id === p.characterId);
            return char?.team === Team.DEMON;
        }).length
    };

    // 阵营颜色
    const teamColors = {
        [Team.TOWNSFOLK]: { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-300', name: '镇民' },
        [Team.OUTSIDER]: { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-300', name: '外来者' },
        [Team.MINION]: { bg: 'bg-red-500/20', border: 'border-red-400', text: 'text-red-300', name: '爪牙' },
        [Team.DEMON]: { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-300', name: '恶魔' }
    };

    // 处理拖拽开始
    const handleDragStart = (characterId: string) => {
        setDraggedCharacter(characterId);
    };

    // 处理拖拽结束
    const handleDragEnd = () => {
        setDraggedCharacter(null);
        setHoveredPlayerId(null);
    };

    // 处理放置
    const handleDrop = (playerId: PlayerId) => {
        if (draggedCharacterId) {
            onAssignRole(playerId, draggedCharacterId);
            setDraggedCharacter(null);
            setHoveredPlayerId(null);
        }
    };

    // 过滤角色
    const filteredCharacters = selectedTeam === 'all'
        ? TROUBLE_BREWING_CHARACTERS
        : charactersByTeam[selectedTeam];

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-stone-900 to-black border border-amber-900/30 rounded-2xl shadow-2xl"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
                    <div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 font-cinzel">
                            角色分配
                        </h2>
                        <p className="text-sm text-stone-400 mt-1">
                            拖拽角色到玩家，或使用自动分配
                        </p>
                    </div>

                    {/* 推荐配置 */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-stone-300">推荐配置:</span>
                            <span className="text-blue-300 font-bold">{recommendedComposition.townsfolk}镇民</span>
                            <span className="text-cyan-300 font-bold">{recommendedComposition.outsiders}外来</span>
                            <span className="text-red-300 font-bold">{recommendedComposition.minions}爪牙</span>
                            <span className="text-purple-300 font-bold">{recommendedComposition.demons}恶魔</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-stone-400" />
                        </button>
                    </div>
                </div>

                <div className="flex h-[calc(90vh-120px)]">
                    {/* 左侧：角色池 */}
                    <div className="w-2/3 border-r border-white/10 overflow-hidden flex flex-col">
                        {/* 阵营筛选 */}
                        <div className="flex gap-2 px-6 py-4 border-b border-white/10">
                            <button
                                onClick={() => setSelectedTeam('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    selectedTeam === 'all'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                                        : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
                                }`}
                            >
                                全部 ({TROUBLE_BREWING_CHARACTERS.length})
                            </button>
                            {[Team.TOWNSFOLK, Team.OUTSIDER, Team.MINION, Team.DEMON].map(team => (
                                <button
                                    key={team}
                                    onClick={() => setSelectedTeam(team)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        selectedTeam === team
                                            ? `${teamColors[team].bg} ${teamColors[team].text} border ${teamColors[team].border}/50`
                                            : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
                                    }`}
                                >
                                    {teamColors[team].name} ({charactersByTeam[team].length})
                                </button>
                            ))}
                        </div>

                        {/* 角色卡片网格 */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-4 gap-4">
                                {filteredCharacters.map(character => (
                                    <CharacterCard
                                        key={character.id}
                                        character={character}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        isDragging={draggedCharacterId === character.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右侧：玩家列表 */}
                    <div className="w-1/3 flex flex-col">
                        {/* 快捷操作 */}
                        <div className="flex gap-2 px-6 py-4 border-b border-white/10">
                            <button
                                onClick={onRandomAssign}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-medium transition-all"
                            >
                                <Shuffle className="w-4 h-4" />
                                随机分配
                            </button>
                            <button
                                onClick={onBalancedAssign}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-medium transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                平衡分配
                            </button>
                        </div>

                        {/* AI 建议面板 */}
                        {aiEnabled && (
                            <div className="px-6 py-3 border-b border-white/10">
                                <RoleSuggestionPanel
                                    suggestion={aiSuggestion}
                                    isLoading={aiLoading}
                                    error={aiError}
                                    onRequestSuggestion={handleRequestAISuggestion}
                                    onApplySuggestion={handleApplyAISuggestion}
                                />
                            </div>
                        )}

                        {/* AI 未启用时的提示 */}
                        {!aiEnabled && (
                            <div className="px-6 py-3 border-b border-white/10">
                                <div className="flex items-center gap-2 p-3 bg-stone-800/50 rounded-lg">
                                    <Brain className="w-4 h-4 text-stone-500" />
                                    <span className="text-xs text-stone-500">
                                        AI 辅助未启用，可在设置中开启
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 当前配置统计 */}
                        <div className="px-6 py-3 bg-stone-900/50 border-b border-white/10">
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                {[Team.TOWNSFOLK, Team.OUTSIDER, Team.MINION, Team.DEMON].map(team => {
                                    const recommendedKey = team === Team.TOWNSFOLK ? 'townsfolk'
                                        : team === Team.OUTSIDER ? 'outsiders'
                                        : team === Team.MINION ? 'minions'
                                        : 'demons';

                                    return (
                                        <div key={team} className="flex flex-col">
                                            <span className={teamColors[team].text}>
                                                {assignedCount[team]}/{recommendedComposition[recommendedKey]}
                                            </span>
                                            <span className="text-stone-500">{teamColors[team].name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 玩家列表 */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-3">
                                {players.map(player => (
                                    <PlayerSlot
                                        key={player.id}
                                        player={player}
                                        onDrop={handleDrop}
                                        onDragOver={setHoveredPlayerId}
                                        isHovered={hoveredPlayerId === player.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================================
// 子组件：角色卡片
// ============================================================

interface CharacterCardProps {
    character: Character;
    onDragStart: (characterId: string) => void;
    onDragEnd: () => void;
    isDragging: boolean;
}

function CharacterCard({ character, onDragStart, onDragEnd, isDragging }: CharacterCardProps) {
    const teamColors = {
        [Team.TOWNSFOLK]: { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-300' },
        [Team.OUTSIDER]: { bg: 'bg-cyan-500/10', border: 'border-cyan-400/30', text: 'text-cyan-300' },
        [Team.MINION]: { bg: 'bg-red-500/10', border: 'border-red-400/30', text: 'text-red-300' },
        [Team.DEMON]: { bg: 'bg-purple-500/10', border: 'border-purple-400/30', text: 'text-purple-300' }
    };

    const colors = teamColors[character.team];

    return (
        <motion.div
            draggable
            onDragStart={() => onDragStart(character.id)}
            onDragEnd={onDragEnd}
            className={`relative p-4 ${colors.bg} border ${colors.border} rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${
                isDragging ? 'opacity-50 scale-95' : ''
            }`}
            whileHover={{ y: -4 }}
        >
            <div className="text-center">
                <h3 className={`font-bold ${colors.text} mb-1`}>{character.name}</h3>
                <p className="text-[10px] text-stone-400 leading-tight line-clamp-3">
                    {character.abilityText}
                </p>
            </div>

            {/* 夜晚行动指示 */}
            {(character.firstNight || character.otherNight) && (
                <div className="absolute top-2 right-2 flex gap-1">
                    {character.firstNight && (
                        <div className="w-2 h-2 rounded-full bg-blue-400" title="首夜行动" />
                    )}
                    {character.otherNight && (
                        <div className="w-2 h-2 rounded-full bg-indigo-400" title="其他夜晚行动" />
                    )}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================
// 子组件：玩家槽位
// ============================================================

interface PlayerSlotProps {
    player: { id: PlayerId; name: string; characterId: string | null };
    onDrop: (playerId: PlayerId) => void;
    onDragOver: (playerId: PlayerId | null) => void;
    isHovered: boolean;
}

function PlayerSlot({ player, onDrop, onDragOver, isHovered }: PlayerSlotProps) {
    const assignedCharacter = player.characterId
        ? TROUBLE_BREWING_CHARACTERS.find(c => c.id === player.characterId)
        : null;

    const teamColors = assignedCharacter
        ? {
              [Team.TOWNSFOLK]: { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-300' },
              [Team.OUTSIDER]: { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-300' },
              [Team.MINION]: { bg: 'bg-red-500/20', border: 'border-red-400', text: 'text-red-300' },
              [Team.DEMON]: { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-300' }
          }[assignedCharacter.team]
        : null;

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(player.id);
            }}
            onDragLeave={() => onDragOver(null)}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(player.id);
            }}
            className={`relative p-4 rounded-xl border-2 border-dashed transition-all ${
                isHovered
                    ? 'border-amber-400 bg-amber-500/20 scale-105'
                    : assignedCharacter
                    ? `${teamColors?.bg} ${teamColors?.border} border-solid`
                    : 'border-stone-700 bg-stone-800/30 hover:border-stone-600'
            }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-stone-200">{player.name}</h4>
                    {assignedCharacter ? (
                        <p className={`text-sm ${teamColors?.text} font-medium mt-1`}>
                            {assignedCharacter.name}
                        </p>
                    ) : (
                        <p className="text-xs text-stone-500 mt-1">未分配角色</p>
                    )}
                </div>

                {assignedCharacter && (
                    <Check className={`w-5 h-5 ${teamColors?.text}`} />
                )}
            </div>
        </div>
    );
}
