/**
 * AI 说书人辅助 React Hooks
 */

import { useState, useCallback, useEffect } from 'react';
import {
    AIStorytellerAssistant,
    getStorytellerAssistant,
    type RoleAssignmentSuggestion,
    type AbilityResultSuggestion,
    type GamePacingTip,
    type StorytellerAssistantConfig
} from '../lib/ai-storyteller';
import type { Player, CharacterId } from '../types/game';
import { getGameConfig, saveGameConfig } from '../config/gameConfig';

// ============================================================
// useAIAssistant Hook
// ============================================================

export interface UseAIAssistantResult {
    /** AI 是否启用 */
    isEnabled: boolean;
    /** 是否正在加载 */
    isLoading: boolean;
    /** 错误信息 */
    error: string | null;
    /** 启用/禁用 AI */
    setEnabled: (enabled: boolean) => void;
    /** 获取角色分配建议 */
    suggestRoles: (
        players: Array<{ id: string; name: string }>,
        options?: {
            preferredCharacters?: CharacterId[];
            excludedCharacters?: CharacterId[];
            experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
        }
    ) => Promise<RoleAssignmentSuggestion | null>;
    /** 获取能力结果建议 */
    suggestAbilityResult: (
        characterId: CharacterId,
        actor: Player,
        targets: Player[] | undefined,
        gameState: {
            players: Player[];
            currentNight: number;
            isFirstNight: boolean;
            isPoisoned?: boolean;
        }
    ) => Promise<AbilityResultSuggestion | null>;
    /** 获取游戏节奏提示 */
    getPacingTips: (gameState: {
        players: Player[];
        currentDay: number;
        currentNight: number;
        executedToday: boolean;
        nominationHistory: Array<{ nomineeId: string; passed: boolean }>;
    }) => Promise<GamePacingTip[]>;
}

export function useAIAssistant(config?: Partial<StorytellerAssistantConfig>): UseAIAssistantResult {
    const [isEnabled, setIsEnabled] = useState(() => {
        const gameConfig = getGameConfig();
        return gameConfig.aiAssistant;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assistant, setAssistant] = useState<AIStorytellerAssistant | null>(null);

    // 初始化助手
    useEffect(() => {
        const fullConfig: StorytellerAssistantConfig = {
            enabled: isEnabled,
            ...config
        };
        setAssistant(getStorytellerAssistant(fullConfig));
    }, [isEnabled, config]);

    // 切换启用状态
    const handleSetEnabled = useCallback((enabled: boolean) => {
        setIsEnabled(enabled);
        saveGameConfig({ aiAssistant: enabled });
    }, []);

    // 获取角色分配建议
    const suggestRoles = useCallback(async (
        players: Array<{ id: string; name: string }>,
        options?: {
            preferredCharacters?: CharacterId[];
            excludedCharacters?: CharacterId[];
            experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
        }
    ): Promise<RoleAssignmentSuggestion | null> => {
        if (!assistant) return null;

        setIsLoading(true);
        setError(null);

        try {
            const result = await assistant.suggestRoleAssignment(players, options);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : '获取建议失败';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [assistant]);

    // 获取能力结果建议
    const suggestAbilityResult = useCallback(async (
        characterId: CharacterId,
        actor: Player,
        targets: Player[] | undefined,
        gameState: {
            players: Player[];
            currentNight: number;
            isFirstNight: boolean;
            isPoisoned?: boolean;
        }
    ): Promise<AbilityResultSuggestion | null> => {
        if (!assistant) return null;

        setIsLoading(true);
        setError(null);

        try {
            const result = await assistant.suggestAbilityResult(characterId, actor, targets, gameState);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : '获取建议失败';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [assistant]);

    // 获取游戏节奏提示
    const getPacingTips = useCallback(async (gameState: {
        players: Player[];
        currentDay: number;
        currentNight: number;
        executedToday: boolean;
        nominationHistory: Array<{ nomineeId: string; passed: boolean }>;
    }): Promise<GamePacingTip[]> => {
        if (!assistant) return [];

        setIsLoading(true);
        setError(null);

        try {
            const result = await assistant.getGamePacingTips(gameState);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : '获取建议失败';
            setError(message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [assistant]);

    return {
        isEnabled,
        isLoading,
        error,
        setEnabled: handleSetEnabled,
        suggestRoles,
        suggestAbilityResult,
        getPacingTips
    };
}

// ============================================================
// useGamePacingTips Hook - 自动获取节奏提示
// ============================================================

export function useGamePacingTips(gameState: {
    players: Player[];
    currentDay: number;
    currentNight: number;
    executedToday: boolean;
    nominationHistory: Array<{ nomineeId: string; passed: boolean }>;
} | null): {
    tips: GamePacingTip[];
    isLoading: boolean;
    refresh: () => void;
} {
    const { isEnabled, getPacingTips, isLoading } = useAIAssistant();
    const [tips, setTips] = useState<GamePacingTip[]>([]);

    const refresh = useCallback(async () => {
        if (!gameState || !isEnabled) return;

        const newTips = await getPacingTips(gameState);
        setTips(newTips);
    }, [gameState, isEnabled, getPacingTips]);

    // 当游戏状态变化时自动刷新
    useEffect(() => {
        if (gameState) {
            refresh();
        }
    }, [gameState?.currentDay, gameState?.executedToday, refresh]);

    return { tips, isLoading, refresh };
}
