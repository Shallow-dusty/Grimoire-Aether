# Grimoire Aether - 技术架构蓝图 (Technical Blueprint)

> **版本**: 1.0.0
> **核心理念**: 机器可读性优先 (Type Safety)，双端体验分治 (Desktop/Mobile)，AI 逻辑驱动。

## 1. 项目愿景与审美 (Vision & Aesthetics)
- **定位**: 全球最强的沉浸式、AI 原生《血染钟楼》魔典。
- **风格**: 哥特式 (Gothic)、史诗感 (Epic)、现代化 (Modern)。默认深色模式。
- **核心体验**:
  - **PC 端**: 键鼠流操作，追求极致的控场效率 (Context Menus, Hotkeys)。
  - **移动端**: 拇指驱动，追求符合直觉的触控体验 (Radial Menus, Gestures)。

## 2. 技术栈宪法 (Tech Stack Constitution)
**严禁偏离以下选型：**

| 模块 (Layer) | 技术选型 (Tech) | 核心职责 (Role) |
| :--- | :--- | :--- |
| **构建框架** | **Vite + React 19** | SPA 模式。极速构建，生态丰富。 |
| **开发语言** | **TypeScript 5.x** | **Strict Mode**。类型即文档，严禁 `any`。 |
| **逻辑大脑** | **XState v5** | 管理游戏核心流程 (Setup -> Night -> Day -> Vote)。 |
| **UI 状态** | **Zustand** | 管理瞬时 UI 状态 (侧边栏、音量、选中项)。 |
| **渲染引擎** | **React-Konva** | 绘制核心盘面 (Token, 座位, 连线)。 |
| **物理引擎** | **Matter.js** | 实现“物理审判” (Voting Bowl) 的筹码投掷与碰撞。 |
| **视觉特效** | **tsparticles** | 实现迷雾、灰烬、腐蚀等全屏背景特效。 |
| **UI 组件库** | **Shadcn/ui + Tailwind** | HTML 层的基础组件 (Dialog, Sheet, Button)。 |
| **后端 API** | **Hono (Cloudflare)** | API 网关，部署在 `/functions`，处理 AI 转发与敏感逻辑。 |
| **数据库** | **Supabase** | PostgreSQL (持久化) + Realtime (光标/状态同步)。 |
| **AI 智能** | **Custom API (DeepSeek)** | 通过 Hono 后端代理调用，实现规则判决与叙事。 |

## 3. 目录结构规范 (Directory Structure)
必须严格区分 **Canvas 世界 (Konva)** 与 **DOM 世界 (HTML)**，防止渲染混淆。

src/
├── components/
│   ├── game/           # [Canvas Layer] 仅限 React-Konva 组件
│   │   ├── StageWrapper.tsx # 响应式 Stage
│   │   ├── tokens/     # 可拖拽的 Token
│   │   └── board/      # 座位表、物理审判区
│   ├── ui/             # [DOM Layer] 仅限 HTML/Shadcn 组件
│   │   ├── overlays/   # 右键菜单, 环形菜单, 悬浮提示
│   │   └── layout/     # 侧边栏, 底部 Dock
├── logic/
│   ├── machines/       # XState 状态机 (gameMachine.ts)
│   └── stores/         # Zustand 状态库 (uiStore.ts)
├── hooks/
│   ├── useDeviceType.ts # 检测 Mobile/Desktop
│   ├── useGestures.ts   # 统一处理手势逻辑
│   └── usePhysics.ts    # Matter.js 桥接
├── lib/
│   ├── supabase.ts      # 数据库客户端
│   └── ai-client.ts     # AI 后端请求封装 (Fetch /api/ai/chat)
└── types/               # 全局 TypeScript 定义

## 4. 核心模块实现指南 (Implementation Guide)

### A. 游戏引擎 (The Game Engine)
- **位置**: `src/logic/machines/gameMachine.ts`
- **职责**: 唯一的真理来源 (Single Source of Truth)。
- **状态流转**: `SETUP` -> `NIGHT` (唤醒逻辑) -> `DAY` (公聊 -> 提名 -> 投票 -> 处决) -> `GAME_OVER`。
- **约束**: UI 组件只负责发送事件 (send Event)，不处理业务逻辑。

### B. 渲染与物理 (Rendering & Physics)
- **分层策略**:
  1.  **背景层**: `tsparticles` (迷雾/氛围)。
  2.  **盘面层**: `React-Konva` (Token/座位)。
  3.  **物理层**: `Matter.js` (不可见，仅计算坐标，同步给 Konva)。
  4.  **UI 层**: HTML DOM (覆盖在 Canvas 之上)。

### C. 双端交互适配 (Interaction)
- **PC 端**:
  - **右键 (Context Menu)**: 呼出复杂操作菜单 (中毒/标记/击杀)。
  - **快捷键**: Space (切换阶段), Del (死亡)。
- **移动端**:
  - **长按 (Long Press)**: 呼出环形菜单 (Radial Menu) 进行快速标记。
  - **点击 (Tap)**: 选中玩家，底部弹出 Dock。
  - **手势**: 双指缩放/平移画布，单指拖拽 Token。

### D. 后端与 AI (Backend & AI)
- **架构**: Backend-for-Frontend (BFF)。
- **位置**: `functions/api/[[route]].ts` (Hono)。
- **安全**: `LLM_API_KEY` 仅存在于 Cloudflare 环境变量，严禁暴露给前端。
- **流**: `/api/ai/chat` 接收前端 JSON，转发给 DeepSeek/Claude，并将结果流式返回。

## 5. 开发工作流 (Workflow)
1.  **定义类型**: 在 `src/types` 中定义严格的接口。
2.  **编写逻辑**: 在 XState 中实现状态流转。
3.  **实现后端**: 如果涉及数据或 AI，先写 Hono 接口。
4.  **构建界面**: 实现 Canvas 或 UI 组件。
5.  **双端测试**: 必须同时验证 鼠标操作 和 触摸模拟。