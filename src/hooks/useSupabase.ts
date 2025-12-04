/**
 * Supabase Realtime Hooks
 * 
 * 提供游戏房间的实时同步功能
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
    supabase,
    subscribeToSession,
    subscribeToActions,
    unsubscribe,
    getGameSession,
    getGameParticipants,
    type GameSession,
    type GameParticipant,
    type GameAction
} from '../lib/supabase';

// ============================================================
// 类型定义
// ============================================================

interface UseGameSessionReturn {
    session: GameSession | null;
    participants: GameParticipant[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

interface UseGameActionsReturn {
    actions: GameAction[];
    latestAction: GameAction | null;
}

// ============================================================
// useGameSession - 订阅游戏房间
// ============================================================

export function useGameSession(sessionId: string | null): UseGameSessionReturn {
    const [session, setSession] = useState<GameSession | null>(null);
    const [participants, setParticipants] = useState<GameParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // 刷新数据
    const refresh = useCallback(async () => {
        if (!sessionId) return;

        try {
            setLoading(true);
            const [sessionData, participantsData] = await Promise.all([
                getGameSession(sessionId),
                getGameParticipants(sessionId)
            ]);
            setSession(sessionData);
            setParticipants(participantsData || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch session'));
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    // 订阅实时更新
    useEffect(() => {
        if (!sessionId) {
            return;
        }

        // 初始加载
        void refresh();

        // 订阅变化
        channelRef.current = subscribeToSession(
            sessionId,
            // 房间变化
            (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                    setSession(payload.new);
                } else if (payload.eventType === 'DELETE') {
                    setSession(null);
                }
            },
            // 参与者变化
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    setParticipants(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setParticipants(prev =>
                        prev.map(p => p.id === payload.new.id ? payload.new : p)
                    );
                } else if (payload.eventType === 'DELETE') {
                    setParticipants(prev =>
                        prev.filter(p => p.id !== payload.old.id)
                    );
                }
            }
        );

        // 清理
        return () => {
            if (channelRef.current) {
                unsubscribe(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [sessionId, refresh]);

    return { session, participants, loading, error, refresh };
}

// ============================================================
// useGameActions - 订阅游戏动作
// ============================================================

export function useGameActions(
    sessionId: string | null,
    maxActions = 50
): UseGameActionsReturn {
    const [actions, setActions] = useState<GameAction[]>([]);
    const [latestAction, setLatestAction] = useState<GameAction | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!sessionId) {
            return;
        }

        // 订阅新动作
        channelRef.current = subscribeToActions(sessionId, (payload) => {
            if (payload.eventType === 'INSERT') {
                setLatestAction(payload.new);
                setActions(prev => {
                    const updated = [payload.new, ...prev];
                    return updated.slice(0, maxActions);
                });
            }
        });

        return () => {
            if (channelRef.current) {
                unsubscribe(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [sessionId, maxActions]);

    return { actions, latestAction };
}

// ============================================================
// usePresence - 在线状态同步（光标/位置）
// ============================================================

interface PresenceState {
    odUserId: string;
    odUsername: string;
    odCursor?: { x: number; y: number };
    odSelectedPlayerId?: string;
}

interface UsePresenceReturn {
    presences: Record<string, PresenceState>;
    updatePresence: (state: Partial<PresenceState>) => void;
}

export function usePresence(
    sessionId: string | null,
    userId: string,
    username: string
): UsePresenceReturn {
    const [presences, setPresences] = useState<Record<string, PresenceState>>({});
    const channelRef = useRef<RealtimeChannel | null>(null);

    const updatePresence = useCallback((state: Partial<PresenceState>) => {
        if (channelRef.current) {
            channelRef.current.track({
                odUserId: userId,
                odUsername: username,
                ...state
            });
        }
    }, [userId, username]);

    useEffect(() => {
        if (!sessionId || !userId) {
            return;
        }

        const channel = supabase.channel(`presence:${sessionId}`, {
            config: {
                presence: {
                    key: userId
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<PresenceState>();
                const formatted: Record<string, PresenceState> = {};

                for (const [key, presenceList] of Object.entries(state)) {
                    if (presenceList.length > 0) {
                        formatted[key] = presenceList[0];
                    }
                }

                setPresences(formatted);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        odUserId: userId,
                        odUsername: username
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [sessionId, userId, username]);

    return { presences, updatePresence };
}

// ============================================================
// 辅助 Hooks
// ============================================================

export function useParticipant(
    participants: GameParticipant[],
    participantId: string | null
): GameParticipant | null {
    return participants.find(p => p.id === participantId) ?? null;
}

export function useAliveParticipants(participants: GameParticipant[]): GameParticipant[] {
    return participants.filter(p => !p.is_dead);
}

export function useDeadParticipants(participants: GameParticipant[]): GameParticipant[] {
    return participants.filter(p => p.is_dead);
}
