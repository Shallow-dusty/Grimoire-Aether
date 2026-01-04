# 时针投票机制设计文档

## 概述

时针投票（Clockwise Voting）是 Blood on the Clocktower 实体游戏中的核心投票方式，旨在提供更真实、更具仪式感的投票体验。

## 当前实现 vs 时针投票

### 当前 VotingPanel 实现
- **并行投票**：说书人可以同时看到所有玩家，随意点击任何玩家的投票按钮
- **无顺序**：投票顺序不固定，说书人可以跳过某些玩家
- **即时显示**：所有投票按钮同时可见

### 时针投票机制
- **顺序投票**：从指定玩家开始，按照顺时针顺序逐个询问
- **当前玩家**：每次只有一个"当前投票玩家"，完成后才能进入下一个
- **仪式感**：模拟实体游戏中说书人逐个询问的过程

## 核心功能

### 1. 投票顺序管理
```typescript
// 投票顺序：从起始玩家开始，顺时针排列
const voteOrder: PlayerId[] = [
    'p3', 'p4', 'p5', 'p1', 'p2' // 假设从 p3 开始
];

// 当前投票索引
const currentVoteIndex: number = 0; // 当前为 p3
```

**起始玩家规则**：
- 默认：提名者的下一位顺时针玩家
- 可选：说书人手动指定起始玩家

### 2. 当前投票玩家指示器
- **视觉高亮**：当前投票玩家在座位图上放大、发光、动画效果
- **箭头指示**：指向当前投票玩家的动画箭头
- **名称强调**：当前玩家名称使用大字号、高亮颜色

### 3. 投票历史时间线
```typescript
interface VoteRecord {
    playerId: PlayerId;
    playerName: string;
    vote: boolean; // true = 赞成, false = 反对
    timestamp: number;
    order: number; // 投票顺序（1, 2, 3...）
}

const voteHistory: VoteRecord[] = [
    { playerId: 'p3', playerName: '玩家3', vote: true, timestamp: 1704326400000, order: 1 },
    { playerId: 'p4', playerName: '玩家4', vote: false, timestamp: 1704326405000, order: 2 }
];
```

**显示方式**：
- 横向时间线，从左到右按投票顺序排列
- 每个投票显示玩家名称、投票结果图标、顺序编号

### 4. 座位图集成

**座位图状态**：
- **未投票**：灰色、半透明
- **当前投票**：高亮、放大 1.2 倍、发光边框
- **已投票（赞成）**：绿色边框、✓ 图标
- **已投票（反对）**：红色边框、✗ 图标

**动画效果**：
- 投票完成后，高亮效果移动到下一位玩家（顺时针）
- 使用 Framer Motion 的 layout 动画实现平滑过渡

### 5. 说书人控制界面

```
┌─────────────────────────────────────┐
│  当前投票：玩家3                     │
│  [赞成按钮]  [反对按钮]              │
│  [← 上一位]  [下一位 →]              │
│  [结束投票]                         │
└─────────────────────────────────────┘
```

**控制按钮**：
- **赞成/反对**：为当前玩家记录投票
- **下一位**：前进到下一个顺时针玩家（仅在当前玩家已投票后启用）
- **上一位**：后退到上一个玩家（允许修改之前的投票）
- **结束投票**：提前结束投票流程（仅在所有玩家投票完成后启用）

### 6. 玩家视角

**显示内容**：
- 当前投票进度：「3 / 7 人已投票」
- 自己的投票状态：   - 未投票：「等待说书人询问你的投票...」
   - 已投票：「你已投票：赞成 ✓」

**不显示**：
- 其他玩家的具体投票结果（保持神秘感）
- 当前投票玩家是谁（避免影响决策）

## 数据结构设计

### 状态机 Context 扩展
```typescript
interface GameContext {
    // ... 现有字段

    // 时针投票专用字段
    clockwiseVoting: {
        enabled: boolean; // 是否启用时针投票模式
        voteOrder: PlayerId[]; // 投票顺序数组
        currentVoteIndex: number; // 当前投票索引（0-based）
        votes: Record<PlayerId, boolean | null>; // 投票记录（null = 未投票）
        startPlayerId: PlayerId | null; // 起始玩家
    } | null;
}
```

### 组件 Props
```typescript
interface ClockwiseVotingProps {
    /** 所有玩家 */
    players: Array<{
        id: PlayerId;
        name: string;
        isDead: boolean;
        isGhost: boolean;
        hasUsedGhostVote: boolean;
        seatPosition: number; // 座位位置（0-based，用于圆形布局）
    }>;

    /** 提名者 ID */
    nominatorId: PlayerId;

    /** 被提名者 ID */
    nomineeId: PlayerId;

    /** 投票顺序（顺时针玩家列表） */
    voteOrder: PlayerId[];

    /** 当前投票索引 */
    currentVoteIndex: number;

    /** 投票记录 */
    votes: Record<PlayerId, boolean | null>;

    /** 投票回调 */
    onVote: (voterId: PlayerId, voteFor: boolean) => void;

    /** 前进到下一位 */
    onNext: () => void;

    /** 后退到上一位 */
    onPrevious: () => void;

    /** 结束投票 */
    onEndVoting: () => void;

    /** 是否为说书人 */
    isStoryteller: boolean;

    /** 当前玩家 ID（玩家视角） */
    currentPlayerId?: PlayerId;
}
```

