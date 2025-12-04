/**
 * Supabase 数据库类型定义
 * 
 * 与 database/setup.sql 保持同步
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    display_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };

            game_sessions: {
                Row: {
                    id: string;
                    join_code: string;
                    name: string | null;
                    status: string;
                    phase: string;
                    current_day: number;
                    current_night: number;
                    is_first_night: boolean;
                    storyteller_id: string | null;
                    script_id: string | null;
                    script_json: Json | null;
                    settings: Json;
                    winner: string | null;
                    end_reason: string | null;
                    created_at: string;
                    updated_at: string;
                    started_at: string | null;
                    finished_at: string | null;
                };
                Insert: {
                    id?: string;
                    join_code: string;
                    name?: string | null;
                    status?: string;
                    phase?: string;
                    current_day?: number;
                    current_night?: number;
                    is_first_night?: boolean;
                    storyteller_id?: string | null;
                    script_id?: string | null;
                    script_json?: Json | null;
                    settings?: Json;
                    winner?: string | null;
                    end_reason?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    started_at?: string | null;
                    finished_at?: string | null;
                };
                Update: {
                    id?: string;
                    join_code?: string;
                    name?: string | null;
                    status?: string;
                    phase?: string;
                    current_day?: number;
                    current_night?: number;
                    is_first_night?: boolean;
                    storyteller_id?: string | null;
                    script_id?: string | null;
                    script_json?: Json | null;
                    settings?: Json;
                    winner?: string | null;
                    end_reason?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    started_at?: string | null;
                    finished_at?: string | null;
                };
                Relationships: [];
            };

            game_participants: {
                Row: {
                    id: string;
                    session_id: string;
                    user_id: string | null;
                    name: string;
                    seat_index: number;
                    character_id: string | null;
                    shown_character_id: string | null;
                    is_dead: boolean;
                    is_ghost: boolean;
                    has_ghost_vote: boolean;
                    status_flags: Json;
                    has_nominated_today: boolean;
                    has_been_nominated_today: boolean;
                    night_action_target_id: string | null;
                    night_action_result: Json | null;
                    storyteller_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    user_id?: string | null;
                    name: string;
                    seat_index: number;
                    character_id?: string | null;
                    shown_character_id?: string | null;
                    is_dead?: boolean;
                    is_ghost?: boolean;
                    has_ghost_vote?: boolean;
                    status_flags?: Json;
                    has_nominated_today?: boolean;
                    has_been_nominated_today?: boolean;
                    night_action_target_id?: string | null;
                    night_action_result?: Json | null;
                    storyteller_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    user_id?: string | null;
                    name?: string;
                    seat_index?: number;
                    character_id?: string | null;
                    shown_character_id?: string | null;
                    is_dead?: boolean;
                    is_ghost?: boolean;
                    has_ghost_vote?: boolean;
                    status_flags?: Json;
                    has_nominated_today?: boolean;
                    has_been_nominated_today?: boolean;
                    night_action_target_id?: string | null;
                    night_action_result?: Json | null;
                    storyteller_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };

            game_actions: {
                Row: {
                    id: string;
                    session_id: string;
                    actor_id: string | null;
                    target_id: string | null;
                    action_type: string;
                    payload: Json | null;
                    day_number: number | null;
                    night_number: number | null;
                    phase: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    actor_id?: string | null;
                    target_id?: string | null;
                    action_type: string;
                    payload?: Json | null;
                    day_number?: number | null;
                    night_number?: number | null;
                    phase?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    actor_id?: string | null;
                    target_id?: string | null;
                    action_type?: string;
                    payload?: Json | null;
                    day_number?: number | null;
                    night_number?: number | null;
                    phase?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };

            chat_messages: {
                Row: {
                    id: string;
                    session_id: string;
                    user_id: string | null;
                    message_type: string;
                    content: string;
                    recipient_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    user_id?: string | null;
                    message_type?: string;
                    content: string;
                    recipient_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    user_id?: string | null;
                    message_type?: string;
                    content?: string;
                    recipient_id?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
        };

        Views: Record<string, never>;

        Functions: {
            generate_join_code: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            reset_daily_status: {
                Args: { p_session_id: string };
                Returns: undefined;
            };
            get_alive_count: {
                Args: { p_session_id: string };
                Returns: number;
            };
        };

        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

// 导出常用类型
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GameSession = Database['public']['Tables']['game_sessions']['Row'];
export type GameParticipant = Database['public']['Tables']['game_participants']['Row'];
export type GameAction = Database['public']['Tables']['game_actions']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

// 状态标记类型
export interface StatusFlags {
    poisoned: boolean;
    drunk: boolean;
    protected: boolean;
    mad: boolean;
    custom: string[];
}
