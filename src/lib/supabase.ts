/**
 * Supabase 客户端配置
 * 
 * 包含数据库操作和 Realtime 订阅
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database, Json } from '../types/database';

// ============================================================
// 客户端初始化
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 环境变量未配置！请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// ============================================================
// 类型导出
// ============================================================

export type Tables = Database['public']['Tables'];
export type GameSession = Tables['game_sessions']['Row'];
export type GameParticipant = Tables['game_participants']['Row'];
export type GameAction = Tables['game_actions']['Row'];
export type Profile = Tables['profiles']['Row'];

// ============================================================
// 房间操作
// ============================================================

/** 生成4位房间码 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** 创建游戏房间 */
export async function createGameSession(storytellerId: string, name?: string) {
  const joinCode = generateJoinCode();

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      join_code: joinCode,
      name: name || `房间 ${joinCode}`,
      storyteller_id: storytellerId,
      status: 'SETUP',
      phase: 'SETUP'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** 通过房间码加入 */
export async function joinGameByCode(joinCode: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase())
    .single();

  if (error) throw error;
  return data;
}

/** 获取房间详情 */
export async function getGameSession(sessionId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

/** 获取房间参与者 */
export async function getGameParticipants(sessionId: string) {
  const { data, error } = await supabase
    .from('game_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('seat_index', { ascending: true });

  if (error) throw error;
  return data;
}

/** 更新游戏阶段 */
export async function updateGamePhase(sessionId: string, phase: string, day?: number, night?: number) {
  const updates: { phase: string; current_day?: number; current_night?: number } = { phase };
  if (day !== undefined) updates.current_day = day;
  if (night !== undefined) updates.current_night = night;

  const { error } = await supabase
    .from('game_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) throw error;
}

// ============================================================
// 玩家操作
// ============================================================

/** 添加玩家到游戏 */
export async function addParticipant(
  sessionId: string,
  name: string,
  seatIndex: number,
  userId?: string
) {
  const { data, error } = await supabase
    .from('game_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      name,
      seat_index: seatIndex
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** 更新玩家状态 */
export async function updateParticipant(
  participantId: string,
  updates: Partial<GameParticipant>
) {
  // 过滤掉不能更新的字段或进行类型转换
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeUpdates: any = { ...updates };

  // 确保 status_flags 是 Json 类型
  if (safeUpdates.status_flags) {
    safeUpdates.status_flags = safeUpdates.status_flags as Json;
  }

  const { error } = await supabase
    .from('game_participants')
    .update(safeUpdates)
    .eq('id', participantId);

  if (error) throw error;
}

/** 杀死玩家 */
export async function killParticipant(participantId: string) {
  return updateParticipant(participantId, {
    is_dead: true,
    is_ghost: true
  });
}

/** 复活玩家 */
export async function reviveParticipant(participantId: string) {
  return updateParticipant(participantId, {
    is_dead: false,
    is_ghost: false,
    has_ghost_vote: true
  });
}

/** 使用幽灵票 */
export async function useGhostVote(participantId: string) {
  return updateParticipant(participantId, {
    has_ghost_vote: false
  });
}

// ============================================================
// 游戏动作日志
// ============================================================

/** 记录游戏动作 */
export async function logGameAction(
  sessionId: string,
  actionType: string,
  payload?: Record<string, unknown>,
  actorId?: string,
  targetId?: string
) {
  const { error } = await supabase
    .from('game_actions')
    .insert({
      session_id: sessionId,
      actor_id: actorId,
      target_id: targetId,
      action_type: actionType,
      payload: (payload as unknown as Json) ?? null
    });

  if (error) throw error;
}

// ============================================================
// Realtime 订阅
// ============================================================

type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}) => void;

/** 订阅游戏房间变化 */
export function subscribeToSession(
  sessionId: string,
  onSessionChange: RealtimeCallback<GameSession>,
  onParticipantChange: RealtimeCallback<GameParticipant>
): RealtimeChannel {
  const channel = supabase
    .channel(`game:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        onSessionChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as GameSession,
          old: payload.old as GameSession
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onParticipantChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as GameParticipant,
          old: payload.old as GameParticipant
        });
      }
    )
    .subscribe();

  return channel;
}

/** 订阅游戏动作 */
export function subscribeToActions(
  sessionId: string,
  onAction: RealtimeCallback<GameAction>
): RealtimeChannel {
  const channel = supabase
    .channel(`actions:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_actions',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onAction({
          eventType: 'INSERT',
          new: payload.new as GameAction,
          old: payload.old as GameAction
        });
      }
    )
    .subscribe();

  return channel;
}

/** 取消订阅 */
export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
