# 环境变量检查脚本使用指南

## 📝 概述

本项目提供了三种环境变量检查脚本，用于验证您的 `.env` 文件是否正确配置。

## 🚀 使用方法

### 方法 1: Node.js 版本（推荐）

```bash
npm run check-env
```

**优点**：跨平台，输出格式化良好

### 方法 2: PowerShell 版本（Windows）

```bash
npm run check-env:ps
```

**优点**：Windows 原生，彩色输出

### 方法 3: 批处理版本（Windows）

```bash
npm run check-env:bat
```

**优点**：最简单，无需额外依赖

## ✅ 检查项目

脚本会检查以下环境变量：

### 必需配置

1. **VITE_SUPABASE_URL** - Supabase 项目 URL
   - 示例: `https://your-project.supabase.co`

2. **VITE_SUPABASE_ANON_KEY** - Supabase 匿名密钥
   - 示例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 可选配置

3. **VITE_AI_API_URL** - AI API 端点
   - 示例: `https://api.your-ai-service.com`

## 📋 初次配置步骤

1. **复制模板文件**
   ```bash
   copy .env.example .env
   ```

2. **编辑 .env 文件** 使用您喜欢的编辑器打开 `.env` 并填入实际值：

   ```env
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   VITE_SUPABASE_ANON_KEY=你的实际密钥
   VITE_AI_API_URL=你的AI API地址
   ```

3. **运行检查**
   ```bash
   npm run check-env
   ```

## 🎯 输出说明

### ✅ 成功

```
环境检查通过！所有配置正确
```

可以开始开发了！

### ❌ 失败

```
环境检查失败！发现 X 个错误
```

请根据提示修复 `.env` 文件中的配置

### ⚠️ 警告

```
环境检查通过（有警告）
```

可选变量未配置，不影响基本功能但建议配置

## 🔧 故障排除

### 问题 1: .env 文件不存在

**解决方案**: 从 `.env.example` 复制一份

```bash
copy .env.example .env
```

### 问题 2: 变量显示"使用占位符"

**解决方案**: 将占位符文本替换为实际的 URL 或密钥

### 问题 3: PowerShell 脚本报错

**解决方案**: 使用 Node.js 版本或批处理版本

```bash
npm run check-env
```

## 📚 相关资源

- [Supabase 控制台](https://supabase.com/dashboard) - 获取您的项目 URL 和密钥
- [项目 README](../README.md) - 完整项目文档

---

**提示**: 在每次克隆项目或更新环境配置后，运行检查脚本以确保配置正确！
