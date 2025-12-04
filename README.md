# Grimoire Aether ✨

一个基于 React + Konva + Matter.js 的多人在线桌游平台。

## 🛠️ 技术栈

### 核心框架

- **React 19** - UI 框架
- **Vite** - 构建工具
- **TypeScript 5.x** - 类型系统（严格模式）

### 样式系统

- **Tailwind CSS** - 原子化 CSS
- **clsx + tailwind-merge** - 类名工具
- **lucide-react** - 图标库

### UI 组件

- **shadcn/ui** - 高质量 UI 组件（待初始化）

### 状态管理

- **XState v5** + **@xstate/react** - 游戏逻辑状态机
- **Zustand** - UI 全局状态
- **TanStack Query** - 数据获取与缓存

### Canvas & 物理引擎

- **Konva** + **react-konva** - Canvas 渲染引擎
- **Matter.js** - 2D 物理模拟
- **TSParticles** - 粒子特效

### 交互

- **@use-gesture/react** - 移动端手势
- **react-hotkeys-hook** - 桌面快捷键

### 动画

- **Framer Motion** - DOM 动画

### 后端 & 数据

- **Supabase** - 实时数据库
- **Hono** - Cloudflare Workers API 网关

## 📁 项目结构

```
src/
├── components/
│   ├── game/              # [CANVAS] React-Konva 组件
│   │   ├── board/         # 棋盘布局
│   │   └── tokens/        # 可拖拽实体
│   └── ui/                # [DOM] HTML/Shadcn 组件
│       ├── overlays/      # 菜单、径向菜单、右键菜单
│       └── layout/        # 侧边栏、底部抽屉
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具库
│   ├── supabase.ts        # Supabase 客户端
│   └── utils.ts           # 通用工具函数
├── logic/                 # 纯逻辑层
│   ├── machines/          # XState 状态机
│   └── stores/            # Zustand Stores
├── types/                 # TypeScript 类型定义
└── App.tsx                # 应用入口
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并填写您的配置：

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_API_URL=your_ai_api_endpoint
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 🎯 架构原则

### 1️⃣ Canvas vs DOM 严格分离

- **Canvas 层**（Konva）：游戏棋盘、Token、物理交互
- **DOM 层**（HTML）：菜单、侧边栏、设置面板

### 2️⃣ 状态管理分层

- **XState**：游戏核心逻辑（回合、阵营、胜负判定）
- **Zustand**：UI 状态（菜单开关、视图模式）
- **TanStack Query**：服务端数据同步

### 3️⃣ 类型安全

- 全项目 TypeScript 严格模式
- 所有 API 调用必须有类型定义

## 📝 开发规范

- 使用函数式组件 + Hooks
- 优先使用 `const` 声明
- 使用 `cn()` 工具合并 className
- 组件使用 PascalCase，文件名与组件名一致
- hooks 使用 camelCase，以 `use` 开头

## 🔗 相关资源

- [React 19 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [XState v5](https://stately.ai/docs/xstate)
- [Konva 文档](https://konvajs.org/)
- [Supabase 文档](https://supabase.com/docs)

---

**Grimoire Aether** - 让桌游在云端重生 ⚡
