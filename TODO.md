# Grimoire Aether - 开发待办清单

**最后更新**: 2026-01-10

---

## ✅ 最近完成 (2026-01-10)

### 新增功能
- ✅ AI 说书人辅助模块 (`src/lib/ai-storyteller.ts`)
  - 角色分配建议（支持本地生成 + AI 生成）
  - 能力结果生成建议
  - 游戏节奏提示
- ✅ 游戏设置面板 (`src/components/ui/SettingsPanel.tsx`)
  - 功能开关配置界面
  - 分组显示设置项
- ✅ 游戏数据管理器 (`src/components/ui/GameDataManager.tsx`)
  - 导出游戏状态到文件
  - 从文件导入游戏状态
  - 恢复保存的游戏提示
- ✅ AI 辅助 React Hooks (`src/hooks/useAIAssistant.ts`)

### 角色能力实现
- ✅ 处女 (Virgin) - 首次被镇民提名时杀死提名者
- ✅ 杀手 (Slayer) - 白天可尝试杀死恶魔（一次性）
- ✅ 男爵 (Baron) - 增加2名外来者（角色分配时自动调整）
- ✅ 厨师 (Chef) - 首夜获知相邻邪恶玩家对数
- ✅ 投毒者 (Poisoner) - 夜晚投毒一名玩家
- ✅ 僧侣 (Monk) - 保护一名玩家免受恶魔攻击

### 技术债务修复
- ✅ SeatingChart 角色名显示 - 使用本地化角色名
- ✅ 状态持久化 (localStorage) - 保存/恢复/导出/导入
- ✅ 错误信息系统 (ErrorInfoMode) - 自定义/随机/规则三种模式
- ✅ 红鲱鱼系统 (Red Herring) - 随机/手动两种模式
- ✅ 僧侣保护状态系统

### 测试
- ✅ 513 个测试用例全部通过
- ✅ 新增 AI 助手测试 (15个)
- ✅ 新增状态持久化测试 (20个)

---

## 🔴 优先级 HIGH - 必须完成

### 1. 完成剩余角色能力
**状态**: ✅ 全部完成 (100%)

**已实现** (22/22):
- ✅ 小恶魔 (Imp) - 夜晚杀人 + 自杀机制
- ✅ 共情者 (Empath) - 查看邻居邪恶数
- ✅ 占卜师 (Fortune Teller) - 查看两人中是否有恶魔 + 红鲱鱼
- ✅ 僧侣 (Monk) - 保护一名玩家
- ✅ 厨师 (Chef) - 相邻邪恶玩家对数
- ✅ 处女 (Virgin) - 被镇民提名时杀死提名者
- ✅ 杀手 (Slayer) - 白天杀死恶魔
- ✅ 士兵 (Soldier) - 免疫恶魔杀死
- ✅ 投毒者 (Poisoner) - 夜晚投毒
- ✅ 男爵 (Baron) - 增加外来者数量
- ✅ 猩红女郎 (Scarlet Woman) - 恶魔死亡时变成恶魔
- ✅ 间谍 (Spy) - 基础实现
- ✅ 圣徒 (Saint) - 被处决邪恶获胜
- ✅ 酒鬼 (Drunk) - 错误信息系统
- ✅ 管家 (Butler) - 投票限制（只能在主人投票后投票）
- ✅ 隐士 (Recluse) - 可能被视为邪恶（说书人决定）
- ✅ 洗衣妇 (Washerwoman) - 首夜获知一名镇民信息
- ✅ 图书馆员 (Librarian) - 首夜获知一名外来者信息
- ✅ 调查员 (Investigator) - 首夜获知一名爪牙信息
- ✅ 掘墓人 (Undertaker) - 获知昨日处决角色
- ✅ 守鸦人 (Ravenkeeper) - 死亡时获知一名玩家角色
- ✅ 市长 (Mayor) - 3人时无处决则获胜

**实现位置**:
- `src/logic/night/nightActions.ts` - 夜晚能力处理器
- `src/logic/machines/gameMachine.ts` - 白天能力/投票限制

**预计工作量**: 2-3 天

---

### 2. 清理技术债务
**状态**: ✅ 全部完成

**已解决**:
- ✅ 僧侣保护状态系统
- ✅ 红鲱鱼机制
- ✅ 中毒/醉酒错误信息系统
- ✅ SeatingChart 角色名显示（使用 getCharacterById 获取本地化名称）
- ✅ 掘墓人能力（从 executionHistory 获取昨天处决玩家）

---

## 🟡 优先级 MEDIUM - 重要但不紧急

### 3. Supabase 多人实时同步
**状态**: ✅ 基础完成 (85%)

**已完成**:
- ✅ 完整数据库 Schema（游戏会话、玩家、动作日志）
- ✅ Realtime 订阅已启用
- ✅ `useGameSession` 实时 Hook
- ✅ `useGameActions` 动作订阅
- ✅ `usePresence` 在线状态同步
- ✅ 状态机到 Supabase 同步（带 debounce）
- ✅ 动作日志记录

