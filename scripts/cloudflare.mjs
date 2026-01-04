#!/usr/bin/env node
/**
 * Cloudflare Pages 部署和日志检查脚本
 *
 * 使用方法：
 *   npm run cf:status    - 检查部署状态
 *   npm run cf:deploy    - 部署到 Cloudflare Pages
 *   npm run cf:logs      - 查看最新日志
 *   npm run cf:list      - 列出所有部署
 */

import { execSync } from 'child_process';

const command = process.argv[2] || 'help';
const projectName = 'grimoire-aether';

function run(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    console.error(`❌ 命令执行失败: ${cmd}`);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

function checkLogin() {
  try {
    execSync('npx wrangler whoami', { stdio: 'pipe' });
    return true;
  } catch {
    console.log('⚠️  未登录 Cloudflare，请先运行: npm run cf:login');
    return false;
  }
}

switch (command) {
  case 'login':
    console.log('🔐 正在登录 Cloudflare...');
    run('npx wrangler login');
    break;

  case 'logout':
    console.log('👋 正在登出...');
    run('npx wrangler logout');
    break;

  case 'status':
    if (!checkLogin()) break;
    console.log('📊 检查项目状态...');
    run(`npx wrangler pages project list`);
    break;

  case 'deploy':
    if (!checkLogin()) break;
    console.log('🚀 开始部署到 Cloudflare Pages...');
    console.log('📦 正在构建...');
    run('npm run build');
    console.log('☁️  正在上传...');
    run(`npx wrangler pages deploy dist --project-name=${projectName}`);
    break;

  case 'logs':
    if (!checkLogin()) break;
    console.log('📋 获取最新部署日志...');
    run(`npx wrangler pages deployment list --project-name=${projectName}`);
    break;

  case 'list':
    if (!checkLogin()) break;
    console.log('📜 列出所有部署...');
    run(`npx wrangler pages deployment list --project-name=${projectName}`);
    break;

  case 'tail':
    if (!checkLogin()) break;
    console.log('🔍 实时查看日志...');
    run(`npx wrangler pages deployment tail --project-name=${projectName}`);
    break;

  case 'info':
    if (!checkLogin()) break;
    console.log('ℹ️  获取项目信息...');
    run(`npx wrangler pages project view ${projectName}`);
    break;

  case 'env':
    if (!checkLogin()) break;
    console.log('🔧 管理环境变量...');
    console.log('\n使用以下命令管理环境变量:');
    console.log(`  npx wrangler pages secret put VITE_SUPABASE_URL --project-name=${projectName}`);
    console.log(`  npx wrangler pages secret put VITE_SUPABASE_ANON_KEY --project-name=${projectName}`);
    console.log(`  npx wrangler pages secret list --project-name=${projectName}`);
    break;

  case 'help':
  default:
    console.log(`
🎮 Grimoire Aether - Cloudflare Pages 管理工具

使用方法:
  npm run cf:login     - 登录 Cloudflare 账号
  npm run cf:logout    - 登出账号
  npm run cf:status    - 检查项目状态
  npm run cf:deploy    - 构建并部署到生产环境
  npm run cf:logs      - 查看部署历史
  npm run cf:list      - 列出所有部署
  npm run cf:tail      - 实时查看日志（需要部署运行中）
  npm run cf:info      - 查看项目详细信息
  npm run cf:env       - 管理环境变量

首次使用:
  1. npm run cf:login                    # 登录
  2. npm run cf:deploy                   # 部署
  3. 在 Cloudflare Dashboard 设置环境变量
  4. npm run cf:logs                     # 查看状态

文档: https://developers.cloudflare.com/pages/
    `);
    break;
}
