# Cloudflare Pages 部署指南

本项目提供完整的 Cloudflare CLI 工具支持，可以通过命令行完成部署、状态检查和日志查看。

## 📋 目录

- [快速开始](#快速开始)
- [CLI 命令](#cli-命令)
- [环境变量配置](#环境变量配置)
- [部署流程](#部署流程)
- [日志查看](#日志查看)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 1. 登录 Cloudflare 账号

```bash
npm run cf:login
```

这将打开浏览器让你登录 Cloudflare 账号并授权 Wrangler CLI。

### 2. 部署项目

```bash
npm run cf:deploy
```

这个命令会：
1. 运行 `npm run build` 构建项目
2. 上传 `dist/` 目录到 Cloudflare Pages
3. 自动创建或更新 `grimoire-aether` 项目

### 3. 查看部署状态

```bash
npm run cf:status
```

---

## 🛠️ CLI 命令

### 账号管理

```bash
# 登录 Cloudflare
npm run cf:login

# 登出
npm run cf:logout
```

### 部署管理

```bash
# 构建并部署到生产环境
npm run cf:deploy

# 查看项目状态
npm run cf:status

# 查看项目详细信息
npm run cf:info
```

### 日志和调试

```bash
# 查看部署历史
npm run cf:logs

# 列出所有部署
npm run cf:list

# 实时查看日志（需要部署正在运行）
npm run cf:tail
```

### 环境变量

```bash
# 查看环境变量管理说明
npm run cf:env
```

然后使用以下命令管理环境变量：

```bash
# 设置环境变量
npx wrangler pages secret put VITE_SUPABASE_URL --project-name=grimoire-aether
npx wrangler pages secret put VITE_SUPABASE_ANON_KEY --project-name=grimoire-aether

# 列出所有环境变量（仅显示名称，不显示值）
npx wrangler pages secret list --project-name=grimoire-aether

# 删除环境变量
npx wrangler pages secret delete VARIABLE_NAME --project-name=grimoire-aether
```

### 帮助

```bash
# 显示所有可用命令
npm run cf:help
```

---

## 🔧 环境变量配置

### 必需的环境变量

项目需要以下环境变量才能正常运行：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 配置方式

#### 方式 1: 通过 CLI（推荐）

```bash
npx wrangler pages secret put VITE_SUPABASE_URL --project-name=grimoire-aether
# 输入你的 Supabase URL 并回车

npx wrangler pages secret put VITE_SUPABASE_ANON_KEY --project-name=grimoire-aether
# 输入你的 Supabase Anon Key 并回车
```

#### 方式 2: 通过 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages → grimoire-aether
3. Settings → Environment variables
4. 添加变量（Production 和 Preview 都要设置）

---

## 📦 部署流程

### 完整部署流程

```bash
# 1. 确保代码已提交
git add .
git commit -m "feat: your changes"

# 2. 运行测试
npm test

# 3. 类型检查
npm run typecheck

# 4. 构建测试
npm run build

# 5. 登录 Cloudflare（首次）
npm run cf:login

# 6. 部署
npm run cf:deploy

# 7. 查看部署状态
npm run cf:logs
```

### 部署到预览环境

```bash
# 构建
npm run build

# 部署到预览
npx wrangler pages deploy dist --project-name=grimoire-aether --branch=preview
```

---

## 📊 日志查看

### 查看部署历史

```bash
npm run cf:logs
```

输出示例：
```
Production
┌────────┬──────────────────┬──────────┬──────────┐
│ ID     │ Created          │ Modified │ Source   │
├────────┼──────────────────┼──────────┼──────────┤
│ abc123 │ 2026-01-04 18:00 │ Success  │ CLI      │
│ def456 │ 2026-01-04 17:30 │ Success  │ Git      │
└────────┴──────────────────┴──────────┴──────────┘
```

### 实时查看日志

```bash
npm run cf:tail
```

这会显示实时请求日志：
```
GET https://grimoire-aether.pages.dev/ 200 OK
GET https://grimoire-aether.pages.dev/game/abc123 200 OK
```

### 查看特定部署的详细信息

```bash
# 列出所有部署
npm run cf:list

# 查看特定部署详情
npx wrangler pages deployment view <deployment-id> --project-name=grimoire-aether
```

---

## 🔍 故障排查

### 问题 1: 登录失败

**症状**: `npm run cf:login` 失败或超时

**解决方案**:
```bash
# 清除缓存
npx wrangler logout
rm -rf ~/.wrangler
npm run cf:login
```

### 问题 2: 构建失败

**症状**: `npm run cf:deploy` 在构建阶段失败

**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查错误信息
npm run typecheck

# 清除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 问题 3: 环境变量未生效

**症状**: 部署成功但应用无法连接 Supabase

**解决方案**:
```bash
# 1. 检查环境变量是否设置
npx wrangler pages secret list --project-name=grimoire-aether

# 2. 重新设置环境变量
npx wrangler pages secret put VITE_SUPABASE_URL --project-name=grimoire-aether
npx wrangler pages secret put VITE_SUPABASE_ANON_KEY --project-name=grimoire-aether

# 3. 重新部署（触发新构建）
npm run cf:deploy
```

### 问题 4: 路由 404

**症状**: 刷新页面出现 404 错误

**解决方案**: 确认 `public/_redirects` 文件存在并包含：
```
/* /index.html 200
```

如果文件不存在：
```bash
echo "/* /index.html 200" > public/_redirects
npm run cf:deploy
```

### 问题 5: 无法访问日志

**症状**: `npm run cf:tail` 无输出

**解决方案**:
- 确保网站有实际访问流量
- 实时日志只显示正在发生的请求
- 使用 `npm run cf:logs` 查看历史部署

---

## 📚 常用命令速查

```bash
# 🔐 账号
npm run cf:login          # 登录
npm run cf:logout         # 登出

# 🚀 部署
npm run cf:deploy         # 部署到生产
npm run cf:status         # 查看状态
npm run cf:info           # 项目详情

# 📊 日志
npm run cf:logs           # 部署历史
npm run cf:list           # 所有部署
npm run cf:tail           # 实时日志

# 🔧 配置
npm run cf:env            # 环境变量帮助
npm run cf:help           # 显示帮助
```

---

## 🔗 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [项目仓库](https://github.com/Shallow-dusty/Grimoire-Aether)

---

## 💡 最佳实践

1. **使用 Git 工作流**:
   - 在 GitHub 上配置 Cloudflare Pages
   - 每次 push 到 main 分支自动部署
   - PR 自动创建预览环境

2. **环境隔离**:
   - Production: main 分支
   - Preview: 其他分支

3. **监控部署**:
   - 部署后运行 `npm run cf:logs` 检查状态
   - 设置 Cloudflare 通知接收部署状态

4. **版本管理**:
   - 每次部署前确保代码已提交
   - 使用有意义的 commit message
   - 标记重要版本的 Git tag

5. **性能优化**:
   - 定期检查构建产物大小
   - 使用 CDN 缓存策略
   - 启用 Cloudflare 性能优化功能

---

## 🎯 下一步

- ✅ 配置 Cloudflare Pages
- ✅ 设置环境变量
- ✅ 完成首次部署
- ⏳ 设置自定义域名（可选）
- ⏳ 配置 Web Analytics（可选）
- ⏳ 设置访问策略（可选）
