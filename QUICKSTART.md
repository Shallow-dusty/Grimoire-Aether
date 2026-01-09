# 🚀 Grimoire Aether - 快速开始指南

## 📋 当前状态

✅ **项目已完全配置**

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- XState v5 状态机
- 430+ 测试用例，95%+ 覆盖率

## ⚡ 快速命令

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问: http://localhost:5173/
```

### 测试

```bash
# 运行所有测试
npm test

# 运行测试并监视变化
npm test -- --watch

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

### 构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 代码检查

```bash
# 类型检查
npm run typecheck

# ESLint 检查
npm run lint
```

### Git 操作

```bash
# 查看状态
git status

# 提交更改
git add .
git commit -m "Your message"
git push
```

## 🗄️ 数据库设置

**一次性执行**（在 Supabase SQL Editor 中）：

1. 访问: https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz/editor
2. 复制整个 `database/setup.sql` 文件
3. 粘贴并点击 **Run**
4. 等待执行完成（约 5-10 秒）

**数据库包含**:

- `players` - 玩家
- `game_sessions` - 游戏会话
- `game_participants` - 参与者
- `game_state` - 游戏状态
- `game_actions` - 动作日志
- `chat_messages` - 聊天

## 🔑 环境变量

所有密钥已配置在 `.env`：

- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ DeepSeek API URL
- ✅ DeepSeek API Key

## 📦 已安装的包

**核心**:

- React 19 + React DOM
- TypeScript 5.x
- Vite 7.x

**样式**:

- Tailwind CSS v4
- clsx + tailwind-merge
- lucide-react (图标)

**状态管理**:

- XState v5 (游戏逻辑)
- Zustand (UI 状态)
- TanStack Query (数据)

**Canvas & 物理**:

- Konva + react-konva
- Matter.js
- TSParticles

**后端**:

- Supabase
- Hono (Workers)

**交互**:

- @use-gesture/react
- react-hotkeys-hook
- Framer Motion

## 🎯 项目结构

```
src/
├── components/
│   ├── game/        # Canvas 组件
│   └── ui/          # DOM 组件
├── hooks/           # 自定义 Hooks
├── lib/             # 工具库
├── logic/           # 状态管理
├── types/           # 类型定义
└── App.tsx          # 主应用
```

## 🔗 重要链接

- 🏠 GitHub: https://github.com/Shallow-dusty/Grimoire-Aether
- 🗄️ Supabase: https://supabase.com/dashboard/project/fojyiwneixxyryvnuyuz
- 🤖 DeepSeek: https://platform.deepseek.com

## ⚡ 常用代码片段

### Supabase 查询

```typescript
import { supabase } from "./lib/supabase";

// 查询
const { data, error } = await supabase
    .from("players")
    .select("*");

// 插入
await supabase
    .from("players")
    .insert({ username: "test", display_name: "Test" });
```

### DeepSeek AI

```typescript
const response = await fetch(
    import.meta.env.VITE_AI_API_URL + "/v1/chat/completions",
    {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_AI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: "Hello!" }],
        }),
    },
);
```

### Zustand Store

```typescript
import { useUIStore } from "./logic/stores/uiStore";

// 使用
const { viewMode, setViewMode } = useUIStore();
setViewMode("board");
```

---

**准备就绪！开始开发吧！** 🎉
