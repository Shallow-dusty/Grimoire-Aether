import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理 API 请求到 Wrangler 本地服务器
      // 运行 `npm run dev:wrangler` 启动后端
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        // 如果后端未启动，不要阻塞前端
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Vite Proxy] API 代理错误，请确保后端已启动: npm run dev:wrangler')
          })
        }
      }
    }
  }
})
