-- ============================================================
-- Grimoire Aether - 一键初始化脚本（无错误版）
-- ============================================================
-- 直接复制粘贴到 Supabase SQL Editor 执行即可
-- 此脚本会自动处理所有情况，不会报错
-- ============================================================

-- 第一步：安全删除所有旧数据（不会报错）
DO $$ 
BEGIN
  -- 删除触发器（忽略错误）
  EXECUTE 'DROP TRIGGER IF EXISTS update_session_player_count_trigger ON game_participants' ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS update_game_state_updated_at ON game_state';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS update_players_updated_at ON players';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 删除函数
DROP FUNCTION IF EXISTS update_session_player_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 删除表（CASCADE 会自动删除依赖）
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS game_actions CASCADE;
DROP TABLE IF EXISTS game_state CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- ============================================================
-- 第二步：启用扩展
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 第三步：创建表
-- ============================================================

-- 1. 玩家表
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 游戏会话表
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  game_type TEXT NOT NULL DEFAULT 'standard',
  max_players INTEGER NOT NULL DEFAULT 6,
  current_players INTEGER DEFAULT 0,
  host_id UUID REFERENCES players(id) ON DELETE SET NULL,
  password_hash TEXT,
  is_public BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- 3. 游戏参与者表
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'player',
  seat_position INTEGER,
  status TEXT DEFAULT 'active',
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, player_id)
);

-- 4. 游戏状态表
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER DEFAULT 0,
  current_phase TEXT DEFAULT 'setup',
  active_player_id UUID REFERENCES players(id),
  board_state JSONB NOT NULL DEFAULT '{}',
  tokens JSONB DEFAULT '[]',
  cards_state JSONB DEFAULT '{}',
  dice_results JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- 5. 游戏动作日志表
CREATE TABLE game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  turn_number INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 聊天消息表
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 第四步：创建索引
-- ============================================================

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_host_id ON game_sessions(host_id);
CREATE INDEX idx_game_sessions_is_public ON game_sessions(is_public);
CREATE INDEX idx_game_participants_session_id ON game_participants(session_id);
CREATE INDEX idx_game_participants_player_id ON game_participants(player_id);
CREATE INDEX idx_game_state_session_id ON game_state(session_id);
CREATE INDEX idx_game_actions_session_id ON game_actions(session_id);
CREATE INDEX idx_game_actions_timestamp ON game_actions(timestamp);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================
-- 第五步：启用 RLS
-- ============================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 第六步：创建 RLS 策略
-- ============================================================

-- Players
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "players_update" ON players FOR UPDATE USING (auth.uid() = user_id);

-- Game Sessions
CREATE POLICY "sessions_select" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON game_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sessions_update" ON game_sessions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Game Participants
CREATE POLICY "participants_select" ON game_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON game_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "participants_update" ON game_participants FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Game State
CREATE POLICY "state_select" ON game_state FOR SELECT USING (true);
CREATE POLICY "state_insert" ON game_state FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "state_update" ON game_state FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Game Actions
CREATE POLICY "actions_select" ON game_actions FOR SELECT USING (true);
CREATE POLICY "actions_insert" ON game_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Chat Messages
CREATE POLICY "chat_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 第七步：创建函数
-- ============================================================

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION update_session_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE game_sessions
    SET current_players = (
      SELECT COUNT(*) FROM game_participants
      WHERE session_id = OLD.session_id AND status = 'active'
    )
    WHERE id = OLD.session_id;
    RETURN OLD;
  ELSE
    UPDATE game_sessions
    SET current_players = (
      SELECT COUNT(*) FROM game_participants
      WHERE session_id = NEW.session_id AND status = 'active'
    )
    WHERE id = NEW.session_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 第八步：创建触发器
-- ============================================================

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_player_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON game_participants
  FOR EACH ROW EXECUTE FUNCTION update_session_player_count();

-- ============================================================
-- 完成！
-- ============================================================
SELECT 'Database setup complete!' AS status;
