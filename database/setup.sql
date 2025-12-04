-- ============================================================
-- Grimoire Aether - 专用初始化脚本 (Arbiter Revised v1.0)
-- ============================================================
-- 专为《血染钟楼》魔典应用设计
-- 包含: 玩家座位、死亡状态、幽灵票、Realtime 支持
-- ============================================================

-- 🧹 第一步：清理旧数据 (安全模式)
DO $$ 
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS update_game_sessions_modtime ON game_sessions';
  EXECUTE 'DROP TRIGGER IF EXISTS update_game_participants_modtime ON game_participants';
  EXECUTE 'DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_join_code() CASCADE;
DROP FUNCTION IF EXISTS reset_daily_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_alive_count(UUID) CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS game_actions CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 🔌 第二步：启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 🏗️ 第三步：创建核心表结构
-- ============================================================

-- 1. 用户档案表 (Profiles) - 对应 Supabase Auth 用户
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 游戏房间表 (Sessions) - 一局游戏
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 房间信息
  join_code TEXT UNIQUE NOT NULL,           -- 4-6位房间号 (如 'AB12')
  name TEXT,                                 -- 房间名称
  
  -- 游戏状态
  status TEXT NOT NULL DEFAULT 'SETUP',      -- SETUP, ACTIVE, FINISHED
  phase TEXT NOT NULL DEFAULT 'SETUP',       -- SETUP, NIGHT, DAY, NOMINATION, VOTE, EXECUTION
  current_day INTEGER DEFAULT 0,             -- 当前天数
  current_night INTEGER DEFAULT 0,           -- 当前夜晚
  is_first_night BOOLEAN DEFAULT true,       -- 是否首夜
  
  -- 说书人
  storyteller_id UUID REFERENCES auth.users(id),
  
  -- 游戏配置
  script_id TEXT,                            -- 剧本 ID (如 'trouble_brewing')
  script_json JSONB,                         -- 完整剧本数据
  settings JSONB DEFAULT '{}',               -- 房间设置
  
  -- 游戏结果
  winner TEXT,                               -- 'GOOD' 或 'EVIL'
  end_reason TEXT,                           -- 结束原因
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- 3. 游戏参与者表 (Participants) - 魔典中的玩家
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 允许游客/离线玩家
  
  -- 基础信息
  name TEXT NOT NULL,                        -- 玩家昵称 (ST 可手写输入)
  seat_index INTEGER NOT NULL,               -- 座位号 (0-15, 顺时针)
  
  -- 角色信息
  character_id TEXT,                         -- 角色 ID (如 'imp', 'washerwoman')
  shown_character_id TEXT,                   -- 展示给玩家的角色 (可能与实际不同)
  
  -- 🎯 核心状态 - 魔典灵魂
  is_dead BOOLEAN DEFAULT false,             -- 是否死亡
  is_ghost BOOLEAN DEFAULT false,            -- 是否为幽灵
  has_ghost_vote BOOLEAN DEFAULT true,       -- 幽灵投票是否可用
  
  -- 状态标记 (JSONB 存储各种 token)
  status_flags JSONB DEFAULT '{
    "poisoned": false,
    "drunk": false,
    "protected": false,
    "mad": false,
    "custom": []
  }',
  
  -- 提名/投票状态 (每日重置)
  has_nominated_today BOOLEAN DEFAULT false, -- 今日是否已提名
  has_been_nominated_today BOOLEAN DEFAULT false, -- 今日是否被提名
  
  -- 夜晚行动
  night_action_target_id UUID,               -- 夜晚行动目标
  night_action_result JSONB,                 -- 夜晚行动结果
  
  -- 说书人备注
  storyteller_notes TEXT,                    -- ST 私人笔记
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束
  UNIQUE(session_id, seat_index)             -- 同一座位只能坐一人
);

-- 4. 游戏动作日志表 (Actions) - 用于回放和审计
CREATE TABLE game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  
  -- 行动信息
  actor_id UUID,                              -- 执行者 (玩家或 ST)
  target_id UUID,                             -- 目标玩家
  action_type TEXT NOT NULL,                  -- 动作类型
  
  -- 动作类型枚举:
  -- PHASE_CHANGE, NOMINATE, VOTE, EXECUTE
  -- KILL, RESURRECT, PROTECT
  -- POISON, DRUNK, CLEAR_STATUS
  -- ASSIGN_ROLE, SWAP_ROLE
  -- PLAYER_JOIN, PLAYER_LEAVE
  -- GAME_START, GAME_END
  
  payload JSONB,                              -- 详细数据
  
  -- 上下文
  day_number INTEGER,                         -- 发生在第几天
  night_number INTEGER,                       -- 发生在第几夜
  phase TEXT,                                 -- 发生时的阶段
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 聊天消息表 (可选)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  message_type TEXT DEFAULT 'text',           -- text, system, whisper
  content TEXT NOT NULL,
  recipient_id UUID,                          -- 私聊对象
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 📊 第四步：创建索引
-- ============================================================

CREATE INDEX idx_sessions_join_code ON game_sessions(join_code);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_storyteller ON game_sessions(storyteller_id);

CREATE INDEX idx_participants_session ON game_participants(session_id);
CREATE INDEX idx_participants_user ON game_participants(user_id);
CREATE INDEX idx_participants_seat ON game_participants(session_id, seat_index);
CREATE INDEX idx_participants_alive ON game_participants(session_id, is_dead);

CREATE INDEX idx_actions_session ON game_actions(session_id);
CREATE INDEX idx_actions_type ON game_actions(action_type);
CREATE INDEX idx_actions_time ON game_actions(created_at);

CREATE INDEX idx_chat_session ON chat_messages(session_id);

-- ============================================================
-- 📡 第五步：开启 Realtime (核心中的核心)
-- ============================================================

-- 必须将表加入 publication，否则前端收不到订阅更新
-- 这是实现"多人同步"的关键
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================
-- 🛡️ 第六步：RLS 策略
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 开发模式：允许所有操作 (生产环境需收紧)
CREATE POLICY "Dev: Allow All" ON profiles 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Dev: Allow All" ON game_sessions 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Dev: Allow All" ON game_participants 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Dev: Allow All" ON game_actions 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Dev: Allow All" ON chat_messages 
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- ⚡ 第七步：自动化触发器
-- ============================================================

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_modtime
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_participants_modtime
  BEFORE UPDATE ON game_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 🎭 第八步：辅助函数
-- ============================================================

-- 生成房间码
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 重置每日状态 (每天开始时调用)
CREATE OR REPLACE FUNCTION reset_daily_status(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE game_participants
  SET 
    has_nominated_today = false,
    has_been_nominated_today = false
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- 获取存活玩家数
CREATE OR REPLACE FUNCTION get_alive_count(p_session_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM game_participants
    WHERE session_id = p_session_id AND is_dead = false
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ✅ 完成
-- ============================================================
SELECT 'Grimoire Aether Schema (Blood on the Clocktower Edition) successfully applied!' as result;
