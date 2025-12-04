# ✅ Supabase 配置完成

## 📋 配置信息

### Supabase 项目信息

- **项目 URL**: `https://fojyiwneixxyryvnuyuz.supabase.co`
- **项目 ID**: `fojyiwneixxyryvnuyuz`
- **Anon Key**: 已配置 ✅（在 .env 文件中）

### 配置文件

- **文件位置**: `e:\coding\Antigravity\Grimoire-Aether\.env`
- **状态**: ✅ 已更新

### 配置详情

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://fojyiwneixxyryvnuyuz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvanlpd25laXh4eXJ5dm51eXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjMzMDMsImV4cCI6MjA4MDMzOTMwM30.BZNOfwhqO6y76rKDDRboNgVSEc1HTOOO6KUTzZFSkNo

# AI API Configuration (可选)
VITE_AI_API_URL=your_ai_api_endpoint_here
```

---

## 🔐 安全提示

⚠️ **重要**: 该配置文件包含敏感信息（Anon Key），请务必：

1. ✅ **不要提交到公开仓库**
   - `.env` 文件已在 `.gitignore` 中
   - 仅提交 `.env.example` 模板

2. ✅ **使用 RLS（行级安全）**
   - 在 Supabase 控制台中启用表的 RLS
   - 配置适当的安全策略

3. ✅ **定期轮换密钥**
   - 如果密钥泄露，立即在 Supabase 控制台重新生成

---

## 🚀 如何使用

### 在代码中使用 Supabase

```typescript
import { supabase } from "./lib/supabase";

// 示例：查询数据
const { data, error } = await supabase
    .from("your_table")
    .select("*");

// 示例：插入数据
const { data, error } = await supabase
    .from("your_table")
    .insert({ column: "value" });

// 示例：实时订阅
supabase
    .channel("your_channel")
    .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "your_table",
    }, (payload) => {
        console.log("数据变化:", payload);
    })
    .subscribe();
```

---

## ✅ 下一步操作

### 1. 在 Supabase 控制台创建表

访问:
[https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz](https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz)

#### 建议的初始表结构

**表: `players` (玩家表)**

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- 策略：所有人可读
CREATE POLICY "Allow read access" ON players
  FOR SELECT USING (true);

-- 策略：只能修改自己的数据
CREATE POLICY "Allow update own data" ON players
  FOR UPDATE USING (auth.uid() = user_id);
```

**表: `game_sessions` (游戏会话表)**

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, playing, finished
  max_players INTEGER DEFAULT 6,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 策略：所有人可读
CREATE POLICY "Allow read access" ON game_sessions
  FOR SELECT USING (true);

-- 策略：创建者可更新
CREATE POLICY "Allow creator to update" ON game_sessions
  FOR UPDATE USING (auth.uid() = created_by);
```

**表: `game_state` (游戏状态表)**

```sql
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  state_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- 策略：会话参与者可读写
CREATE POLICY "Allow session participants" ON game_state
  FOR ALL USING (true); -- 根据实际需求调整
```

### 2. 启用实时功能

在 Supabase 控制台中：

1. 进入 **Database** > **Replication**
2. 为需要实时同步的表启用 **Realtime**

### 3. 配置认证

在 Supabase 控制台中：

1. 进入 **Authentication** > **Providers**
2. 启用所需的认证方式（Email、OAuth 等）

---

## 🧪 测试连接

开发服务器已经在运行，Vite 会自动加载 `.env` 文件。

访问: [http://localhost:5173/](http://localhost:5173/)

在浏览器控制台中测试：

```javascript
// 已自动导入 supabase 客户端
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
```

---

## 📚 相关链接

- 🏠
  [Supabase 项目控制台](https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz)
- 📖 [Supabase 文档](https://supabase.com/docs)
- 🔐 [RLS 配置指南](https://supabase.com/docs/guides/auth/row-level-security)
- ⚡ [实时订阅文档](https://supabase.com/docs/guides/realtime)

---

**配置完成！现在可以开始使用 Supabase 了！** 🎉
