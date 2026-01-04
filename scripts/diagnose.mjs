#!/usr/bin/env node
/**
 * 项目诊断工具
 * 检查项目各项配置是否正常
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Grimoire Aether - 项目诊断工具\n');

const checks = [];
let hasErrors = false;

function check(name, fn) {
  checks.push({ name, fn });
}

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    return null;
  }
}

// ============================================================
// 检查项
// ============================================================

check('环境变量配置', () => {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) {
    return { status: '❌', message: '.env 文件不存在！请复制 .env.example 并配置' };
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('your_supabase_url');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.includes('your_supabase_anon_key');

  if (!hasSupabaseUrl || !hasSupabaseKey) {
    return { status: '⚠️', message: 'Supabase 环境变量未配置或使用占位符' };
  }

  return { status: '✅', message: 'Supabase 环境变量已配置' };
});

check('依赖安装', () => {
  if (!fs.existsSync('node_modules')) {
    return { status: '❌', message: 'node_modules 不存在，请运行: npm install' };
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredDeps = ['react', 'react-dom', '@supabase/supabase-js', 'xstate', 'vite'];
  const missingDeps = requiredDeps.filter(dep => !fs.existsSync(`node_modules/${dep}`));

  if (missingDeps.length > 0) {
    return { status: '⚠️', message: `缺少依赖: ${missingDeps.join(', ')}` };
  }

  return { status: '✅', message: '所有依赖已安装' };
});

check('TypeScript 类型检查', () => {
  const result = run('npm run typecheck 2>&1', true);
  if (result === null) {
    return { status: '❌', message: 'TypeScript 类型检查失败' };
  }
  return { status: '✅', message: 'TypeScript 类型检查通过' };
});

check('构建测试', () => {
  console.log('\n  正在测试构建... (可能需要几秒)');
  const result = run('npm run build 2>&1', true);
  if (result === null) {
    return { status: '❌', message: '构建失败，请检查错误日志' };
  }

  if (!fs.existsSync('dist/index.html')) {
    return { status: '❌', message: '构建输出不完整' };
  }

  const distSize = fs.readdirSync('dist/assets').reduce((total, file) => {
    const stats = fs.statSync(`dist/assets/${file}`);
    return total + stats.size;
  }, 0);

  const sizeMB = (distSize / 1024 / 1024).toFixed(2);
  return { status: '✅', message: `构建成功 (${sizeMB} MB)` };
});

check('Supabase 连接', () => {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);

  if (!urlMatch || !urlMatch[1]) {
    return { status: '⚠️', message: '无法读取 Supabase URL' };
  }

  const supabaseUrl = urlMatch[1].trim();

  try {
    const result = run(`curl -s -o /dev/null -w "%{http_code}" ${supabaseUrl}/rest/v1/`, true);
    const statusCode = result?.trim();

    if (statusCode === '200' || statusCode === '401') {
      return { status: '✅', message: 'Supabase 服务可访问' };
    } else {
      return { status: '⚠️', message: `Supabase 响应异常 (${statusCode})` };
    }
  } catch {
    return { status: '⚠️', message: 'Supabase 连接测试失败（可能是网络问题）' };
  }
});

check('Git 状态', () => {
  const status = run('git status --porcelain', true);
  if (status === null) {
    return { status: '⚠️', message: '不是 Git 仓库或 Git 不可用' };
  }

  const uncommittedFiles = status.trim().split('\n').filter(line => line.trim()).length;

  if (uncommittedFiles === 0) {
    return { status: '✅', message: '工作区干净，所有更改已提交' };
  } else {
    return { status: 'ℹ️', message: `有 ${uncommittedFiles} 个文件未提交` };
  }
});

check('测试套件', () => {
  console.log('\n  正在运行测试... (可能需要几秒)');
  const result = run('npm test -- --run 2>&1', true);

  if (result === null) {
    return { status: '❌', message: '测试执行失败' };
  }

  const passMatch = result.match(/(\d+) passed/);
  const failMatch = result.match(/(\d+) failed/);

  if (failMatch && parseInt(failMatch[1]) > 0) {
    return { status: '❌', message: `${failMatch[1]} 个测试失败` };
  }

  if (passMatch) {
    return { status: '✅', message: `${passMatch[1]} 个测试通过` };
  }

  return { status: '⚠️', message: '无法解析测试结果' };
});

check('Cloudflare 登录状态', () => {
  const result = run('npx wrangler whoami 2>&1', true);

  if (result === null || result.includes('Not logged in') || result.includes('ERROR')) {
    return { status: 'ℹ️', message: '未登录 Cloudflare (运行 npm run cf:login 登录)' };
  }

  const emailMatch = result.match(/email:\s*(.+)/i);
  if (emailMatch) {
    return { status: '✅', message: `已登录: ${emailMatch[1].trim()}` };
  }

  return { status: '✅', message: '已登录 Cloudflare' };
});

// ============================================================
// 运行检查
// ============================================================

console.log('开始诊断...\n');

for (const { name, fn } of checks) {
  process.stdout.write(`检查: ${name}... `);
  const result = fn();
  console.log(`${result.status} ${result.message}`);

  if (result.status === '❌') {
    hasErrors = true;
  }
}

// ============================================================
// 总结
// ============================================================

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ 发现问题，请根据上述提示修复\n');
  console.log('常见解决方案:');
  console.log('  1. 配置环境变量: 复制 .env.example 为 .env 并填写配置');
  console.log('  2. 安装依赖: npm install');
  console.log('  3. 运行测试: npm test');
  console.log('  4. 检查构建: npm run build');
  process.exit(1);
} else {
  console.log('✅ 所有检查通过！项目已就绪\n');
  console.log('下一步:');
  console.log('  本地开发: npm run dev');
  console.log('  部署到 Cloudflare: npm run cf:deploy');
  console.log('  查看帮助: npm run cf:help');
}
