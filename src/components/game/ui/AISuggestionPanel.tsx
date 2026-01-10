/**
 * AI 建议面板组件
 *
 * 显示 AI 说书人助手的建议，用于角色分配和游戏节奏提示
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, ChevronDown, ChevronUp, AlertTriangle, Info, Lightbulb, RefreshCw, Wand2 } from 'lucide-react';
import type { RoleAssignmentSuggestion, GamePacingTip } from '../../../lib/ai-storyteller';
import { getCharacterById } from '../../../data/characters/trouble-brewing';
import { Team } from '../../../types/game';

// ============================================================
// 角色分配建议面板
// ============================================================

interface RoleSuggestionPanelProps {
    suggestion: RoleAssignmentSuggestion | null;
    isLoading: boolean;
    error: string | null;
    onRequestSuggestion: () => void;
    onApplySuggestion: () => void;
}

export function RoleSuggestionPanel({
    suggestion,
    isLoading,
    error,
    onRequestSuggestion,
    onApplySuggestion
}: RoleSuggestionPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const teamColors = {
        [Team.TOWNSFOLK]: 'text-blue-300',
        [Team.OUTSIDER]: 'text-cyan-300',
        [Team.MINION]: 'text-red-300',
        [Team.DEMON]: 'text-purple-300'
    };

    return (
        <motion.div
            className="bg-gradient-to-br from-violet-950/50 to-black/50 border border-violet-400/30 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* 标题栏 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-500/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-400" />
                    <span className="font-medium text-violet-200">AI 角色分配建议</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-violet-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-violet-400" />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-violet-400/20"
                    >
                        <div className="p-4 space-y-4">
                            {/* 错误提示 */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-red-300">{error}</span>
                                </div>
                            )}

                            {/* 无建议时显示请求按钮 */}
                            {!suggestion && !isLoading && (
                                <button
                                    onClick={onRequestSuggestion}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/50 rounded-lg text-violet-300 font-medium transition-all"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    获取 AI 建议
                                </button>
                            )}

                            {/* 加载中 */}
                            {isLoading && (
                                <div className="flex items-center justify-center gap-2 py-6">
                                    <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                                    <span className="text-violet-300">AI 正在分析...</span>
                                </div>
                            )}

                            {/* 建议内容 */}
                            {suggestion && !isLoading && (
                                <>
                                    {/* 方案描述 */}
                                    <div className="p-3 bg-violet-500/10 rounded-lg">
                                        <p className="text-sm text-violet-200">{suggestion.description}</p>
                                    </div>

                                    {/* 平衡性评估 */}
                                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                                        <span className="text-xs text-stone-400">游戏平衡性</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                {[...Array(10)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-2 h-4 rounded-sm ${
                                                            i < suggestion.balance.score
                                                                ? 'bg-emerald-400'
                                                                : 'bg-stone-700'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-emerald-300">
                                                {suggestion.balance.score}/10
                                            </span>
                                        </div>
                                    </div>

                                    {/* 分配列表 */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {suggestion.assignments.map((assignment, idx) => {
                                            const character = getCharacterById(assignment.characterId);
                                            const teamColor = character ? teamColors[character.team] : 'text-stone-300';

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-2 bg-black/20 rounded-lg"
                                                >
                                                    <span className="text-sm text-stone-200">
                                                        {assignment.playerName}
                                                    </span>
                                                    <span className={`text-sm font-medium ${teamColor}`}>
                                                        {assignment.characterName}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onRequestSuggestion}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stone-700/50 hover:bg-stone-700 rounded-lg text-stone-300 text-sm transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            重新生成
                                        </button>
                                        <button
                                            onClick={onApplySuggestion}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-500/30 hover:bg-violet-500/40 border border-violet-400/50 rounded-lg text-violet-200 text-sm font-medium transition-colors"
                                        >
                                            <Wand2 className="w-4 h-4" />
                                            应用此方案
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================
// 游戏节奏提示面板
// ============================================================

interface PacingTipsPanelProps {
    tips: GamePacingTip[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function PacingTipsPanel({ tips, isLoading, onRefresh }: PacingTipsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const tipIcons = {
        warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        suggestion: <Lightbulb className="w-4 h-4 text-emerald-400" />,
        info: <Info className="w-4 h-4 text-blue-400" />
    };

    const tipStyles = {
        warning: 'bg-amber-500/10 border-amber-400/30',
        suggestion: 'bg-emerald-500/10 border-emerald-400/30',
        info: 'bg-blue-500/10 border-blue-400/30'
    };

    const tipTextColors = {
        warning: 'text-amber-200',
        suggestion: 'text-emerald-200',
        info: 'text-blue-200'
    };

    if (tips.length === 0 && !isLoading) {
        return null;
    }

    return (
        <motion.div
            className="bg-gradient-to-br from-stone-900/80 to-black/80 border border-stone-700/50 rounded-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            {/* 标题栏 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-700/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-stone-200">AI 说书人提示</span>
                    {tips.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                            {tips.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        className="p-1 hover:bg-stone-600/50 rounded transition-colors"
                        title="刷新提示"
                    >
                        <RefreshCw className={`w-3 h-3 text-stone-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-stone-700/50"
                    >
                        <div className="p-3 space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2 py-4">
                                    <RefreshCw className="w-4 h-4 text-stone-400 animate-spin" />
                                    <span className="text-sm text-stone-400">分析中...</span>
                                </div>
                            ) : (
                                tips.map((tip, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`flex items-start gap-2 p-3 border rounded-lg ${tipStyles[tip.type]}`}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {tipIcons[tip.type]}
                                        </div>
                                        <p className={`text-sm ${tipTextColors[tip.type]}`}>
                                            {tip.message}
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================
// AI 状态指示器（小型）
// ============================================================

interface AIStatusIndicatorProps {
    isEnabled: boolean;
    isLoading: boolean;
    onClick?: () => void;
}

export function AIStatusIndicator({ isEnabled, isLoading, onClick }: AIStatusIndicatorProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all ${
                isEnabled
                    ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                    : 'bg-stone-700/50 text-stone-400 hover:bg-stone-700'
            }`}
            title={isEnabled ? 'AI 辅助已启用' : 'AI 辅助已禁用'}
        >
            {isLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
                <Brain className={`w-3 h-3 ${isEnabled ? 'text-violet-400' : 'text-stone-500'}`} />
            )}
            <span>AI</span>
        </button>
    );
}
