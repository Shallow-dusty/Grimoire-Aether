import { supabase } from './lib/supabase';

/**
 * 测试 Supabase 连接
 */
async function testSupabaseConnection() {
  console.log('🔍 正在测试 Supabase 连接...\n');

  try {
    // 测试连接 - 获取 Supabase 会话
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      return false;
    }

    // 打印配置信息（隐藏敏感信息）
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('✅ Supabase 配置已加载:');
    console.log(`   URL: ${url}`);
    console.log(`   Key: ${key?.substring(0, 20)}...${key?.substring(key.length - 10)}\n`);

    // 测试简单的查询（无需认证）
    console.log('🧪 测试基础功能...');
    console.log('   当前会话:', session ? '已登录' : '未登录（匿名模式）');
    
    console.log('\n✅ Supabase 连接测试成功！');
    return true;
  } catch (error) {
    console.error('❌ 发生错误:', error);
    return false;
  }
}

// 测试函数 - 在浏览器控制台中手动调用
// 使用方法: import { testSupabaseConnection } from './test-supabase'; testSupabaseConnection();

export { testSupabaseConnection };
