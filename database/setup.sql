-- ============================================================
-- Grimoire Aether - 数据库初始化脚本
-- ============================================================
-- 在 Supabase SQL Editor 中执行此脚本
-- https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz/editor
-- ============================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 玩家表 (players)
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
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

-- 玩家表索引
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);

-- 玩家表 RLS 策略
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

-- 用户只能插入自己的数据
CREATE POLICY "Users can insert their own player data" ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的数据
CREATE POLICY "Users can update their own player data" ON players
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 2. 游戏会话表 (game_sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, paused, finished
  game_type TEXT NOT NULL DEFAULT 'standard', -- standard, custom, tournament
  max_players INTEGER NOT NULL DEFAULT 6,
  current_players INTEGER DEFAULT 0,
  host_id UUID REFERENCES players(id) ON DELETE SET NULL,
  password_hash TEXT, -- 如果需要密码保护
  is_public BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- 游戏设置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- 游戏会话索引
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_is_public ON game_sessions(is_public);

-- 游戏会话 RLS 策略
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 公开会话所有人可见，私有会话只有参与者可见
CREATE POLICY "Public sessions are viewable by everyone" ON game_sessions
  FOR SELECT USING (is_public = true OR auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = game_sessions.id
    )
  ));

-- 认证用户可以创建会话
CREATE POLICY "Authenticated users can create sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 主持人可以更新会话
CREATE POLICY "Host can update session" ON game_sessions
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id = host_id
  ));

-- ============================================================
-- 3. 游戏参与者表 (game_participants)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'player', -- player, spectator
  seat_position INTEGER,
  status TEXT DEFAULT 'active', -- active, disconnected, eliminated
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, player_id)
);

-- 参与者表索引
CREATE INDEX IF NOT EXISTS idx_game_participants_session_id ON game_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_player_id ON game_participants(player_id);

-- 参与者表 RLS 策略
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- 会话参与者可见
CREATE POLICY "Participants are viewable by session members" ON game_participants
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = game_participants.session_id
    )
  ));

-- 玩家可以加入会话
CREATE POLICY "Players can join sessions" ON game_participants
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM players WHERE id = player_id
  ));

-- 玩家可以离开会话
CREATE POLICY "Players can leave sessions" ON game_participants
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id = player_id
  ));

-- ============================================================
-- 4. 游戏状态表 (game_state)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER DEFAULT 0,
  current_phase TEXT DEFAULT 'setup', -- setup, main, combat, end
  active_player_id UUID REFERENCES players(id),
  board_state JSONB NOT NULL DEFAULT '{}', -- 棋盘状态
  tokens JSONB DEFAULT '[]', -- Token 位置和状态
  cards_state JSONB DEFAULT '{}', -- 卡牌状态
  dice_results JSONB DEFAULT '[]', -- 骰子结果
  history JSONB DEFAULT '[]', -- 操作历史
  version INTEGER DEFAULT 1, -- 状态版本号，用于并发控制
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- 游戏状态索引
CREATE INDEX IF NOT EXISTS idx_game_state_session_id ON game_state(session_id);

-- 游戏状态 RLS 策略
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- 参与者可读写游戏状态
CREATE POLICY "Session participants can view game state" ON game_state
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = game_state.session_id
    )
  ));

CREATE POLICY "Session participants can update game state" ON game_state
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = game_state.session_id
    )
  ));

CREATE POLICY "System can insert initial game state" ON game_state
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. 游戏动作日志表 (game_actions)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- move, attack, use_card, roll_dice, etc.
  action_data JSONB NOT NULL,
  turn_number INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 动作日志索引
CREATE INDEX IF NOT EXISTS idx_game_actions_session_id ON game_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_timestamp ON game_actions(timestamp);

-- 动作日志 RLS 策略
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- 参与者可查看动作日志
CREATE POLICY "Session participants can view actions" ON game_actions
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = game_actions.session_id
    )
  ));

-- 参与者可记录动作
CREATE POLICY "Session participants can log actions" ON game_actions
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM players WHERE id = player_id
  ));

-- ============================================================
-- 6. 聊天消息表 (chat_messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'text', -- text, system, action
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天消息索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 聊天消息 RLS 策略
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 参与者可查看聊天
CREATE POLICY "Session participants can view chat" ON chat_messages
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM players WHERE id IN (
      SELECT player_id FROM game_participants WHERE session_id = chat_messages.session_id
    )
  ));

-- 参与者可发送消息
CREATE POLICY "Session participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM players WHERE id = player_id
  ));

-- ============================================================
-- 7. 触发器和函数
-- ============================================================

-- 更新 updated_at 时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_state_updated_at ON game_state;
CREATE TRIGGER update_game_state_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 更新会话参与人数的函数
CREATE OR REPLACE FUNCTION update_session_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_sessions
    SET current_players = (
      SELECT COUNT(*) FROM game_participants
      WHERE session_id = NEW.session_id AND status = 'active'
    )
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE game_sessions
    SET current_players = (
      SELECT COUNT(*) FROM game_participants
      WHERE session_id = NEW.session_id AND status = 'active'
    )
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_sessions
    SET current_players = (
      SELECT COUNT(*) FROM game_participants
      WHERE session_id = OLD.session_id AND status = 'active'
    )
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 参与者变更时更新会话人数
DROP TRIGGER IF EXISTS update_session_player_count_trigger ON game_participants;
CREATE TRIGGER update_session_player_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_session_player_count();

-- ============================================================
-- 8. 初始化数据
-- ============================================================

-- 插入一些示例数据（可选）
-- INSERT INTO players (user_id, username, display_name) VALUES
--   (auth.uid(), 'demo_player', '演示玩家');

-- ============================================================
-- 完成！
-- ============================================================
-- 所有表和策略已创建
-- 下一步：在 Supabase Dashboard 中启用 Realtime
-- Database -> Replication -> 选择需要实时同步的表
-- ============================================================
