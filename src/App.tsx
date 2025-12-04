import React from 'react';

const App: React.FC = () => {
  // 检查 Supabase 配置
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseKey && 
                       !supabaseUrl.includes('placeholder') && 
                       !supabaseKey.includes('placeholder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
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
            {isConfigured ? '✅' : '⚙️'} Supabase 配置状态
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

          {/* 状态总结 */}
          <div className={`mt-6 p-4 rounded-lg ${
            isConfigured 
              ? 'bg-green-500/20 border border-green-400/30' 
              : 'bg-yellow-500/20 border border-yellow-400/30'
          }`}>
            <div className="text-center">
              {isConfigured ? (
                <>
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-green-100 font-semibold">
                    Supabase 已正确配置！
                  </div>
                  <div className="text-green-200 text-sm mt-1">
                    可以开始使用数据库功能了
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">⚠️</div>
                  <div className="text-yellow-100 font-semibold">
                    请配置 Supabase 环境变量
                  </div>
                  <div className="text-yellow-200 text-sm mt-1">
                    编辑 .env 文件并重启开发服务器
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center">
          <p className="text-purple-300 text-sm">
            查看控制台了解更多配置详情 👉 按 F12 打开开发者工具
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