## UI 布局设计

### 整体布局
```
┌────────────────────────────────────────┐
│  提名信息：玩家2 提名 玩家5            │
│  投票计数：赞成 2 | 反对 1 | 待投 4    │
├────────────────────────────────────────┤
│                                        │
│         ┌──────────────────┐          │
│         │   座位图可视化    │          │
│         │  (圆形布局，当前  │          │
│         │   玩家高亮)      │          │
│         └──────────────────┘          │
│                                        │
│  投票历史时间线：                      │
│  [1] 玩家3 ✓  [2] 玩家4 ✗  ...        │
├────────────────────────────────────────┤
│  当前投票：玩家5                       │
│  [✓ 赞成]  [✗ 反对]                   │
│  [← 上一位]  [下一位 →]  [结束投票]    │
└────────────────────────────────────────┘
```

### 座位图圆形布局

**SVG 实现**（使用 Konva 或纯 SVG）：
- 圆心：屏幕中央
- 半径：300px
- 玩家位置：按座位编号均匀分布在圆周上

```typescript
// 计算玩家位置（极坐标转笛卡尔坐标）
function getPlayerPosition(seatIndex: number, totalPlayers: number) {
    const angle = (seatIndex / totalPlayers) * 2 * Math.PI - Math.PI / 2; // 从顶部开始
    const radius = 300;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle };
}
```

**玩家令牌**：
- 圆形头像（直径 60px）
- 边框颜色和粗细根据状态变化
- 投票图标（✓ 或 ✗）显示在令牌右上角

### 投票历史时间线

**布局**：
- 横向滚动条（如果玩家过多）
- 每个投票记录宽度 120px
- 显示：顺序编号、玩家名称、投票图标

**样式**：
```css
.vote-record {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    border: 2px solid;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.3);
}

.vote-record.for {
    border-color: #10b981; /* emerald-500 */
    background: rgba(16, 185, 129, 0.1);
}

.vote-record.against {
    border-color: #ef4444; /* red-500 */
    background: rgba(239, 68, 68, 0.1);
}
```

## 动画效果

### 1. 当前玩家高亮动画
```typescript
// Framer Motion variants
const currentPlayerVariants = {
    idle: {
        scale: 1,
        boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)'
    },
    active: {
        scale: 1.2,
        boxShadow: '0 0 20px 10px rgba(251, 191, 36, 0.5)',
        transition: {
            duration: 0.3,
            repeat: Infinity,
            repeatType: 'reverse'
        }
    }
};
```

### 2. 投票完成过渡动画
```typescript
// 投票完成后，高亮效果移动到下一位玩家
const handleVoteComplete = () => {
    // 1. 当前玩家缩小、显示投票图标
    // 2. 延迟 300ms
    // 3. 下一位玩家高亮、放大
};
```

### 3. 投票历史添加动画
```typescript
// 新投票记录从右侧滑入
const voteRecordVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4 }
    }
};
```

## 实现步骤

### Week 1.4 - 设计时针投票机制（当前任务）
- [x] 完成设计文档
- [ ] 设计 UI 原型（Figma 或手绘草图）
- [ ] 确定数据结构和 API
- [ ] 评审和用户反馈

### Week 1.5 - 实现 ClockwiseVoting.tsx
- [ ] 创建组件文件和基础结构
- [ ] 实现座位图圆形布局
- [ ] 实现当前玩家高亮效果
- [ ] 实现投票历史时间线
- [ ] 实现说书人控制界面
- [ ] 实现玩家视角

### Week 1.6 - 集成时针投票流程
- [ ] 扩展状态机 Context
- [ ] 添加 CLOCKWISE_VOTE 相关事件
- [ ] 在 DayPhase 中集成 ClockwiseVoting
- [ ] 添加配置选项（启用/禁用时针投票）
- [ ] 编写集成测试

## 技术栈

- **React**: 组件框架
- **Framer Motion**: 动画效果
- **Tailwind CSS**: 样式
- **XState v5**: 状态管理
- **TypeScript**: 类型安全

## 用户体验优势

### 相比当前 VotingPanel 的改进
1. **更真实**：模拟实体游戏的投票流程
2. **更专注**：每次只关注一个玩家，减少认知负担
3. **更公平**：强制按顺序投票，避免说书人偏见
4. **更有仪式感**：投票过程更具戏剧性和紧张感
5. **更易追踪**：投票历史时间线清晰显示投票顺序

### 保留灵活性
- **可配置**：说书人可以选择使用传统并行投票或时针投票
- **可后退**：允许说书人修改之前的投票（处理误操作）
- **可跳过**：如果某个玩家不在线，说书人可以手动跳过

## 未来扩展

1. **音效**：投票时播放"咚"的音效
2. **语音提示**：「现在轮到玩家3投票」
3. **投票统计**：显示每个玩家的历史投票倾向
4. **重播功能**：游戏结束后回放投票过程

## 参考资料

- Blood on the Clocktower 官方规则书
- 实体游戏投票流程视频
- 社区反馈和建议

---

**作者**: Claude Sonnet 4.5
**日期**: 2026-01-05
**版本**: 1.0
