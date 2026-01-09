# Grimoire Aether

数字化《血染钟楼》(Blood on the Clocktower) 说书人助手工具。

## 游戏简介

《血染钟楼》是一款社交推理桌游，玩家分为善良阵营和邪恶阵营：

- **善良阵营**：镇民和外来者，通过投票处决找出恶魔
- **邪恶阵营**：爪牙和恶魔，通过欺骗和夜晚杀人获胜

### 游戏流程

1. **设置阶段**：添加玩家、分配角色
2. **首夜阶段**：部分角色获得信息
3. **白天阶段**：讨论、提名、投票
4. **夜晚阶段**：恶魔杀人、角色能力触发
5. **重复白天/夜晚** 直到一方获胜

### 胜利条件

- **善良获胜**：处决恶魔
- **邪恶获胜**：只剩 2 名玩家存活

## 技术栈

### 核心框架

- **React 19** - UI 框架
- **Vite** - 构建工具
- **TypeScript 5.x** - 类型系统（严格模式）

### 状态管理

- **XState v5** + **@xstate/react** - 游戏逻辑状态机
- **Zustand** - UI 全局状态

### 样式系统

- **Tailwind CSS** - 原子化 CSS
- **clsx + tailwind-merge** - 类名工具
- **lucide-react** - 图标库

### 后端 & 数据

- **Supabase** - 实时数据库（可选）

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 测试

### 运行测试

```bash
npm test
```

### 运行测试并生成覆盖率报告

```bash
npm test -- --coverage
```

### 当前测试状态

- **测试用例**：430+ 个
- **行覆盖率**：95%+
- **测试框架**：Vitest + @testing-library/react

## 项目结构

```
src/
├── components/
│   ├── game/              # 游戏组件
│   │   ├── phases/        # 阶段组件（设置、夜晚、白天、处决、结束）
│   │   └── ui/            # 游戏 UI（投票面板、时针投票等）
│   └── ui/                # 通用 UI 组件
│       └── layout/        # 布局组件
├── config/                # 配置文件
│   └── gameConfig.ts      # 功能开关配置
├── data/
│   └── characters/        # 角色数据
│       └── trouble-brewing.ts  # 暗流涌动剧本
├── hooks/                 # 自定义 Hooks
├── logic/                 # 纯逻辑层
│   ├── game/              # 游戏结束判定
│   ├── machines/          # XState 状态机
│   ├── night/             # 夜晚行动逻辑
│   └── stores/            # Zustand Stores
├── test/                  # 集成测试
├── types/                 # TypeScript 类型定义
└── utils/                 # 工具函数
```

## 功能开关配置

通过 `src/config/gameConfig.ts` 配置可选功能：

| 功能 | 说明 | 默认值 |
|------|------|--------|
| `clockwiseVoting` | 时针投票模式 - 按座位顺序投票 | `false` |
| `aiAssistant` | AI 辅助 - 角色分配建议 | `false` |
| `debugMode` | 调试模式 - 显示额外信息 | `false` |
| `quickFirstNight` | 快速首夜 - 跳过无行动角色 | `true` |
| `autoSave` | 自动保存 - 保存到本地存储 | `true` |
| `soundEffects` | 音效 | `true` |
| `animations` | 动画效果 | `true` |
| `ghostsCanSeeRoles` | 幽灵可见角色 | `false` |
| `verboseHistory` | 详细日志 | `false` |
| `realtimeSync` | 实时同步 (Supabase) | `false` |

## 支持的角色

### 暗流涌动剧本 (Trouble Brewing)

#### 镇民
- 洗衣妇、图书馆员、调查员、厨师
- 共情者、占卜师、掘墓人、僧侣
- 守鸦人、处女、杀手、士兵、市长

#### 外来者
- 管家、酒鬼、隐士、圣徒

#### 爪牙
- 投毒者、间谍、猩红女郎、男爵

#### 恶魔
- 小恶魔

## 架构原则

### 状态管理分层

- **XState**：游戏核心逻辑（回合、阵营、胜负判定）
- **Zustand**：UI 状态（菜单开关、视图模式）

### 类型安全

- 全项目 TypeScript 严格模式
- 所有游戏逻辑有完整类型定义

### 测试策略

- 单元测试：工具函数、状态机
- 组件测试：React 组件交互
- 集成测试：完整游戏流程

## 开发规范

- 使用函数式组件 + Hooks
- 优先使用 `const` 声明
- 使用 `cn()` 工具合并 className
- 组件使用 PascalCase
- Hooks 使用 camelCase，以 `use` 开头

## 相关资源

- [Blood on the Clocktower Wiki](https://wiki.bloodontheclocktower.com/)
- [React 19 文档](https://react.dev/)
- [XState v5](https://stately.ai/docs/xstate)
- [Vitest](https://vitest.dev/)

---

**Grimoire Aether** - 数字化说书人助手
