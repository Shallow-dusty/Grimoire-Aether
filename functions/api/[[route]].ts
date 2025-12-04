import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'

// 定义环境变量类型
type Bindings = {
    LLM_API_KEY: string
    LLM_API_URL?: string
    LLM_MODEL?: string
}

// 创建 Hono 应用，基础路径为 /api
const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

// 启用 CORS
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
}))

// 健康检查路由
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasApiKey: !!c.env.LLM_API_KEY
    })
})

// AI 聊天路由
app.post('/ai/chat', async (c) => {
    const apiKey = c.env.LLM_API_KEY

    // 检查 API Key
    if (!apiKey) {
        return c.json({
            error: 'Missing Server-Side API Key',
            message: '请在 Cloudflare Pages 后台配置 LLM_API_KEY 环境变量'
        }, 500)
    }

    try {
        // 解析请求体
        const body = await c.req.json<{
            messages: Array<{ role: string; content: string }>;
            model?: string;
            stream?: boolean;
            temperature?: number;
            max_tokens?: number;
        }>()

        // 验证 messages
        if (!body.messages || !Array.isArray(body.messages)) {
            return c.json({
                error: 'Invalid request',
                message: 'messages 必须是一个数组'
            }, 400)
        }

        // 获取配置
        const apiUrl = c.env.LLM_API_URL || 'https://api.deepseek.com'
        const model = body.model || c.env.LLM_MODEL || 'deepseek-chat'

        // 调用 DeepSeek API
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: body.messages,
                stream: body.stream ?? false,
                temperature: body.temperature ?? 0.7,
                max_tokens: body.max_tokens ?? 2048
            })
        })

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text()
            console.error('LLM API Error:', response.status, errorText)
            return c.json({
                error: 'LLM API Error',
                status: response.status,
                message: errorText
            }, response.status as any)
        }

        // 返回 AI 响应
        const data = await response.json()
        return c.json(data)

    } catch (error) {
        console.error('AI Chat Error:', error)
        return c.json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

// 获取可用模型列表
app.get('/ai/models', async (c) => {
    const apiKey = c.env.LLM_API_KEY

    if (!apiKey) {
        return c.json({ error: 'Missing API Key' }, 500)
    }

    try {
        const apiUrl = c.env.LLM_API_URL || 'https://api.deepseek.com'
        const response = await fetch(`${apiUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })

        if (!response.ok) {
            return c.json({ error: 'Failed to fetch models' }, response.status as any)
        }

        const data = await response.json()
        return c.json(data)
    } catch (error) {
        return c.json({
            error: 'Failed to fetch models',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

// 404 处理
app.notFound((c) => {
    return c.json({
        error: 'Not Found',
        path: c.req.path
    }, 404)
})

// 错误处理
app.onError((err, c) => {
    console.error('Hono Error:', err)
    return c.json({
        error: 'Internal Server Error',
        message: err.message
    }, 500)
})

// 导出 Cloudflare Pages 处理器
export const onRequest = handle(app)
