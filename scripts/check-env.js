#!/usr/bin/env node

/**
 * 环境检查脚本
 * 验证所有必需的环境变量是否已配置
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// 图标
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  check: '🔍',
};

// 必需的环境变量
const requiredEnvVars = [
  {
    name: 'VITE_SUPABASE_URL',
    description: 'Supabase 项目 URL',
    example: 'https://your-project.supabase.co',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    description: 'Supabase 匿名密钥',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  {
    name: 'VITE_AI_API_URL',
    description: 'AI API 端点',
    example: 'https://api.your-ai-service.com',
    optional: true,
  },
];

/**
 * 打印带颜色的消息
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 打印带图标的消息
 */
function logIcon(icon, message, color = 'reset') {
  console.log(`${icons[icon]} ${colors[color]}${message}${colors.reset}`);
}

/**
 * 打印标题
 */
function printHeader() {
  console.log('\n' + '='.repeat(60));
  log(`${icons.rocket} Grimoire Aether - 环境变量检查${colors.reset}`, 'bold');
  console.log('='.repeat(60) + '\n');
}

/**
 * 读取 .env 文件
 */
function loadEnvFile() {
  const envPath = resolve(__dirname, '../.env');
  
  if (!existsSync(envPath)) {
    return null;
  }

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      // 跳过注释和空行
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }

      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });

    return envVars;
  } catch (error) {
    return null;
  }
}

/**
 * 检查环境变量
 */
function checkEnvironment() {
  printHeader();

  // 检查 .env 文件是否存在
  logIcon('check', '检查 .env 文件...', 'cyan');
  const envVars = loadEnvFile();

  if (!envVars) {
    logIcon('error', '.env 文件不存在！', 'red');
    log('\n请执行以下步骤：', 'yellow');
    log('1. 复制 .env.example 到 .env', 'yellow');
    log('2. 编辑 .env 并填入您的配置', 'yellow');
    log('\n示例命令:', 'cyan');
    log('  cp .env.example .env', 'cyan');
    process.exit(1);
  }

  logIcon('success', '.env 文件存在\n', 'green');

  // 检查每个必需的环境变量
  let hasErrors = false;
  let hasWarnings = false;

  requiredEnvVars.forEach((envVar) => {
    const value = envVars[envVar.name];
    const isConfigured = value && value !== `your_${envVar.name.toLowerCase()}_here` && !value.includes('placeholder');

    if (!isConfigured) {
      if (envVar.optional) {
        logIcon('warning', `${envVar.name} (可选)`, 'yellow');
        log(`  描述: ${envVar.description}`, 'yellow');
        log(`  状态: 未配置`, 'yellow');
        log(`  示例: ${envVar.example}\n`, 'yellow');
        hasWarnings = true;
      } else {
        logIcon('error', `${envVar.name} (必需)`, 'red');
        log(`  描述: ${envVar.description}`, 'red');
        log(`  状态: 未配置或使用占位符`, 'red');
        log(`  示例: ${envVar.example}\n`, 'red');
        hasErrors = true;
      }
    } else {
      logIcon('success', `${envVar.name}`, 'green');
      log(`  描述: ${envVar.description}`, 'green');
      log(`  状态: 已配置 ✓\n`, 'green');
    }
  });

  // 打印总结
  console.log('='.repeat(60));
  
  if (hasErrors) {
    logIcon('error', '环境检查失败！', 'red');
    log('\n请在 .env 文件中配置所有必需的环境变量。', 'yellow');
    log('配置完成后重新运行此脚本。\n', 'yellow');
    process.exit(1);
  } else if (hasWarnings) {
    logIcon('warning', '环境检查通过（有警告）', 'yellow');
    log('\n一些可选的环境变量未配置，这可能会影响某些功能。', 'yellow');
    log('您可以继续开发，但建议配置所有环境变量。\n', 'yellow');
    process.exit(0);
  } else {
    logIcon('success', '环境检查通过！所有配置正确 🎉', 'green');
    log('\n您可以开始开发了！', 'cyan');
    log('运行命令: npm run dev\n', 'cyan');
    process.exit(0);
  }
}

// 检查 Node.js 版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    logIcon('error', `Node.js 版本过低！`, 'red');
    log(`当前版本: ${nodeVersion}`, 'red');
    log(`需要版本: >= 18.0.0\n`, 'red');
    process.exit(1);
  }
}

// 主函数
function main() {
  try {
    checkNodeVersion();
    checkEnvironment();
  } catch (error) {
    logIcon('error', '环境检查过程中发生错误！', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
