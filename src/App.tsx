import React from 'react';

const App: React.FC = () => {
  // 检查 Supabase 配置（前端可访问）
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseKey.includes('placeholder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* 主标题 */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
            ✨ Grimoire Aether ✨
          </h1>
          <p className="text-xl text-purple-200">
            项目初始化成功！准备就绪 🚀
          </p>
        </div>

        {/* Supabase 配置状态卡片 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            {isSupabaseConfigured ? '✅' : '⚙️'} Supabase 配置状态
          </h2>

          <div className="space-y-3">
            {/* URL 状态 */}
            <div className="flex items-start gap-3">
              <span className="text-lg">{supabaseUrl && !supabaseUrl.includes('placeholder') ? '✅' : '❌'}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-200">项目 URL</div>
                <div className="text-white/90 font-mono text-sm break-all">
                  {supabaseUrl || '未配置'}
                </div>
              </div>
            </div>

            {/* Key 状态 */}
            <div className="flex items-start gap-3">
              <span className="text-lg">{supabaseKey && !supabaseKey.includes('placeholder') ? '✅' : '❌'}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-200">Anon Key</div>
                <div className="text-white/90 font-mono text-sm">
                  {supabaseKey
                    ? `${supabaseKey.substring(0, 20)}...${supabaseKey.substring(supabaseKey.length - 10)}`
                    : '未配置'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Supabase 状态总结 */}
          <div className={`mt-4 p-3 rounded-lg ${isSupabaseConfigured
            ? 'bg-green-500/20 border border-green-400/30'
            : 'bg-yellow-500/20 border border-yellow-400/30'
            }`}>
            <div className="text-center text-sm">
              {isSupabaseConfigured ? (
                <span className="text-green-100 font-medium">数据库已连接 ✓</span>
              ) : (
                <span className="text-yellow-100 font-medium">等待数据库配置</span>
              )}
            </div>
          </div>
        </div>

        {/* AI API 说明卡片 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            🤖 AI API 配置
          </h2>

          <div className="text-purple-200 text-sm space-y-2">
            <p>⚠️ <strong>安全提示</strong>：AI API Key 不应暴露给前端</p>
            <p>✅ 正确做法：在 Cloudflare Pages 后台设置 <code className="bg-white/10 px-1 rounded">LLM_API_KEY</code></p>
            <p>🔒 前端通过 <code className="bg-white/10 px-1 rounded">/api/chat</code> 调用后端接口</p>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
            <div className="text-center text-sm text-blue-100">
              请在 Cloudflare 后台配置 LLM_API_KEY
            </div>
          </div>
        </div>

        {/* 总体状态 */}
        <div className={`p-6 rounded-xl border-2 ${isSupabaseConfigured
          ? 'bg-green-500/20 border-green-400'
          : 'bg-blue-500/20 border-blue-400'
          }`}>
          <div className="text-center">
            <div className="text-4xl mb-3">{isSupabaseConfigured ? '🎉' : '📋'}</div>
            <div className={`text-2xl font-bold mb-2 ${isSupabaseConfigured ? 'text-green-100' : 'text-blue-100'}`}>
              {isSupabaseConfigured ? '前端配置完成！' : '等待配置'}
            </div>
            <div className={`${isSupabaseConfigured ? 'text-green-200' : 'text-blue-200'}`}>
              {isSupabaseConfigured ? (
                <>
                  <p className="mb-2">🎮 Supabase 已就绪</p>
                  <p className="text-sm">AI 功能需在后端配置 LLM_API_KEY</p>
                </>
              ) : (
                <p>请配置 Supabase 环境变量</p>
              )}
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-center">
          <p className="text-purple-300 text-sm">
            💡 按 F12 打开开发者工具查看详细信息
          </p>
          <p className="text-purple-400 text-xs mt-2">
            GitHub: <a href="https://github.com/Shallow-dusty/Grimoire-Aether" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300">Shallow-dusty/Grimoire-Aether</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