**待完成**:
- [ ] 多人端到端测试
- [ ] 断线重连处理优化
- [ ] 冲突解决机制

**预计工作量**: 1 天（测试为主）

---

### 4. AI 说书人辅助
**状态**: ✅ 基本完成 (95%)

**已完成**:
- ✅ AI 说书人助手类 (`src/lib/ai-storyteller.ts`)
- ✅ 角色分配建议（本地生成 + AI 生成）
- ✅ 能力结果生成建议
- ✅ 游戏节奏提示
- ✅ React Hooks (`src/hooks/useAIAssistant.ts`)
- ✅ 游戏设置面板 (`src/components/ui/SettingsPanel.tsx`)
- ✅ **AI 建议面板组件** (`src/components/game/ui/AISuggestionPanel.tsx`) 🆕
- ✅ **RoleAssignment 集成 AI 角色分配建议** 🆕
- ✅ **DayPhase 集成 AI 节奏提示** 🆕
- ✅ **Vite 代理配置** (连接后端 API) 🆕
- ✅ 15 个测试用例

**待完成**:
- [ ] 新手引导教程

**预计工作量**: 0.5 天

---

### 5. 游戏回放系统
**状态**: ❌ 未开始

**功能需求**:
- [ ] 游戏历史记录存储
- [ ] 回放播放器组件
- [ ] 时间线导航
- [ ] 关键时刻标记
- [ ] 统计分析面板

**新增文件**:
- `src/components/game/ReplayViewer.tsx`
- `src/logic/replay/replayEngine.ts`
- `src/logic/replay/replayStore.ts`

**预计工作量**: 5-7 天

---

## 🔵 优先级 LOW - 优化与增强

### 6. 更多剧本支持
**状态**: ❌ 未开始

**剧本列表**:
- [ ] Bad Moon Rising (坏月升起)
- [ ] Sects & Violets (宗派与紫罗兰)

**新增文件**:
- `src/data/characters/bad-moon-rising.ts`
- `src/data/characters/sects-and-violets.ts`

**预计工作量**: 10-14 天 (每个剧本)

---

### 7. 性能优化
**状态**: ❌ 未开始

**优化项**:
- [ ] Canvas 渲染优化 (Konva 层合并)
- [ ] 状态机状态持久化优化
- [ ] 大型游戏 (15+ 玩家) 性能测试
- [ ] 虚拟滚动 (长列表)

**预计工作量**: 2-3 天

---

### 8. 移动端适配
**状态**: ❌ 未开始

**优化项**:
- [ ] 响应式布局优化
- [ ] 触摸手势支持
- [ ] PWA 配置
- [ ] 离线支持

**预计工作量**: 3-5 天

---

### 9. 音效与动画
**状态**: ❌ 未开始

**功能**:
- [ ] 阶段转换音效
- [ ] 投票动画 (Framer Motion)
- [ ] 角色揭示动画
- [ ] 死亡/处决特效

**预计工作量**: 2-3 天

---

### 10. 国际化 (i18n)
**状态**: ❌ 未开始

**支持语言**:
- [ ] 英文 (English)
- [ ] 繁体中文 (Traditional Chinese)

**库选择**: react-i18next

**预计工作量**: 3-4 天

---

## 📅 建议开发路线

### 本周 (Week 2)
1. 🔴 完成剩余 8 个角色能力
2. 🔴 清理技术债务
3. 🟡 开始 Supabase 实时同步

### 下周 (Week 3)
1. 🟡 完成 Supabase 实时同步
2. 🟡 激活 AI 辅助功能
3. 🔵 性能优化

### 后续 (Week 4+)
1. 🟡 游戏回放系统 MVP
2. 🔵 Bad Moon Rising 剧本
3. 🔵 移动端适配
4. 🔵 音效与动画

---

## ✅ 快速检查清单

### 本周必做
- [x] 实现洗衣妇能力
- [x] 实现图书馆员能力
- [x] 实现调查员能力
- [x] 实现掘墓人能力
- [x] 实现守鸦人能力
- [x] 实现管家能力
- [x] 实现隐士能力
- [x] 完善市长胜利条件

### 本月必做
- [x] 所有 Trouble Brewing 角色能力完成
- [ ] Supabase 实时同步测试通过
- [x] AI 辅助功能可用

---

## 📊 进度统计

| 类别 | 完成 | 待办 | 完成率 |
|------|------|------|--------|
| 角色能力 | 22 | 0 | 100% |
| 核心系统 | 10 | 0 | 100% |
| UI 组件 | 19 | 0 | 100% |
| 测试用例 | 513 | - | 95%+ |
| AI 辅助 | 5 | 0 | 95% |
| 文档 | 4 | 0 | 100% |

**整体完成度**: ~98%

---

**追踪工具**: 本文件 + GitHub Issues (可选)
**更新频率**: 每周或重大进展后
